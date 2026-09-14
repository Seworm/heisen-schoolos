import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  assessmentTypes,
  gradeBands,
  gradingSchemeItems,
  gradingSchemes,
  schools,
} from "@/db/schema";

const DEV_SCHOOL_SLUG =
  "heisen-demo-school";

const DEFAULT_SCHEME =
  "Standard Basic School Grading";

const DEFAULT_WEIGHTS = [
  {
    typeName: "CAT 1",
    weight: 15,
  },
  {
    typeName: "Homework",
    weight: 10,
  },
  {
    typeName: "Project",
    weight: 10,
  },
  {
    typeName: "CAT 2",
    weight: 15,
  },
  {
    typeName: "Examination",
    weight: 50,
  },
];

const DEFAULT_GRADES = [
  {
    grade: "A",
    label: "Excellent",
    minimumPercent: "80.00",
    maximumPercent: "100.00",
    remark: "Excellent performance",
    sortOrder: 1,
  },
  {
    grade: "B",
    label: "Very Good",
    minimumPercent: "70.00",
    maximumPercent: "79.99",
    remark: "Very good performance",
    sortOrder: 2,
  },
  {
    grade: "C",
    label: "Good",
    minimumPercent: "60.00",
    maximumPercent: "69.99",
    remark: "Good performance",
    sortOrder: 3,
  },
  {
    grade: "D",
    label: "Credit",
    minimumPercent: "50.00",
    maximumPercent: "59.99",
    remark: "Satisfactory performance",
    sortOrder: 4,
  },
  {
    grade: "E",
    label: "Pass",
    minimumPercent: "40.00",
    maximumPercent: "49.99",
    remark: "Pass",
    sortOrder: 5,
  },
  {
    grade: "F",
    label: "Fail",
    minimumPercent: "0.00",
    maximumPercent: "39.99",
    remark: "Needs improvement",
    sortOrder: 6,
  },
];


async function main() {
  const [school] =
    await db
      .select()
      .from(schools)
      .where(
        eq(
          schools.slug,
          DEV_SCHOOL_SLUG,
        ),
      )
      .limit(1);

  if (!school) {
    throw new Error(
      `School "${DEV_SCHOOL_SLUG}" not found.`,
    );
  }

  const [existingScheme] =
    await db
      .select()
      .from(gradingSchemes)
      .where(
        eq(
          gradingSchemes.name,
          DEFAULT_SCHEME,
        ),
      )
      .limit(1);

  let scheme = existingScheme;

  if (!scheme) {
    [scheme] =
      await db
        .insert(gradingSchemes)
        .values({
          schoolId: school.id,
          name: DEFAULT_SCHEME,
          description:
            "Default configurable grading scheme for the development school.",
          status: "active",
        })
        .returning();
  }

  for (
    const item of DEFAULT_WEIGHTS
  ) {
    const [assessmentType] =
      await db
        .select()
        .from(assessmentTypes)
        .where(
          eq(
            assessmentTypes.name,
            item.typeName,
          ),
        )
        .limit(1);

    if (!assessmentType) {
      console.warn(
        `Assessment type "${item.typeName}" was not found. Skipping.`,
      );
      continue;
    }

    await db
      .insert(
        gradingSchemeItems,
      )
      .values({
        gradingSchemeId:
          scheme.id,
        assessmentTypeId:
          assessmentType.id,
        weightPercent:
          item.weight.toFixed(2),
      })
      .onConflictDoUpdate({
        target: [
          gradingSchemeItems.gradingSchemeId,
          gradingSchemeItems.assessmentTypeId,
        ],
        set: {
          weightPercent:
            item.weight.toFixed(2),
          updatedAt: new Date(),
        },
      });
  }

  for (
    const grade of DEFAULT_GRADES
  ) {
    await db
      .insert(gradeBands)
      .values({
        gradingSchemeId:
          scheme.id,
        grade: grade.grade,
        label: grade.label,
        minimumPercent:
          grade.minimumPercent,
        maximumPercent:
          grade.maximumPercent,
        remark: grade.remark,
        sortOrder:
          grade.sortOrder,
      })
      .onConflictDoUpdate({
        target: [
          gradeBands.gradingSchemeId,
          gradeBands.grade,
        ],
        set: {
          label: grade.label,
          minimumPercent:
            grade.minimumPercent,
          maximumPercent:
            grade.maximumPercent,
          remark: grade.remark,
          sortOrder:
            grade.sortOrder,
          updatedAt: new Date(),
        },
      });
  }

  console.log(
    `Grading scheme "${scheme.name}" is ready.`,
  );
}


main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  academicYears,
  assessmentScores,
  assessmentTypes,
  assessments,
  classLevels,
  gradeBands,
  gradingSchemeItems,
  gradingSchemes,
  studentEnrollments,
  studentPlacements,
  students,
  streams,
  subjects,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

export type ResultDataset = {
  school: {
    id: string;
    name: string;
    slug: string;
  };

  academicYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };

  term: {
    id: string;
    name: string;
    termNumber: number;
    startDate: string;
    endDate: string;
  };

  stream: {
    id: string;
    name: string;
    capacity: number | null;
    classLevelId: string;
    className: string;
    classCategory: string;
  };

  gradingScheme: {
    id: string;
    name: string;
    status: string;
  } | null;

  gradingItems: Array<{
    assessmentTypeId: string;
    assessmentTypeName: string;
    category:
      | "continuous_assessment"
      | "examination";
    weightPercent: number;
  }>;

  gradeBands: Array<{
    id: string;
    grade: string;
    label: string | null;
    minimumPercent: number;
    maximumPercent: number;
    remark: string | null;
    sortOrder: number;
  }>;

  assessmentTypes: Array<{
    id: string;
    name: string;
    code: string | null;
    category:
      | "continuous_assessment"
      | "examination";
  }>;

  assessments: Array<{
    id: string;
    name: string;
    subjectId: string;
    subjectName: string;
    assessmentTypeId: string;
    assessmentTypeName: string;
    category:
      | "continuous_assessment"
      | "examination";
    maxScore: number;
    assessmentDate: string | null;
    status:
      | "draft"
      | "open"
      | "closed"
      | "published"
      | "archived";
  }>;

  students: Array<{
    id: string;
    studentNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    gender: "male" | "female";
  }>;

  scores: Array<{
    id: string;
    assessmentId: string;
    studentId: string;
    score: number;
    comment: string | null;
  }>;
};

function toNumber(value: string | number | null): number {
  if (value === null) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableString(
  value: string | null,
): string | null {
  return value ?? null;
}

/**
 * Load the complete result dataset for one
 * academic year, term and stream.
 *
 * This function performs database retrieval only.
 * Result calculations belong in src/lib/results.ts.
 */
export async function getResultDataset({
  academicYearId,
  termId,
  streamId,
}: {
  academicYearId: string;
  termId: string;
  streamId: string;
}): Promise<ResultDataset> {
  const school = await requireCurrentSchool();

  /*
   * ------------------------------------------------------------
   * 1. ACADEMIC YEAR
   * ------------------------------------------------------------
   */

  const [academicYear] = await db
    .select({
      id: academicYears.id,
      name: academicYears.name,
      startDate: academicYears.startDate,
      endDate: academicYears.endDate,
    })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, academicYearId),
        eq(academicYears.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!academicYear) {
    throw new Error(
      "The selected academic year does not belong to the current school.",
    );
  }

  /*
   * ------------------------------------------------------------
   * 2. TERM
   *
   * Terms are owned by academic years, not directly by schools.
   * ------------------------------------------------------------
   */

  const [term] = await db
    .select({
      id: terms.id,
      name: terms.name,
      termNumber: terms.termNumber,
      startDate: terms.startDate,
      endDate: terms.endDate,
    })
    .from(terms)
    .where(
      and(
        eq(terms.id, termId),
        eq(terms.academicYearId, academicYear.id),
      ),
    )
    .limit(1);

  if (!term) {
    throw new Error(
      "The selected term does not belong to the selected academic year.",
    );
  }

  /*
   * ------------------------------------------------------------
   * 3. STREAM
   *
   * Streams belong to class levels.
   * Class levels belong to schools.
   * ------------------------------------------------------------
   */

  const [stream] = await db
    .select({
      id: streams.id,
      name: streams.name,
      capacity: streams.capacity,
      classLevelId: streams.classLevelId,
      className: classLevels.name,
      classCategory: classLevels.category,
    })
    .from(streams)
    .innerJoin(
      classLevels,
      eq(
        streams.classLevelId,
        classLevels.id,
      ),
    )
    .where(
      and(
        eq(streams.id, streamId),
        eq(classLevels.schoolId, school.id),
      ),
    )
    .limit(1);

  if (!stream) {
    throw new Error(
      "The selected stream does not belong to the current school.",
    );
  }

  /*
   * ------------------------------------------------------------
   * 4. ACTIVE GRADING SCHEME
   *
   * Only one active scheme is permitted per school.
   * ------------------------------------------------------------
   */

  const [gradingScheme] = await db
    .select({
      id: gradingSchemes.id,
      name: gradingSchemes.name,
      status: gradingSchemes.status,
    })
    .from(gradingSchemes)
    .where(
      and(
        eq(gradingSchemes.schoolId, school.id),
        eq(gradingSchemes.status, "active"),
      ),
    )
    .limit(1);

  /*
   * ------------------------------------------------------------
   * 5. GRADING SCHEME ITEMS
   * ------------------------------------------------------------
   */

  let gradingItems: ResultDataset["gradingItems"] =
    [];

  if (gradingScheme) {
    const rows = await db
      .select({
        assessmentTypeId:
          gradingSchemeItems.assessmentTypeId,

        assessmentTypeName:
          assessmentTypes.name,

        category:
          assessmentTypes.category,

        weightPercent:
          gradingSchemeItems.weightPercent,
      })
      .from(gradingSchemeItems)
      .innerJoin(
        assessmentTypes,
        eq(
          gradingSchemeItems.assessmentTypeId,
          assessmentTypes.id,
        ),
      )
      .where(
        eq(
          gradingSchemeItems.gradingSchemeId,
          gradingScheme.id,
        ),
      )
      .orderBy(
        asc(assessmentTypes.name),
      );

    gradingItems = rows.map(
      (row) => ({
        assessmentTypeId:
          row.assessmentTypeId,

        assessmentTypeName:
          row.assessmentTypeName,

        category: row.category,

        weightPercent:
          toNumber(row.weightPercent),
      }),
    );
  }

  /*
   * ------------------------------------------------------------
   * 6. GRADE BANDS
   * ------------------------------------------------------------
   */

  let resultGradeBands: ResultDataset["gradeBands"] =
    [];

  if (gradingScheme) {
    const rows = await db
      .select({
        id: gradeBands.id,
        grade: gradeBands.grade,
        label: gradeBands.label,
        minimumPercent:
          gradeBands.minimumPercent,
        maximumPercent:
          gradeBands.maximumPercent,
        remark: gradeBands.remark,
        sortOrder: gradeBands.sortOrder,
      })
      .from(gradeBands)
      .where(
        eq(
          gradeBands.gradingSchemeId,
          gradingScheme.id,
        ),
      )
      .orderBy(
        asc(gradeBands.sortOrder),
        asc(gradeBands.minimumPercent),
      );

    resultGradeBands = rows.map(
      (row) => ({
        id: row.id,
        grade: row.grade,
        label: row.label,
        minimumPercent:
          toNumber(row.minimumPercent),
        maximumPercent:
          toNumber(row.maximumPercent),
        remark: row.remark,
        sortOrder: row.sortOrder,
      }),
    );
  }

  /*
   * ------------------------------------------------------------
   * 7. ASSESSMENT TYPES
   * ------------------------------------------------------------
   */

  const assessmentTypeRows =
    await db
      .select({
        id: assessmentTypes.id,
        name: assessmentTypes.name,
        code: assessmentTypes.code,
        category:
          assessmentTypes.category,
      })
      .from(assessmentTypes)
      .where(
        eq(
          assessmentTypes.schoolId,
          school.id,
        ),
      )
      .orderBy(
        asc(assessmentTypes.name),
      );

  const resultAssessmentTypes =
    assessmentTypeRows.map(
      (row) => ({
        id: row.id,
        name: row.name,
        code: toNullableString(row.code),
        category: row.category,
      }),
    );

  /*
   * ------------------------------------------------------------
   * 8. ASSESSMENTS
   *
   * Assessments are restricted to:
   * - current school
   * - selected academic year
   * - selected term
   * - selected stream
   * ------------------------------------------------------------
   */

  const assessmentRows = await db
    .select({
      id: assessments.id,
      name: assessments.name,

      subjectId: assessments.subjectId,
      subjectName: subjects.name,

      assessmentTypeId:
        assessments.assessmentTypeId,

      assessmentTypeName:
        assessmentTypes.name,

      category:
        assessmentTypes.category,

      maxScore:
        assessments.maxScore,

      assessmentDate:
        assessments.assessmentDate,

      status:
        assessments.status,
    })
    .from(assessments)
    .innerJoin(
      subjects,
      eq(
        assessments.subjectId,
        subjects.id,
      ),
    )
    .innerJoin(
      assessmentTypes,
      eq(
        assessments.assessmentTypeId,
        assessmentTypes.id,
      ),
    )
    .where(
      and(
        eq(
          assessments.schoolId,
          school.id,
        ),
        eq(
          assessments.academicYearId,
          academicYear.id,
        ),
        eq(
          assessments.termId,
          term.id,
        ),
        eq(
          assessments.streamId,
          stream.id,
        ),
        eq(
          subjects.schoolId,
          school.id,
        ),
        eq(
          assessmentTypes.schoolId,
          school.id,
        ),
      ),
    )
    .orderBy(
      asc(subjects.name),
      asc(assessments.assessmentDate),
      asc(assessments.name),
    );

  const resultAssessments =
    assessmentRows.map(
      (row) => ({
        id: row.id,
        name: row.name,

        subjectId:
          row.subjectId,

        subjectName:
          row.subjectName,

        assessmentTypeId:
          row.assessmentTypeId,

        assessmentTypeName:
          row.assessmentTypeName,

        category:
          row.category,

        maxScore:
          toNumber(row.maxScore),

        assessmentDate:
          row.assessmentDate,

        status:
          row.status,
      }),
    );

  /*
   * ------------------------------------------------------------
   * 9. STUDENTS
   *
   * Authoritative relationship:
   *
   * students
   *   ↓
   * student_enrollments
   *   ↓
   * student_placements
   *   ↓
   * streams
   *
   * We deliberately do not use
   * studentEnrollments.streamId here because that
   * field is explicitly transitional in the schema.
   * ------------------------------------------------------------
   */

  const studentRows = await db
    .select({
      id: students.id,
      studentNumber:
        students.studentNumber,
      firstName:
        students.firstName,
      middleName:
        students.middleName,
      lastName:
        students.lastName,
      gender:
        students.gender,
    })
    .from(studentPlacements)
    .innerJoin(
      studentEnrollments,
      eq(
        studentPlacements.studentEnrollmentId,
        studentEnrollments.id,
      ),
    )
    .innerJoin(
      students,
      eq(
        studentEnrollments.studentId,
        students.id,
      ),
    )
    .where(
      and(
        eq(
          studentPlacements.streamId,
          stream.id,
        ),
        eq(
          studentPlacements.status,
          "active",
        ),
        eq(
          studentEnrollments.academicYearId,
          academicYear.id,
        ),
        eq(
          studentEnrollments.status,
          "active",
        ),
        eq(
          students.schoolId,
          school.id,
        ),
      ),
    )
    .orderBy(
      asc(students.lastName),
      asc(students.firstName),
      asc(students.studentNumber),
    );

  /*
   * Prevent duplicate students from leaking into
   * the result dataset if the database ever contains
   * an unexpected duplicate relationship.
   */

  const uniqueStudents = new Map<
    string,
    ResultDataset["students"][number]
  >();

  for (const row of studentRows) {
    if (!uniqueStudents.has(row.id)) {
      uniqueStudents.set(row.id, {
        id: row.id,
        studentNumber:
          row.studentNumber,
        firstName:
          row.firstName,
        middleName:
          row.middleName,
        lastName:
          row.lastName,
        gender:
          row.gender,
      });
    }
  }

  const resultStudents =
    Array.from(
      uniqueStudents.values(),
    );

  /*
   * ------------------------------------------------------------
   * 10. SCORES
   *
   * Only scores belonging to assessments already
   * restricted to the selected school/year/term/stream
   * are loaded.
   * ------------------------------------------------------------
   */

  const assessmentIds =
    resultAssessments.map(
      (assessment) =>
        assessment.id,
    );

  let resultScores: ResultDataset["scores"] =
    [];

  if (
    assessmentIds.length > 0 &&
    resultStudents.length > 0
  ) {
    const studentIds =
      resultStudents.map(
        (student) =>
          student.id,
      );

    const scoreRows =
      await db
        .select({
          id: assessmentScores.id,
          assessmentId:
            assessmentScores.assessmentId,
          studentId:
            assessmentScores.studentId,
          score:
            assessmentScores.score,
          comment:
            assessmentScores.comment,
        })
        .from(assessmentScores)
        .where(
          and(
            inArray(
              assessmentScores.assessmentId,
              assessmentIds,
            ),
            inArray(
              assessmentScores.studentId,
              studentIds,
            ),
          ),
        );

    resultScores =
      scoreRows.map(
        (row) => ({
          id: row.id,
          assessmentId:
            row.assessmentId,
          studentId:
            row.studentId,
          score:
            toNumber(row.score),
          comment:
            row.comment,
        }),
      );
  }

  /*
   * ------------------------------------------------------------
   * 11. RETURN COMPLETE DATASET
   * ------------------------------------------------------------
   */

  return {
    school: {
      id: school.id,
      name: school.name,
      slug: school.slug,
    },

    academicYear: {
      id: academicYear.id,
      name: academicYear.name,
      startDate:
        academicYear.startDate,
      endDate:
        academicYear.endDate,
    },

    term: {
      id: term.id,
      name: term.name,
      termNumber:
        term.termNumber,
      startDate:
        term.startDate,
      endDate:
        term.endDate,
    },

    stream: {
      id: stream.id,
      name: stream.name,
      capacity:
        stream.capacity,
      classLevelId:
        stream.classLevelId,
      className:
        stream.className,
      classCategory:
        stream.classCategory,
    },

    gradingScheme:
      gradingScheme
        ? {
            id: gradingScheme.id,
            name: gradingScheme.name,
            status:
              gradingScheme.status,
          }
        : null,

    gradingItems,

    gradeBands:
      resultGradeBands,

    assessmentTypes:
      resultAssessmentTypes,

    assessments:
      resultAssessments,

    students:
      resultStudents,

    scores:
      resultScores,
  };
}
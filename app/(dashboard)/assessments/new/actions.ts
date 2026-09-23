"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  academicYears,
  assessmentPeriods,
  assessmentTypes,
  assessments,
  classLevels,
  classSubjects,
  streams,
  subjects,
  terms,
} from "@/db/schema";
import { requireCurrentSchool } from "@/lib/current-school";

type ActionState = {
  error?: string;
};

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function createAssessment(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const academicYearId = String(
    formData.get("academicYearId") ?? "",
  ).trim();

  const termId = String(
    formData.get("termId") ?? "",
  ).trim();

  const assessmentPeriodId = String(
    formData.get("assessmentPeriodId") ?? "",
  ).trim();

  const streamId = String(
    formData.get("streamId") ?? "",
  ).trim();

  const subjectId = String(
    formData.get("subjectId") ?? "",
  ).trim();

  const assessmentTypeId = String(
    formData.get("assessmentTypeId") ?? "",
  ).trim();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const maxScoreValue = String(
    formData.get("maxScore") ?? "",
  ).trim();

  const assessmentDate =
    String(
      formData.get("assessmentDate") ?? "",
    ).trim() || null;

  const instructions =
    String(
      formData.get("instructions") ?? "",
    ).trim() || null;

  /*
   * ------------------------------------------------------------
   * Basic validation
   * ------------------------------------------------------------
   */

  if (
    !academicYearId ||
    !termId ||
    !assessmentPeriodId ||
    !streamId ||
    !subjectId ||
    !assessmentTypeId ||
    !name ||
    !maxScoreValue
  ) {
    return {
      error:
        "All required assessment fields must be completed.",
    };
  }

  if (name.length > 200) {
    return {
      error:
        "Assessment name must be 200 characters or fewer.",
    };
  }

  const maxScore = Number(maxScoreValue);

  if (
    !Number.isFinite(maxScore) ||
    maxScore <= 0
  ) {
    return {
      error:
        "Maximum score must be greater than zero.",
    };
  }

  if (maxScore > 999999.99) {
    return {
      error:
        "Maximum score is too large.",
    };
  }

  if (
    assessmentDate &&
    !isValidDate(assessmentDate)
  ) {
    return {
      error:
        "Assessment date is invalid.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Current school
   * ------------------------------------------------------------
   */

  const school =
    await requireCurrentSchool();

  /*
   * ------------------------------------------------------------
   * Academic year
   *
   * Must belong to the current school.
   * ------------------------------------------------------------
   */

  const [year] = await db
    .select({
      id: academicYears.id,
      startDate: academicYears.startDate,
      endDate: academicYears.endDate,
    })
    .from(academicYears)
    .where(
      and(
        eq(
          academicYears.id,
          academicYearId,
        ),
        eq(
          academicYears.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  if (!year) {
    return {
      error:
        "The selected academic year is invalid.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Term
   *
   * Must belong to the selected academic year.
   * ------------------------------------------------------------
   */

  const [term] = await db
    .select({
      id: terms.id,
      startDate: terms.startDate,
      endDate: terms.endDate,
    })
    .from(terms)
    .where(
      and(
        eq(terms.id, termId),
        eq(
          terms.academicYearId,
          academicYearId,
        ),
      ),
    )
    .limit(1);

  if (!term) {
    return {
      error:
        "The selected term is invalid.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Assessment period
   *
   * Must belong to:
   * - current school
   * - selected academic year
   * - selected term
   * ------------------------------------------------------------
   */

  const [period] = await db
    .select({
      id: assessmentPeriods.id,
      startDate: assessmentPeriods.startDate,
      endDate: assessmentPeriods.endDate,
      status: assessmentPeriods.status,
    })
    .from(assessmentPeriods)
    .where(
      and(
        eq(
          assessmentPeriods.id,
          assessmentPeriodId,
        ),
        eq(
          assessmentPeriods.schoolId,
          school.id,
        ),
        eq(
          assessmentPeriods.academicYearId,
          academicYearId,
        ),
        eq(
          assessmentPeriods.termId,
          termId,
        ),
      ),
    )
    .limit(1);

  if (!period) {
    return {
      error:
        "The selected assessment period is invalid.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Assessment period status
   *
   * Archived periods cannot receive new assessments.
   * ------------------------------------------------------------
   */

  if (period.status === "archived") {
    return {
      error:
        "Assessments cannot be created in an archived assessment period.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Assessment date validation
   *
   * Date must fall within the selected period when the
   * period has defined boundaries.
   * ------------------------------------------------------------
   */

  if (
    assessmentDate &&
    period.startDate &&
    assessmentDate < period.startDate
  ) {
    return {
      error:
        "Assessment date cannot be before the assessment period starts.",
    };
  }

  if (
    assessmentDate &&
    period.endDate &&
    assessmentDate > period.endDate
  ) {
    return {
      error:
        "Assessment date cannot be after the assessment period ends.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Assessment date validation against academic year
   * ------------------------------------------------------------
   */

  if (
    assessmentDate &&
    year.startDate &&
    assessmentDate < year.startDate
  ) {
    return {
      error:
        "Assessment date cannot be before the academic year starts.",
    };
  }

  if (
    assessmentDate &&
    year.endDate &&
    assessmentDate > year.endDate
  ) {
    return {
      error:
        "Assessment date cannot be after the academic year ends.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Assessment date validation against term
   * ------------------------------------------------------------
   */

  if (
    assessmentDate &&
    term.startDate &&
    assessmentDate < term.startDate
  ) {
    return {
      error:
        "Assessment date cannot be before the selected term starts.",
    };
  }

  if (
    assessmentDate &&
    term.endDate &&
    assessmentDate > term.endDate
  ) {
    return {
      error:
        "Assessment date cannot be after the selected term ends.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Stream
   *
   * Must belong to a class level belonging to the
   * current school.
   * ------------------------------------------------------------
   */

  const [stream] = await db
    .select({
      id: streams.id,
      classLevelId: streams.classLevelId,
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
        eq(
          classLevels.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  if (!stream) {
    return {
      error:
        "The selected stream does not belong to this school.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Subject
   *
   * Must belong to the current school.
   * ------------------------------------------------------------
   */

  const [subject] = await db
    .select({
      id: subjects.id,
      activityBased: subjects.activityBased,
      examinable: subjects.examinable,
    })
    .from(subjects)
    .where(
      and(
        eq(
          subjects.id,
          subjectId,
        ),
        eq(
          subjects.schoolId,
          school.id,
        ),
      ),
    )
    .limit(1);

  if (!subject) {
    return {
      error:
        "The selected subject is invalid.",
    };
  }

  if (subject.activityBased || !subject.examinable) {
    return {
      error:
        "Activity-based subjects cannot be used for examinable assessments.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Class-subject assignment
   *
   * The subject must actually be offered by the class level
   * containing the selected stream.
   *
   * The class level is also explicitly tied to the current
   * school here.
   * ------------------------------------------------------------
   */

  const [subjectAssignment] =
    await db
      .select({
        id: classSubjects.id,
      })
      .from(classSubjects)
      .innerJoin(
        classLevels,
        eq(
          classSubjects.classLevelId,
          classLevels.id,
        ),
      )
      .where(
        and(
          eq(
            classSubjects.classLevelId,
            stream.classLevelId,
          ),
          eq(
            classSubjects.subjectId,
            subjectId,
          ),
          eq(
            classLevels.schoolId,
            school.id,
          ),
        ),
      )
      .limit(1);

  if (!subjectAssignment) {
    return {
      error:
        "This subject is not assigned to the selected class.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Assessment type
   *
   * Must belong to the current school.
   * ------------------------------------------------------------
   */

  const [assessmentType] =
    await db
      .select({
        id: assessmentTypes.id,
      })
      .from(assessmentTypes)
      .where(
        and(
          eq(
            assessmentTypes.id,
            assessmentTypeId,
          ),
          eq(
            assessmentTypes.schoolId,
            school.id,
          ),
        ),
      )
      .limit(1);

  if (!assessmentType) {
    return {
      error:
        "The selected assessment type is invalid.",
    };
  }

  /*
   * ------------------------------------------------------------
   * Create assessment
   * ------------------------------------------------------------
   */

  try {
    const [created] = await db
      .insert(assessments)
      .values({
        schoolId: school.id,
        academicYearId,
        termId,
        assessmentPeriodId,
        streamId,
        subjectId,
        assessmentTypeId,
        name,
        maxScore: maxScore.toFixed(2),
        assessmentDate,
        status: "draft",
        instructions,
      })
      .returning({
        id: assessments.id,
      });

    if (!created) {
      return {
        error:
          "Assessment could not be created.",
      };
    }

    redirect(
      `/assessments/${created.id}`,
    );
  } catch (error) {
    console.error(
      "Failed to create assessment:",
      error,
    );

    return {
      error:
        "Assessment could not be created. Please try again.",
    };
  }
}

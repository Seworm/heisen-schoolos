import type { ResultDataset } from "@/lib/result-data";
import {
  calculateStudentResult,
  type StudentSubjectResultInput,
} from "@/lib/results";
import type { GradeBand } from "@/lib/grading";

export type ResultReadinessSeverity =
  | "error"
  | "warning";

export type ResultReadinessIssue = {
  code: string;
  severity: ResultReadinessSeverity;
  message: string;
  studentId?: string;
  studentName?: string;
  subjectId?: string;
  subjectName?: string;
  assessmentId?: string;
  assessmentName?: string;
};

export type ResultReadinessSummary = {
  students: number;
  studentsWithCompleteResults: number;
  studentsWithIncompleteResults: number;

  assessments: number;
  assessmentsWithScores: number;
  assessmentsWithMissingScores: number;

  subjects: number;

  gradingSchemeValid: boolean;
  weightsValid: boolean;
  gradeBandsValid: boolean;

  ready: boolean;

  errors: ResultReadinessIssue[];
  warnings: ResultReadinessIssue[];
};

function studentName(
  student: ResultDataset["students"][number],
): string {
  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Build the result inputs required by the calculation engine
 * for one student.
 *
 * Every assessment is included, even when the student has no
 * score. This is intentional because the readiness engine must
 * detect missing scores separately instead of silently treating
 * them as zero for publication.
 */
function buildStudentSubjectInputs(
  dataset: ResultDataset,
  studentId: string,
): StudentSubjectResultInput[] {
  const studentAssessments =
    dataset.assessments;

  const subjectIds = Array.from(
    new Set(
      studentAssessments.map(
        (assessment) =>
          assessment.subjectId,
      ),
    ),
  );

  return subjectIds.map(
    (subjectId) => {
      const assessments =
        studentAssessments
          .filter(
            (assessment) =>
              assessment.subjectId ===
              subjectId,
          )
          .map(
            (assessment) => {
              const score =
                dataset.scores.find(
                  (entry) =>
                    entry.studentId ===
                      studentId &&
                    entry.assessmentId ===
                      assessment.id,
                );

              const gradingItem =
                dataset.gradingItems.find(
                  (item) =>
                    item.assessmentTypeId ===
                    assessment.assessmentTypeId,
                );

              return {
                assessmentId:
                  assessment.id,

                assessmentTypeId:
                  assessment.assessmentTypeId,

                assessmentTypeName:
                  assessment.assessmentTypeName,

                assessmentName:
                  assessment.name,

                category:
                  assessment.category,

                score:
                  score?.score ?? 0,

                maxScore:
                  assessment.maxScore,

                weightPercent:
                  gradingItem?.weightPercent ??
                  0,
              };
            },
          );

      const subjectName =
        dataset.assessments.find(
          (assessment) =>
            assessment.subjectId ===
            subjectId,
        )?.subjectName ??
        "Unknown subject";

      return {
        subjectId,
        subjectName,
        assessments,
      };
    },
  );
}

/**
 * Validate that the active grading configuration is
 * structurally suitable for publication.
 */
function validateGradingConfiguration(
  dataset: ResultDataset,
): {
  errors: ResultReadinessIssue[];
  warnings: ResultReadinessIssue[];
  weightsValid: boolean;
  gradeBandsValid: boolean;
} {
  const errors: ResultReadinessIssue[] =
    [];

  const warnings: ResultReadinessIssue[] =
    [];

  if (!dataset.gradingScheme) {
    errors.push({
      code: "NO_ACTIVE_GRADING_SCHEME",
      severity: "error",
      message:
        "No active grading scheme is configured for this school.",
    });

    return {
      errors,
      warnings,
      weightsValid: false,
      gradeBandsValid: false,
    };
  }

  if (
    dataset.gradingItems.length === 0
  ) {
    errors.push({
      code: "NO_GRADING_ITEMS",
      severity: "error",
      message:
        "The active grading scheme has no assessment weights configured.",
    });

    return {
      errors,
      warnings,
      weightsValid: false,
      gradeBandsValid: false,
    };
  }

  const totalWeight =
    roundToTwo(
      dataset.gradingItems.reduce(
        (sum, item) =>
          sum + item.weightPercent,
        0,
      ),
    );

  const continuousWeight =
    roundToTwo(
      dataset.gradingItems
        .filter(
          (item) =>
            item.category ===
            "continuous_assessment",
        )
        .reduce(
          (sum, item) =>
            sum + item.weightPercent,
          0,
        ),
    );

  const examinationWeight =
    roundToTwo(
      dataset.gradingItems
        .filter(
          (item) =>
            item.category ===
            "examination",
        )
        .reduce(
          (sum, item) =>
            sum + item.weightPercent,
          0,
        ),
    );

  let weightsValid = true;

  if (totalWeight !== 100) {
    weightsValid = false;

    errors.push({
      code: "INVALID_TOTAL_WEIGHT",
      severity: "error",
      message:
        `Assessment weights total ${totalWeight}%. They must total exactly 100%.`,
    });
  }

  if (continuousWeight !== 50) {
    weightsValid = false;

    errors.push({
      code: "INVALID_CA_WEIGHT",
      severity: "error",
      message:
        `Continuous assessment weights total ${continuousWeight}%. They must total exactly 50%.`,
    });
  }

  if (examinationWeight !== 50) {
    weightsValid = false;

    errors.push({
      code: "INVALID_EXAM_WEIGHT",
      severity: "error",
      message:
        `Examination weights total ${examinationWeight}%. They must total exactly 50%.`,
    });
  }

  const gradeBands =
    dataset.gradeBands;

  let gradeBandsValid =
    gradeBands.length > 0;

  if (gradeBands.length === 0) {
    gradeBandsValid = false;

    errors.push({
      code: "NO_GRADE_BANDS",
      severity: "error",
      message:
        "The active grading scheme has no grade bands.",
    });
  }

  if (gradeBands.length > 0) {
    const sorted =
      [...gradeBands].sort(
        (a, b) =>
          a.minimumPercent -
          b.minimumPercent,
      );

    if (
      sorted[0].minimumPercent !==
      0
    ) {
      gradeBandsValid = false;

      errors.push({
        code: "GRADE_BANDS_NOT_STARTING_AT_ZERO",
        severity: "error",
        message:
          "Grade bands must start at 0%.",
      });
    }

    const last =
      sorted[sorted.length - 1];

    if (
      last.maximumPercent !==
      100
    ) {
      gradeBandsValid = false;

      errors.push({
        code: "GRADE_BANDS_NOT_ENDING_AT_100",
        severity: "error",
        message:
          "Grade bands must end at 100%.",
      });
    }

    for (
      let index = 0;
      index < sorted.length - 1;
      index++
    ) {
      const current =
        sorted[index];

      const next =
        sorted[index + 1];

      const expected =
        roundToTwo(
          current.maximumPercent +
            0.01,
        );

      if (
        next.minimumPercent !==
        expected
      ) {
        gradeBandsValid = false;

        errors.push({
          code: "GRADE_BAND_GAP_OR_OVERLAP",
          severity: "error",
          message:
            "Grade bands contain a gap or overlap.",
        });

        break;
      }
    }
  }

  return {
    errors,
    warnings,
    weightsValid,
    gradeBandsValid,
  };
}

/**
 * Validate the complete result set for publication.
 */
export function checkResultReadiness(
  dataset: ResultDataset,
): ResultReadinessSummary {
  const errors: ResultReadinessIssue[] =
    [];

  const warnings: ResultReadinessIssue[] =
    [];

  const gradingValidation =
    validateGradingConfiguration(
      dataset,
    );

  errors.push(
    ...gradingValidation.errors,
  );

  warnings.push(
    ...gradingValidation.warnings,
  );

  const studentCount =
    dataset.students.length;

  const assessmentCount =
    dataset.assessments.length;

  const uniqueSubjectIds =
    new Set(
      dataset.assessments.map(
        (assessment) =>
          assessment.subjectId,
      ),
    );

  const studentsWithCompleteResults =
    new Set<string>();

  let assessmentsWithScores = 0;

  let assessmentsWithMissingScores =
    0;

  /**
   * Every assessment must have a score for
   * every active student before publication.
   */
  for (const assessment of dataset.assessments) {
    let assessmentComplete = true;

    for (const student of dataset.students) {
      const score =
        dataset.scores.find(
          (entry) =>
            entry.assessmentId ===
              assessment.id &&
            entry.studentId ===
              student.id,
        );

      if (!score) {
        assessmentComplete = false;

        errors.push({
          code: "MISSING_SCORE",
          severity: "error",
          message:
            `${studentName(student)} is missing a score for ${assessment.name}.`,
          studentId:
            student.id,
          studentName:
            studentName(student),
          assessmentId:
            assessment.id,
          assessmentName:
            assessment.name,
          subjectId:
            assessment.subjectId,
          subjectName:
            assessment.subjectName,
        });
      }
    }

    if (assessmentComplete) {
      assessmentsWithScores++;
    } else {
      assessmentsWithMissingScores++;
    }
  }

  /**
   * A student is complete only when every assessment
   * has a score and every score is valid.
   */
  for (const student of dataset.students) {
    let complete = true;

    for (const assessment of dataset.assessments) {
      const score =
        dataset.scores.find(
          (entry) =>
            entry.studentId ===
              student.id &&
            entry.assessmentId ===
              assessment.id,
        );

      if (!score) {
        complete = false;
        continue;
      }

      if (
        score.score < 0 ||
        score.score >
          assessment.maxScore
      ) {
        complete = false;

        errors.push({
          code: "INVALID_SCORE",
          severity: "error",
          message:
            `${studentName(student)} has an invalid score for ${assessment.name}.`,
          studentId:
            student.id,
          studentName:
            studentName(student),
          assessmentId:
            assessment.id,
          assessmentName:
            assessment.name,
          subjectId:
            assessment.subjectId,
          subjectName:
            assessment.subjectName,
        });
      }
    }

    if (complete) {
      studentsWithCompleteResults.add(
        student.id,
      );
    }
  }

  /**
   * Ensure every assessment type used by the
   * assessments has a grading weight.
   */
  for (const assessment of dataset.assessments) {
    const gradingItem =
      dataset.gradingItems.find(
        (item) =>
          item.assessmentTypeId ===
          assessment.assessmentTypeId,
      );

    if (!gradingItem) {
      errors.push({
        code: "ASSESSMENT_TYPE_NOT_IN_GRADING_SCHEME",
        severity: "error",
        message:
          `${assessment.name} uses an assessment type that is not configured in the active grading scheme.`,
        assessmentId:
          assessment.id,
        assessmentName:
          assessment.name,
        subjectId:
          assessment.subjectId,
        subjectName:
          assessment.subjectName,
      });
    }
  }

  /**
   * Ensure examination and CA components actually exist.
   */
  const hasContinuousAssessment =
    dataset.assessments.some(
      (assessment) =>
        assessment.category ===
        "continuous_assessment",
    );

  const hasExamination =
    dataset.assessments.some(
      (assessment) =>
        assessment.category ===
        "examination",
    );

  if (!hasContinuousAssessment) {
    errors.push({
      code: "NO_CONTINUOUS_ASSESSMENT",
      severity: "error",
      message:
        "No continuous assessment has been created for this result set.",
    });
  }

  if (!hasExamination) {
    errors.push({
      code: "NO_EXAMINATION",
      severity: "error",
      message:
        "No examination has been created for this result set.",
    });
  }

  /**
   * No active students is not currently a hard
   * publication error, but it is surfaced as a warning.
   */
  if (dataset.students.length === 0) {
    warnings.push({
      code: "NO_STUDENTS",
      severity: "warning",
      message:
        "There are no active students in this stream.",
    });
  }

  if (dataset.assessments.length === 0) {
    errors.push({
      code: "NO_ASSESSMENTS",
      severity: "error",
      message:
        "No assessments have been created for this class and term.",
    });
  }

  return {
    students:
      studentCount,

    studentsWithCompleteResults:
      studentsWithCompleteResults.size,

    studentsWithIncompleteResults:
      studentCount -
      studentsWithCompleteResults.size,

    assessments:
      assessmentCount,

    assessmentsWithScores:
      assessmentsWithScores,

    assessmentsWithMissingScores:
      assessmentsWithMissingScores,

    subjects:
      uniqueSubjectIds.size,

    gradingSchemeValid:
      Boolean(
        dataset.gradingScheme,
      ),

    weightsValid:
      gradingValidation.weightsValid,

    gradeBandsValid:
      gradingValidation.gradeBandsValid,

    ready:
      errors.length === 0,

    errors,

    warnings,
  };
}

/**
 * Calculate one student's complete result
 * using the exact grading configuration
 * stored in the dataset.
 *
 * This should only be used after readiness
 * validation has passed.
 */
export function calculateReadyStudentResult(
  dataset: ResultDataset,
  studentId: string,
) {
  const student =
    dataset.students.find(
      (entry) =>
        entry.id === studentId,
    );

  if (!student) {
    throw new Error(
      "Student was not found in the result dataset.",
    );
  }

  const subjectInputs =
    buildStudentSubjectInputs(
      dataset,
      studentId,
    );

  const gradeBands: GradeBand[] =
    dataset.gradeBands.map(
      (band) => ({
        grade: band.grade,
        label: band.label,
        minimumPercent:
          band.minimumPercent,
        maximumPercent:
          band.maximumPercent,
        remark: band.remark,
      }),
    );

  return calculateStudentResult(
    {
      id: student.id,
      studentNumber:
        student.studentNumber,
      firstName:
        student.firstName,
      middleName:
        student.middleName,
      lastName:
        student.lastName,
    },
    subjectInputs,
    gradeBands,
  );
}

/**
 * Calculate every student's result.
 *
 * This function does not itself decide whether
 * publication is allowed. Publication must first
 * pass checkResultReadiness().
 */
export function calculateAllReadyStudentResults(
  dataset: ResultDataset,
) {
  return dataset.students.map(
    (student) =>
      calculateReadyStudentResult(
        dataset,
        student.id,
      ),
  );
}
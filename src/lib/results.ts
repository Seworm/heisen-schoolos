import {
  calculatePercentage,
  getGradeFromBands,
  roundToTwoDecimals,
  type GradeBand,
} from "@/lib/grading";

export type AssessmentCategory =
  | "continuous_assessment"
  | "examination";

  export type AssessmentResultInput = {
  assessmentId: string;
  assessmentTypeId: string;
  assessmentTypeName: string;
  assessmentName: string;
  category:
    | "continuous_assessment"
    | "examination";
  score: number;
  maxScore: number;
  weightPercent: number;
};

export type AssessmentResultOutput =
  AssessmentResultInput & {
    percentage: number;
    weightedContribution: number;
};

export type SubjectResult = {
  subjectId: string;
  subjectName: string;

  classScore: number;
  examinationScore: number;

  finalPercentage: number;

  grade: GradeBand | null;

  assessments: AssessmentResultOutput[];
};

export type StudentResult = {
  studentId: string;
  studentNumber: string | null;
  studentName: string;

  subjects: SubjectResult[];

  overallPercentage: number;
};

export type StudentSubjectResultInput = {
  subjectId: string;
  subjectName: string;
  assessments: AssessmentResultInput[];
};

/**
 * Calculates the result for one subject.
 *
 * Every assessment is first converted to a percentage.
 *
 * Example:
 *
 * CAT 1: 24/30 = 80%
 * Weight: 15%
 * Contribution: 12/100
 *
 * Continuous assessment components must total 50%.
 * Examination components must total 50%.
 */
export function calculateSubjectResult(
  input: StudentSubjectResultInput,
  gradeBands: GradeBand[],
): SubjectResult {
  const assessments =
    input.assessments.map(
      (assessment) => {
        const percentage =
          calculatePercentage(
            assessment.score,
            assessment.maxScore,
          );

        const weightedContribution =
          roundToTwoDecimals(
            (percentage *
              assessment.weightPercent) /
              100,
          );

        return {
          ...assessment,
          percentage,
          weightedContribution,
        };
      },
    );

  const classScore =
    roundToTwoDecimals(
      assessments
        .filter(
          (assessment) =>
            assessment.category ===
            "continuous_assessment",
        )
        .reduce(
          (sum, assessment) =>
            sum +
            assessment.weightedContribution,
          0,
        ),
    );

  const examinationScore =
    roundToTwoDecimals(
      assessments
        .filter(
          (assessment) =>
            assessment.category ===
            "examination",
        )
        .reduce(
          (sum, assessment) =>
            sum +
            assessment.weightedContribution,
          0,
        ),
    );

  const finalPercentage =
    roundToTwoDecimals(
      classScore +
        examinationScore,
    );

  const grade =
    getGradeFromBands(
      finalPercentage,
      gradeBands,
    );

  return {
    subjectId:
      input.subjectId,

    subjectName:
      input.subjectName,

    classScore,

    examinationScore,

    finalPercentage,

    grade,

    assessments,
  };
}

/**
 * Calculates all subject results for one student.
 */
export function calculateStudentResult(
  student: {
    id: string;
    studentNumber: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string;
  },
  subjects: StudentSubjectResultInput[],
  gradeBands: GradeBand[],
): StudentResult {
  const subjectResults =
    subjects.map(
      (subject) =>
        calculateSubjectResult(
          subject,
          gradeBands,
        ),
    );

  const percentages =
    subjectResults.map(
      (subject) =>
        subject.finalPercentage,
    );

  const overallPercentage =
    calculateClassAverage(
      percentages,
    );

  const studentName = [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    studentId: student.id,
    studentNumber:
      student.studentNumber,
    studentName,
    subjects:
      subjectResults,
    overallPercentage,
  };
}

/**
 * Calculates the average of valid percentages.
 */
export function calculateClassAverage(
  percentages: number[],
): number {
  const validValues =
    percentages.filter(
      (value) =>
        Number.isFinite(value),
    );

  if (validValues.length === 0) {
    return 0;
  }

  const total =
    validValues.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  return roundToTwoDecimals(
    total / validValues.length,
  );
}

export type RankedResult = {
  studentId: string;
  percentage: number;
};

export type RankedResultWithPosition =
  RankedResult & {
    position: number;
  };

/**
 * Calculates competition ranking.
 *
 * Example:
 *
 * 1st  90%
 * 2nd  85%
 * 2nd  85%
 * 4th  80%
 */
export function calculatePosition(
  results: RankedResult[],
): RankedResultWithPosition[] {
  const sorted =
    [...results].sort(
      (a, b) => {
        if (
          b.percentage !==
          a.percentage
        ) {
          return (
            b.percentage -
            a.percentage
          );
        }

        return a.studentId.localeCompare(
          b.studentId,
        );
      },
    );

  let previousScore:
    | number
    | null = null;

  let previousPosition = 0;

  return sorted.map(
    (result, index) => {
      const score =
        roundToTwoDecimals(
          result.percentage,
        );

      if (
        previousScore === null ||
        score !== previousScore
      ) {
        previousPosition =
          index + 1;
      }

      previousScore = score;

      return {
        ...result,
        percentage: score,
        position:
          previousPosition,
      };
    },
  );
}
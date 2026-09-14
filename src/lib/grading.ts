export type GradeBand = {
  grade: string;
  label: string | null;
  minimumPercent: number;
  maximumPercent: number;
  remark: string | null;
};

export type AssessmentWeight = {
  assessmentTypeId: string;
  weightPercent: number;
};

export type AssessmentResult = {
  score: number;
  percentage: number;
  grade: string;
  remark: string;
};

/**
 * Calculate percentage from a raw score.
 */
export function calculatePercentage(
  score: number,
  maxScore: number,
): number {
  if (
    !Number.isFinite(score) ||
    !Number.isFinite(maxScore) ||
    maxScore <= 0
  ) {
    return 0;
  }

  const percentage = (score / maxScore) * 100;

  return roundToTwoDecimals(
    Math.max(0, Math.min(100, percentage)),
  );
}

/**
 * Calculate weighted contribution.
 */
export function calculateWeightedContribution(
  percentage: number,
  weightPercent: number,
): number {
  if (
    !Number.isFinite(percentage) ||
    !Number.isFinite(weightPercent)
  ) {
    return 0;
  }

  return roundToTwoDecimals(
    (percentage * weightPercent) / 100,
  );
}

/**
 * Calculate final percentage from weighted contributions.
 */
export function calculateFinalPercentage(
  contributions: number[],
): number {
  const total = contributions.reduce(
    (sum, value) =>
      sum + (Number.isFinite(value) ? value : 0),
    0,
  );

  return roundToTwoDecimals(
    Math.max(0, Math.min(100, total)),
  );
}

/**
 * Calculate the result of a single assessment.
 *
 * This preserves the interface expected by the
 * existing assessment detail page and score-entry UI.
 */
export function calculateAssessmentResult(
  score: number,
  maxScore: number,
  gradeBands: GradeBand[] = [],
): AssessmentResult {
  const percentage = calculatePercentage(
    score,
    maxScore,
  );

  const gradeBand = getGradeFromBands(
    percentage,
    gradeBands,
  );

  return {
    score,
    percentage,
    grade: gradeBand?.grade ?? "",
    remark:
      gradeBand?.remark ??
      gradeBand?.label ??
      "",
  };
}

/**
 * Calculate the average of numeric values.
 */
export function calculateAverage(
  values: number[],
): number {
  if (values.length === 0) {
    return 0;
  }

  const validValues = values.filter(
    (value) => Number.isFinite(value),
  );

  if (validValues.length === 0) {
    return 0;
  }

  const total = validValues.reduce(
    (sum, value) => sum + value,
    0,
  );

  return roundToTwoDecimals(
    total / validValues.length,
  );
}

/**
 * Determine the grade corresponding to a percentage.
 */
export function getGradeFromBands(
  percentage: number,
  bands: GradeBand[],
): GradeBand | null {
  const normalized = Math.max(
    0,
    Math.min(100, percentage),
  );

  return (
    bands.find(
      (band) =>
        normalized >= band.minimumPercent &&
        normalized <= band.maximumPercent,
    ) ?? null
  );
}

/**
 * Validate assessment weights.
 */
export function validateAssessmentWeights(
  weights: number[],
): {
  valid: boolean;
  total: number;
  error?: string;
} {
  const total = roundToTwoDecimals(
    weights.reduce(
      (sum, weight) =>
        sum +
        (Number.isFinite(weight)
          ? weight
          : 0),
      0,
    ),
  );

  if (total !== 100) {
    return {
      valid: false,
      total,
      error:
        `Assessment weights must total 100%. Current total is ${total}%.`,
    };
  }

  return {
    valid: true,
    total,
  };
}

/**
 * Validate grade bands.
 */
export function validateGradeBands(
  bands: GradeBand[],
): {
  valid: boolean;
  error?: string;
} {
  if (bands.length === 0) {
    return {
      valid: false,
      error:
        "At least one grade band is required.",
    };
  }

  const sorted = [...bands].sort(
    (a, b) =>
      a.minimumPercent -
      b.minimumPercent,
  );

  if (sorted[0].minimumPercent !== 0) {
    return {
      valid: false,
      error:
        "Grade bands must start at 0%.",
    };
  }

  const last =
    sorted[sorted.length - 1];

  if (last.maximumPercent !== 100) {
    return {
      valid: false,
      error:
        "Grade bands must end at 100%.",
    };
  }

  for (
    let index = 0;
    index < sorted.length;
    index++
  ) {
    const band = sorted[index];

    if (
      band.minimumPercent < 0 ||
      band.maximumPercent > 100 ||
      band.minimumPercent >
        band.maximumPercent
    ) {
      return {
        valid: false,
        error:
          "Grade band contains an invalid range.",
      };
    }

    const next = sorted[index + 1];

    if (!next) {
      continue;
    }

    const expectedNextMinimum =
      roundToTwoDecimals(
        band.maximumPercent + 0.01,
      );

    if (
      next.minimumPercent !==
      expectedNextMinimum
    ) {
      return {
        valid: false,
        error:
          "Grade bands must cover 0% to 100% continuously without gaps or overlaps.",
      };
    }
  }

  return {
    valid: true,
  };
}

/**
 * Round to two decimal places.
 */
export function roundToTwoDecimals(
  value: number,
): number {
  return Math.round(value * 100) / 100;
}
export type AssessmentComponent = {
  id: string;
  name: string;
  rawScore: number | null;
  maximumScore: number;
  weightPercent: number;
};

export type CalculatedComponent = AssessmentComponent & {
  percentage: number | null;
  weightedContribution: number | null;
};

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculatePercentage(rawScore: number, maximumScore: number): number {
  if (!Number.isFinite(rawScore) || !Number.isFinite(maximumScore) || maximumScore <= 0) {
    throw new Error("Maximum score must be greater than zero.");
  }
  if (rawScore < 0 || rawScore > maximumScore) {
    throw new Error(`Score must be between 0 and ${maximumScore}.`);
  }
  return round((rawScore / maximumScore) * 100);
}

export function calculateWeightedScore(percentage: number, weightPercent: number): number {
  if (percentage < 0 || percentage > 100) throw new Error("Percentage must be between 0 and 100.");
  if (weightPercent < 0 || weightPercent > 100) throw new Error("Weight must be between 0 and 100.");
  return round((percentage * weightPercent) / 100);
}

export function validateWeights(weights: number[]): { valid: boolean; total: number } {
  const total = round(weights.reduce((sum, weight) => sum + weight, 0));
  return { valid: Math.abs(total - 100) < 0.0001, total };
}

export function calculateComponents(components: AssessmentComponent[]): CalculatedComponent[] {
  const { valid, total } = validateWeights(components.map((component) => component.weightPercent));
  if (!valid) throw new Error(`Assessment weights must total exactly 100%. Current total: ${total.toFixed(2)}%.`);
  return components.map((component) => {
    if (component.rawScore === null) {
      return { ...component, percentage: null, weightedContribution: null };
    }
    const percentage = calculatePercentage(component.rawScore, component.maximumScore);
    return { ...component, percentage, weightedContribution: calculateWeightedScore(percentage, component.weightPercent) };
  });
}

export function calculateFinalScore(components: CalculatedComponent[]): number | null {
  const completed = components.filter((component) => component.weightedContribution !== null);
  if (completed.length === 0) return null;
  return round(completed.reduce((sum, component) => sum + (component.weightedContribution ?? 0), 0));
}

export type GradeRule = { grade: string; minimumScore: number; maximumScore: number; remark: string | null; gradePoint: number | null };

export function calculateGrade(score: number | null, rules: GradeRule[]): GradeRule | null {
  if (score === null || !Number.isFinite(score)) return null;
  return rules.find((rule) => score >= rule.minimumScore && score <= rule.maximumScore) ?? null;
}

export function calculateClassAverage(scores: Array<number | null>): number | null {
  const valid = scores.filter((score): score is number => score !== null && Number.isFinite(score));
  if (!valid.length) return null;
  return round(valid.reduce((sum, score) => sum + score, 0) / valid.length);
}

export function calculatePosition(results: Array<{ studentId: string; score: number | null }>): Array<{ studentId: string; score: number | null; position: number | null }> {
  const eligible = results.filter((result): result is { studentId: string; score: number } => result.score !== null && Number.isFinite(result.score));
  const sorted = [...eligible].sort((a, b) => b.score - a.score || a.studentId.localeCompare(b.studentId));
  const positions = new Map<string, number>();
  let previous: number | null = null;
  let position = 0;
  sorted.forEach((result, index) => {
    if (previous === null || result.score !== previous) position = index + 1;
    positions.set(result.studentId, position);
    previous = result.score;
  });
  return results.map((result) => ({ ...result, position: result.score === null ? null : positions.get(result.studentId) ?? null }));
}

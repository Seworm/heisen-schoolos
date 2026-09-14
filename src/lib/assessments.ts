export function parseScore(
  value: string,
): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const score = Number(trimmed);

  if (!Number.isFinite(score)) {
    return null;
  }

  return score;
}

export function isValidScore(
  score: number,
  maxScore: number,
): boolean {
  return (
    Number.isFinite(score) &&
    score >= 0 &&
    score <= maxScore
  );
}

export function calculatePercentage(
  score: number,
  maxScore: number,
): number {
  if (maxScore <= 0) {
    return 0;
  }

  return Number(
    ((score / maxScore) * 100).toFixed(2),
  );
}
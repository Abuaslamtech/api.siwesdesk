export interface RawScoreInput {
  orientation?: number | null;
  supervisorScore?: number | null;
  industryScore?: number | null;
  isDraft?: boolean;
}

export interface ComputedScore {
  rawTotal: number;
  total: number;
  siewesFinal: number;
  isComplete: boolean;
}

/**
 * Checks whether a score record is fully complete (all components set and not a draft).
 */
export function isScoreComplete(score?: RawScoreInput | null): boolean {
  if (!score || score.isDraft) {
    return false;
  }
  return (
    score.orientation !== null &&
    score.orientation !== undefined &&
    score.supervisorScore !== null &&
    score.supervisorScore !== undefined &&
    score.industryScore !== null &&
    score.industryScore !== undefined
  );
}

/**
 * Computes raw total (/110), normalized total (/100), SIWES final (/50), and completion status.
 */
export function computeScore(score?: RawScoreInput | null): ComputedScore {
  const orientation = score?.orientation ?? 0;
  const supervisorScore = score?.supervisorScore ?? 0;
  const industryScore = score?.industryScore ?? 0;

  const rawTotal = orientation + supervisorScore + industryScore;
  const total = Math.round(((rawTotal / 110) * 100) * 10) / 10;
  const siewesFinal = Math.round((total / 2) * 10) / 10;

  return {
    rawTotal,
    total,
    siewesFinal,
    isComplete: isScoreComplete(score),
  };
}

/**
 * Decorates a score object with its computed properties.
 */
export function decorateScoreWithComputed<T extends RawScoreInput>(
  score: T | null | undefined,
): (T & ComputedScore) | null {
  if (!score) {
    return null;
  }
  const computed = computeScore(score);
  return {
    ...score,
    ...computed,
  };
}

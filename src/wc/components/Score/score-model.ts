import { SAFETY_SCORE_LEVELS, type SafetyScoreLevel, type ScoreSize } from './score-types';

export function isSafetyScoreLevel(value: unknown): value is SafetyScoreLevel {
  return typeof value === 'string' && (SAFETY_SCORE_LEVELS as readonly string[]).includes(value);
}

/**
 * Infer a safety-score color level from a 0–100 figure. Non-numeric or out-of-range
 * values return undefined so the owner can supply `level` explicitly.
 */
export function resolveSafetyScoreLevel(value: string | number): SafetyScoreLevel | undefined {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100) return undefined;
  if (numericValue <= 50) return 'fair';
  if (numericValue <= 80) return 'good';
  return 'excellent';
}

export function resolveScoreLevel(
  value: string | number,
  level?: SafetyScoreLevel
): SafetyScoreLevel | undefined {
  return isSafetyScoreLevel(level) ? level : resolveSafetyScoreLevel(value);
}

export const SCORE_VALUE_VARIANT = {
  sm: 'text-title-small',
  md: 'text-title-large',
  lg: 'text-display-small',
} as const satisfies Record<
  ScoreSize,
  'text-title-small' | 'text-title-large' | 'text-display-small'
>;

export const SCORE_TREND_VARIANT = {
  sm: 'text-body-small',
  md: 'text-body-medium',
  lg: 'text-body-medium',
} as const satisfies Record<ScoreSize, 'text-body-small' | 'text-body-medium'>;

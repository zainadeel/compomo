import {
  SAFETY_SCORE_LEVELS,
  type SafetyScoreLevel,
  type ScoreSize,
  type ScoreVariant,
} from './score-types';

export function isSafetyScoreLevel(value: unknown): value is SafetyScoreLevel {
  return typeof value === 'string' && (SAFETY_SCORE_LEVELS as readonly string[]).includes(value);
}

/**
 * Infer a safety-score color level from a 0–100 figure. Non-numeric or out-of-range
 * values return undefined so the owner can supply `level` explicitly.
 */
export function resolveSafetyScoreLevel(value: string | number): SafetyScoreLevel | undefined {
  if (typeof value === 'string' && value.trim() === '') return undefined;
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
  default: {
    sm: 'text-title-small',
    md: 'text-title-medium',
    lg: 'text-title-large',
  },
  dense: {
    sm: 'text-title-medium',
    md: 'text-title-large',
    lg: 'text-display-small',
  },
} as const satisfies Record<
  ScoreVariant,
  Record<
    ScoreSize,
    'text-title-small' | 'text-title-medium' | 'text-title-large' | 'text-display-small'
  >
>;

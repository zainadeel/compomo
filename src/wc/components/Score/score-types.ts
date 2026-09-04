export type SafetyScoreLevel = 'fair' | 'good' | 'excellent';
export type ScoreSize = 'sm' | 'md' | 'lg';
export type ScoreVariant = 'default' | 'dense';

export const SCORE_SIZES = ['sm', 'md', 'lg'] as const;
export const SCORE_VARIANTS = ['default', 'dense'] as const;
export const SAFETY_SCORE_LEVELS = ['fair', 'good', 'excellent'] as const;

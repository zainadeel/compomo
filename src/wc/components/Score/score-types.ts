export type SafetyScoreLevel = 'fair' | 'good' | 'excellent';
export type ScoreSize = 'sm' | 'md' | 'lg';

export const SCORE_SIZES = ['sm', 'md', 'lg'] as const;
export const SAFETY_SCORE_LEVELS = ['fair', 'good', 'excellent'] as const;

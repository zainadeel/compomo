/** Built-in shell chrome wash presets — cool (blue), neutral (grey), warm (yellow). */
export type ShellGradientPreset = 'cool' | 'neutral' | 'warm';

export const SHELL_GRADIENT_PRESETS: ShellGradientPreset[] = ['cool', 'neutral', 'warm'];

/** Default wash when `gradient-preset` is omitted. */
export const DEFAULT_SHELL_GRADIENT_PRESET: ShellGradientPreset = 'neutral';

export const SHELL_GRADIENT_PRESET_LABELS: Record<ShellGradientPreset, string> = {
  cool: 'Cool',
  neutral: 'Neutral',
  warm: 'Warm',
};

const SHELL_GRADIENT_PRESET_STOP: Record<ShellGradientPreset, string> = {
  cool: 'var(--color-color-intent-blue-strong-background)',
  neutral: 'var(--color-color-intent-grey-strong-background)',
  warm: 'var(--color-color-intent-yellow-strong-background)',
};

const GRADIENT_GEOMETRY = '100% 100% at 0% 0%';

export function shellGradientPresetStopToken(preset: ShellGradientPreset): string {
  return SHELL_GRADIENT_PRESET_STOP[preset];
}

export function isShellGradientPreset(value: string): value is ShellGradientPreset {
  return (SHELL_GRADIENT_PRESETS as string[]).includes(value);
}

/** Radial wash for a preset — transparent at top-left into the intent stop. */
export function buildShellRadialGradientForPreset(preset: ShellGradientPreset): string {
  const stop = shellGradientPresetStopToken(preset);
  return `radial-gradient(${GRADIENT_GEOMETRY}, var(--color-background-transparent) 0%, ${stop} 100%)`;
}

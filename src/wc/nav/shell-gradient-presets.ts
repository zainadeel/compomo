/** Built-in shell chrome wash presets — none (solid secondary), cool, neutral, warm. */
export type ShellGradientPreset = 'none' | 'cool' | 'neutral' | 'warm';

export const SHELL_GRADIENT_PRESETS: ShellGradientPreset[] = ['none', 'cool', 'neutral', 'warm'];

/** Wash presets shown after the `none` option in pickers. */
export const SHELL_GRADIENT_WASH_PRESETS: Exclude<ShellGradientPreset, 'none'>[] = [
  'cool',
  'neutral',
  'warm',
];

/** Default wash when `gradient-preset` is omitted. */
export const DEFAULT_SHELL_GRADIENT_PRESET: ShellGradientPreset = 'neutral';

export const SHELL_GRADIENT_PRESET_LABELS: Record<ShellGradientPreset, string> = {
  none: 'None',
  cool: 'Cool',
  neutral: 'Neutral',
  warm: 'Warm',
};

export interface ShellGradientStop {
  color: string;
  position: number;
}

export interface ShellGradientRecipe {
  opacity: number;
  stops: readonly ShellGradientStop[];
}

const SHELL_GRADIENT_RECIPES: Record<Exclude<ShellGradientPreset, 'none'>, ShellGradientRecipe> = {
  cool: {
    opacity: 0.1,
    stops: [
      { color: 'var(--color-background-transparent)', position: 0 },
      { color: 'var(--color-color-intent-blue-strong-background)', position: 100 },
    ],
  },
  neutral: {
    opacity: 0.1,
    stops: [
      { color: 'var(--color-background-transparent)', position: 0 },
      { color: 'var(--color-color-intent-grey-strong-background)', position: 100 },
    ],
  },
  warm: {
    opacity: 0.1,
    stops: [
      { color: 'var(--color-background-transparent)', position: 0 },
      { color: 'var(--color-color-intent-yellow-strong-background)', position: 100 },
    ],
  },
};

const GRADIENT_GEOMETRY = '100% 100% at 0% 0%';

export function shellGradientPresetStopToken(preset: ShellGradientPreset): string | null {
  if (preset === 'none') return null;
  const stops = SHELL_GRADIENT_RECIPES[preset].stops;
  return stops[stops.length - 1]?.color ?? null;
}

export function shellGradientPresetRecipe(preset: ShellGradientPreset): ShellGradientRecipe | null {
  const normalized = normalizeShellGradientPreset(preset);
  return normalized === 'none' ? null : SHELL_GRADIENT_RECIPES[normalized];
}

export function shellGradientPresetOpacity(preset: ShellGradientPreset): string {
  return String(shellGradientPresetRecipe(preset)?.opacity ?? 0);
}

export function isShellGradientPreset(value: string): value is ShellGradientPreset {
  return (SHELL_GRADIENT_PRESETS as string[]).includes(value);
}

/**
 * Coerce unknown/absent presets to the default. Runtime values escape the
 * type: removing the reflected `gradient-preset` attribute (e.g. an Angular
 * `[attr.gradient-preset]="null"` binding) drives the prop to null past its
 * field default — without normalization the stop lookup interpolates the
 * literal string "undefined" into CSS and the wash silently disappears.
 */
export function normalizeShellGradientPreset(
  value: string | null | undefined,
): ShellGradientPreset {
  return value != null && isShellGradientPreset(value) ? value : DEFAULT_SHELL_GRADIENT_PRESET;
}

/** Radial wash for a preset — transparent at top-left into the intent stop. `none` returns no image. */
export function buildShellRadialGradientForPreset(preset: ShellGradientPreset): string {
  const normalized = normalizeShellGradientPreset(preset);
  if (normalized === 'none') return 'none';

  return buildShellRadialGradientFromStops(SHELL_GRADIENT_RECIPES[normalized].stops);
}

/** Build the production shell geometry from an ordered set of design-time stops. */
export function buildShellRadialGradientFromStops(stops: readonly ShellGradientStop[]): string {
  const serialized = stops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
  return `radial-gradient(${GRADIENT_GEOMETRY}, ${serialized})`;
}

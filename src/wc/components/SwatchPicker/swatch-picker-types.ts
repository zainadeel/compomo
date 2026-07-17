export interface SwatchPickerPreview {
  /** CSS color used as the swatch base or as a complete flat-color preview. */
  backgroundColor?: string;
  /** CSS gradient used as the swatch image. */
  backgroundImage?: string;
  /** Optional preview-layer opacity, clamped to the inclusive 0–1 range. */
  opacity?: number;
}

export interface SwatchPickerOption {
  /** Stable value emitted when this option is selected. */
  value: string;
  /** Accessible option name; the visual preview never replaces this label. */
  label: string;
  preview: SwatchPickerPreview;
  isInactive?: boolean;
}

export interface SwatchPickerSection {
  /** Sections remain one radio group and are separated visually. */
  options: SwatchPickerOption[];
}

export type SwatchPickerNavigationKey =
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'Home'
  | 'End';

export function flattenSwatchPickerOptions(
  options: readonly SwatchPickerOption[],
  sections: readonly SwatchPickerSection[],
): SwatchPickerOption[] {
  return sections.length > 0
    ? sections.flatMap(section => section.options)
    : [...options];
}

export function resolveSwatchPickerTabIndex(
  options: readonly SwatchPickerOption[],
  value: string,
): number {
  const selectedIndex = options.findIndex(option => (
    option.value === value && !option.isInactive
  ));
  if (selectedIndex >= 0) return selectedIndex;
  return options.findIndex(option => !option.isInactive);
}

export function resolveSwatchPickerNavigationIndex(
  options: readonly SwatchPickerOption[],
  currentIndex: number,
  key: SwatchPickerNavigationKey,
): number | null {
  const enabledIndexes = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !option.isInactive)
    .map(({ index }) => index);

  if (enabledIndexes.length === 0) return null;
  if (key === 'Home') return enabledIndexes[0];
  if (key === 'End') return enabledIndexes[enabledIndexes.length - 1];

  const direction = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
  const currentEnabledIndex = enabledIndexes.indexOf(currentIndex);
  if (currentEnabledIndex < 0) {
    return direction > 0
      ? enabledIndexes[0]
      : enabledIndexes[enabledIndexes.length - 1];
  }

  return enabledIndexes[
    (currentEnabledIndex + direction + enabledIndexes.length) % enabledIndexes.length
  ];
}

export function normalizeSwatchPickerOpacity(opacity: number | undefined): number {
  if (opacity === undefined || !Number.isFinite(opacity)) return 1;
  return Math.min(1, Math.max(0, opacity));
}

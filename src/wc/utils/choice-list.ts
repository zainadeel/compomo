export interface ChoiceOption {
  label: string;
  value: string;
  subtext?: string;
  icon?: string;
  isInactive?: boolean;
}

export interface ChoiceSection {
  header?: string;
  options: ChoiceOption[];
  divider?: boolean;
}

export type ChoiceBackground =
  | 'faint'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'translucent'
  | 'inverted'
  | 'media'
  | 'always-dark';

export function resolveChoiceSections(
  options: ChoiceOption[],
  sections: ChoiceSection[],
): ChoiceSection[] {
  return sections.length > 0 ? sections : [{ options }];
}

export function flattenChoiceSections(sections: ChoiceSection[]): ChoiceOption[] {
  return sections.flatMap(section => section.options);
}

export function filterChoiceSections(
  sections: ChoiceSection[],
  searchTerm: string,
): ChoiceSection[] {
  const normalized = searchTerm.trim().toLocaleLowerCase();
  if (!normalized) return sections;

  return sections
    .map(section => ({
      ...section,
      options: section.options.filter(option =>
        `${option.label} ${option.subtext ?? ''}`.toLocaleLowerCase().includes(normalized),
      ),
    }))
    .filter(section => section.options.length > 0);
}

export function enabledChoiceIndexes(options: ChoiceOption[]): number[] {
  return options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !option.isInactive)
    .map(({ index }) => index);
}

export function moveChoiceIndex(
  options: ChoiceOption[],
  currentIndex: number,
  direction: 1 | -1,
): number {
  const enabled = enabledChoiceIndexes(options);
  if (!enabled.length) return -1;

  const currentEnabledIndex = enabled.indexOf(currentIndex);
  const start = currentEnabledIndex >= 0 ? currentEnabledIndex : direction === 1 ? -1 : 0;
  return enabled[(start + direction + enabled.length) % enabled.length];
}

export function findChoiceTypeaheadMatch(
  options: ChoiceOption[],
  query: string,
  currentIndex: number,
): number {
  const normalized = query.toLocaleLowerCase();
  if (!normalized) return -1;

  for (let offset = 1; offset <= options.length; offset += 1) {
    const index = (Math.max(currentIndex, -1) + offset) % options.length;
    const option = options[index];
    if (!option.isInactive && option.label.toLocaleLowerCase().startsWith(normalized)) return index;
  }
  return -1;
}

export function choiceBackgroundClassMap(
  background: ChoiceBackground | undefined,
): Record<string, boolean> {
  return {
    'ds-interaction-fill--on-faint': background === 'faint',
    'ds-interaction-fill--on-medium': background === 'medium',
    'ds-interaction-fill--on-bold': background === 'bold',
    'ds-interaction-fill--on-strong': background === 'strong',
    'ds-interaction-fill--on-translucent': background === 'translucent',
    'ds-interaction-fill--on-inverted': background === 'inverted',
    'ds-interaction-fill--on-media': background === 'media',
    'ds-interaction-fill--on-always-dark': background === 'always-dark',
  };
}

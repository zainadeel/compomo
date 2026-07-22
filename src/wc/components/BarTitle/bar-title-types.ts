import type { ButtonFilledContrast, ButtonFilledIntent } from '../ButtonFilled/ButtonFilled';

export interface BarTitleSection {
  id: string;
  label: string;
  isInactive?: boolean;
}

export interface BarTitleDivider {
  type: 'divider';
}

export type BarTitleSectionItem = BarTitleSection | BarTitleDivider;

export interface BarTitleAction {
  id: string;
  label: string;
  isInactive?: boolean;
  isDestructive?: boolean;
}

export interface BarTitlePrimaryAction extends BarTitleAction {
  icon?: string;
  intent?: ButtonFilledIntent;
  contrast?: ButtonFilledContrast;
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  collapse?: BarTitlePrimaryActionCollapse;
}

export type BarTitleActionItem = BarTitleAction | BarTitleDivider;

export type BarTitleVariant = 'expanded' | 'compact' | 'constrained';

export type BarTitleMode = 'default' | 'editor';

export type BarTitlePrimaryActionCollapse = 'auto' | 'never';

export function isBarTitleDivider(
  item: BarTitleSectionItem | BarTitleActionItem
): item is BarTitleDivider {
  return 'type' in item && item.type === 'divider';
}

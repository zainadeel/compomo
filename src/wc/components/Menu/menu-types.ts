import type { ShellGradientPreset } from '../../shell/shell-gradient-presets';

export type { MenuAlign, MenuSide } from './menu-position';
export {
  PANEL_NAV_USER_MENU_PLACEMENT,
  type MenuPlacement,
} from './menu-placement';

export interface MenuItemData {
  label: string;
  value?: string;
  subtext?: string;
  /** Show a supplemental brand notification dot. */
  dot?: boolean;
  isSelected?: boolean;
  isInactive?: boolean;
  isDestructive?: boolean;
  /** Render a compact switch indicator; the menu row owns interaction. */
  showSwitch?: boolean;
  switchValue?: boolean;
}

export interface MenuItemsSection {
  header?: string;
  items: MenuItemData[];
}

export interface MenuGradientPickerSection {
  header?: string;
  variant: 'gradient-picker';
  value: ShellGradientPreset;
}

export type MenuSection = MenuItemsSection | MenuGradientPickerSection;

export function isMenuGradientPickerSection(
  section: MenuSection,
): section is MenuGradientPickerSection {
  return 'variant' in section && section.variant === 'gradient-picker';
}

export type { ShellGradientPreset };

import type { ShellGradientPreset } from '../../shell/shell-gradient-presets';
import type { SwatchPickerOption, SwatchPickerSection } from '../SwatchPicker/swatch-picker-types';

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
  /** @deprecated Use the generic `swatch-picker` section. */
  variant: 'gradient-picker';
  value: ShellGradientPreset;
}

export interface MenuSwatchPickerSection {
  header?: string;
  variant: 'swatch-picker';
  value: string;
  options?: SwatchPickerOption[];
  sections?: SwatchPickerSection[];
  groupLabel?: string;
}

export type MenuSection =
  | MenuItemsSection
  | MenuGradientPickerSection
  | MenuSwatchPickerSection;

export function isMenuGradientPickerSection(
  section: MenuSection,
): section is MenuGradientPickerSection {
  return 'variant' in section && section.variant === 'gradient-picker';
}

export function isMenuSwatchPickerSection(
  section: MenuSection,
): section is MenuSwatchPickerSection {
  return 'variant' in section && section.variant === 'swatch-picker';
}

export function isMenuPickerSection(
  section: MenuSection,
): section is MenuGradientPickerSection | MenuSwatchPickerSection {
  return isMenuGradientPickerSection(section) || isMenuSwatchPickerSection(section);
}

export type { ShellGradientPreset };
export type { SwatchPickerOption, SwatchPickerSection };

import type { SwatchPickerOption, SwatchPickerSection } from '../SwatchPicker/swatch-picker-types';
import type { TagContrast, TagIntent } from '../Tag/Tag';

export type { MenuAlign, MenuSide } from './menu-position';
export {
  PANEL_NAV_USER_MENU_PLACEMENT,
  PANEL_TOOLS_HEADER_MENU_PLACEMENT,
  type MenuPlacement,
} from './menu-placement';

export interface MenuItemTagData {
  label: string;
  intent?: TagIntent;
  contrast?: TagContrast;
  rounded?: boolean;
}

export interface MenuItemData {
  label: string;
  value?: string;
  subtext?: string;
  /** Show a supplemental brand notification dot. */
  dot?: boolean;
  /** Show a non-interactive tag at the trailing edge of the row. */
  tag?: MenuItemTagData;
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
  | MenuSwatchPickerSection;

export function isMenuSwatchPickerSection(
  section: MenuSection,
): section is MenuSwatchPickerSection {
  return 'variant' in section && section.variant === 'swatch-picker';
}

export function isMenuPickerSection(
  section: MenuSection,
): section is MenuSwatchPickerSection {
  return isMenuSwatchPickerSection(section);
}

export type { SwatchPickerOption, SwatchPickerSection };

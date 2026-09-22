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

export interface MenuItemTrailingToggleData {
  /** Icon-only toggle glyph. */
  icon: string;
  /** Accessible name describing the requested state change. */
  label: string;
  /** Controlled toggle state. */
  pressed: boolean;
  /** Keep the toggle visible but unavailable. */
  isInactive?: boolean;
}

export interface MenuItemActionData {
  /** Stable action identity for consumer event handling. */
  id: string;
  /** Icon-only action glyph. */
  icon: string;
  /** Accessible name describing the action. */
  label: string;
  /** Keep the action visible but unavailable. */
  isInactive?: boolean;
}

export interface MenuItemData {
  label: string;
  value?: string;
  subtext?: string;
  /** Leading decorative icon. Ignored when `reorderable` is true. */
  icon?: string;
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
  /** Prefix a drag handle and allow pointer and keyboard reorder within the contiguous reorderable run. */
  reorderable?: boolean;
  /** Keep the drag handle visible as an inactive alignment affordance when reordering is unavailable. */
  reorderHandleInactive?: boolean;
  /** Append a separate unfilled icon toggle after a decorative divider. */
  trailingToggle?: MenuItemTrailingToggleData;
  /** Append independent unfilled icon actions while the row owns the shared hover surface. */
  trailingActions?: MenuItemActionData[];
}

export interface MenuItemToggleDetail {
  item: MenuItemData;
  pressed: boolean;
  /** Identifies an independent trailing action; omitted for the legacy toggle control. */
  action?: MenuItemActionData;
}

/** Next section item order after a pointer or keyboard reorder. */
export interface MenuReorderDetail {
  item: MenuItemData;
  fromIndex: number;
  toIndex: number;
  sectionIndex: number;
  items: MenuItemData[];
}

export interface MenuItemsSection {
  header?: string;
  /** Secondary heading beneath a shared parent section heading. */
  subheader?: string;
  /** Separate this subsection from the previous one with an inset divider. */
  insetDividerBefore?: boolean;
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

export type MenuSection = MenuItemsSection | MenuSwatchPickerSection;

export function isMenuSwatchPickerSection(
  section: MenuSection
): section is MenuSwatchPickerSection {
  return 'variant' in section && section.variant === 'swatch-picker';
}

export function isMenuPickerSection(section: MenuSection): section is MenuSwatchPickerSection {
  return isMenuSwatchPickerSection(section);
}

export type { SwatchPickerOption, SwatchPickerSection };

export type { MenuAlign, MenuSide } from './menu-position';

export interface MenuItemData {
  label: string;
  value?: string;
  subtext?: string;
  isSelected?: boolean;
  isInactive?: boolean;
  isDestructive?: boolean;
  showToggle?: boolean;
  toggleValue?: boolean;
}

export interface MenuSection {
  header?: string;
  items: MenuItemData[];
}

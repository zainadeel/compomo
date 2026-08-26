import type { MenuItemData } from '../Menu/menu-types';
import type { TableDataMode } from './table-types';

let tableDataModeSwitcherSequence = 0;

export function nextTableDataModeSwitcherElementId(): string {
  tableDataModeSwitcherSequence += 1;
  return `ds-table-data-mode-${tableDataModeSwitcherSequence}`;
}

/** Menu of supported data-mode choices. */
export function tableDataModeMenuItems(
  dataMode: TableDataMode,
  labels: { infinite: string; pagination: string; virtual: string }
): MenuItemData[] {
  return [
    {
      label: labels.infinite,
      value: 'infinite',
      isSelected: dataMode === 'infinite',
    },
    {
      label: labels.pagination,
      value: 'pagination',
      isSelected: dataMode === 'pagination',
    },
    {
      label: labels.virtual,
      value: 'virtual',
      isSelected: dataMode === 'virtual',
    },
  ];
}

export function tableDataModeFromMenuItem(item: MenuItemData): TableDataMode | null {
  return item.value === 'infinite' || item.value === 'pagination' || item.value === 'virtual'
    ? item.value
    : null;
}

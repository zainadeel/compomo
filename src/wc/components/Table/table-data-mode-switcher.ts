import type { MenuItemData } from '../Menu/menu-types';
import type { TableDataMode } from './table-types';

let tableDataModeSwitcherSequence = 0;

export function nextTableDataModeSwitcherElementId(): string {
  tableDataModeSwitcherSequence += 1;
  return `ds-table-data-mode-${tableDataModeSwitcherSequence}`;
}

export function tableDataModeMenuItems(
  dataMode: TableDataMode,
  labels: { infinite: string; pagination: string },
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
  ];
}

export function tableDataModeFromMenuItem(item: MenuItemData): TableDataMode | null {
  return item.value === 'infinite' || item.value === 'pagination' ? item.value : null;
}

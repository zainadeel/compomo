import type { MenuItemData, MenuItemsSection } from '../Menu/menu-types';
import type { TableCellAction, TableCellActionMenuEntry } from './table-types';

let actionMenuSeq = 0;

export function nextTableActionMenuElementId(): string {
  actionMenuSeq += 1;
  return `ds-table-action-menu-${actionMenuSeq}`;
}

export function isTableCellActionMenu(
  value: TableCellAction
): value is TableCellAction & { items: TableCellActionMenuEntry[]; ariaLabel: string } {
  return Array.isArray(value.items);
}

export function isRenderableTableActionMenu(
  value: TableCellAction
): value is TableCellAction & { items: TableCellActionMenuEntry[]; ariaLabel: string } {
  return isTableCellActionMenu(value) && tableActionMenuSections(value.items).length > 0;
}

/** Split divider entries into Menu sections. Empty runs (leading/repeated dividers) are dropped. */
export function tableActionMenuSections(items: TableCellActionMenuEntry[]): MenuItemsSection[] {
  const sections: MenuItemsSection[] = [];
  let current: MenuItemData[] = [];
  const flush = () => {
    if (!current.length) return;
    sections.push({ items: current });
    current = [];
  };

  for (const entry of items) {
    if ('kind' in entry) {
      flush();
      continue;
    }
    current.push({
      value: entry.actionId,
      label: entry.label,
      ...(entry.isInactive ? { isInactive: true } : {}),
      ...(entry.isDestructive ? { isDestructive: true } : {}),
    });
  }
  flush();
  return sections;
}

export function tableActionTriggerId(menuId: string, rowId: string, columnId: string): string {
  return `${menuId}-${sanitizeId(rowId)}-${sanitizeId(columnId)}`;
}

function sanitizeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, '-');
}

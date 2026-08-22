import type { MenuItemData } from '../Menu/menu-types';
import type { TableColumn } from './table-types';

let columnCustomizerSeq = 0;

export function nextTableColumnCustomizerElementId(): string {
  columnCustomizerSeq += 1;
  return `ds-table-column-customizer-${columnCustomizerSeq}`;
}

export function isTableActionColumn(column: TableColumn): boolean {
  return column.kind === 'action';
}

export function tableColumnCustomizerLabel(column: TableColumn): string {
  return column.header.trim() || column.headerLabel?.trim() || column.id;
}

export function tableDataColumns(columns: TableColumn[]): TableColumn[] {
  return columns.filter(column => !isTableActionColumn(column));
}

/** Data-column ids in display order. Unknown, duplicate, and action ids are ignored. */
export function resolveTableColumnOrder(
  columns: TableColumn[],
  columnOrder: string[] | undefined
): string[] {
  const catalogIds = tableDataColumns(columns).map(column => column.id);
  const catalog = new Set(catalogIds);
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const id of columnOrder ?? []) {
    if (!catalog.has(id) || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }

  for (const id of catalogIds) {
    if (seen.has(id)) continue;
    ordered.push(id);
  }

  return ordered;
}

/**
 * Hidden data-column ids. Action and unknown ids are dropped. At least one data
 * column remains visible when the catalog has any data columns.
 */
export function resolveTableHiddenColumnIds(
  columns: TableColumn[],
  hiddenColumnIds: string[] | undefined
): string[] {
  const dataIds = tableDataColumns(columns).map(column => column.id);
  const data = new Set(dataIds);
  const hidden = [...new Set((hiddenColumnIds ?? []).filter(id => data.has(id)))];
  if (dataIds.length === 0 || hidden.length < dataIds.length) return hidden;

  const keep = dataIds[0];
  return hidden.filter(id => id !== keep);
}

export function resolveTableVisibleColumns(
  columns: TableColumn[],
  options: {
    columnCustomizer?: boolean;
    hiddenColumnIds?: string[];
    columnOrder?: string[];
  } = {}
): TableColumn[] {
  if (!options.columnCustomizer) return columns;

  const byId = new Map(columns.map(column => [column.id, column]));
  const hidden = new Set(resolveTableHiddenColumnIds(columns, options.hiddenColumnIds));
  const visibleData = resolveTableColumnOrder(columns, options.columnOrder)
    .map(id => byId.get(id))
    .filter((column): column is TableColumn => !!column && !hidden.has(column.id));

  return [...visibleData, ...columns.filter(isTableActionColumn)];
}

export function canToggleTableColumnHidden(
  columns: TableColumn[],
  hiddenColumnIds: string[] | undefined,
  columnId: string
): boolean {
  const column = columns.find(candidate => candidate.id === columnId);
  if (!column || isTableActionColumn(column)) return false;

  const hidden = new Set(resolveTableHiddenColumnIds(columns, hiddenColumnIds));
  if (hidden.has(columnId)) return true;

  const visibleData = tableDataColumns(columns).filter(candidate => !hidden.has(candidate.id));
  return visibleData.length > 1;
}

export function toggleTableColumnHidden(
  columns: TableColumn[],
  hiddenColumnIds: string[] | undefined,
  columnId: string
): string[] {
  const resolved = resolveTableHiddenColumnIds(columns, hiddenColumnIds);
  if (!canToggleTableColumnHidden(columns, resolved, columnId)) return resolved;

  const hidden = new Set(resolved);
  if (hidden.has(columnId)) hidden.delete(columnId);
  else hidden.add(columnId);
  return resolveTableHiddenColumnIds(columns, [...hidden]);
}

export function moveTableColumnOrder(order: string[], fromId: string, toId: string): string[] {
  const from = order.indexOf(fromId);
  const to = order.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return order;

  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, fromId);
  return next;
}

export function moveTableColumnInOrder(
  order: string[],
  columnId: string,
  offset: number
): string[] {
  const from = order.indexOf(columnId);
  if (from < 0 || offset === 0) return order;
  return moveTableColumnOrder(order, columnId, order[from + offset] ?? columnId);
}

export interface TableColumnCustomizerItem {
  column: TableColumn;
  label: string;
  visible: boolean;
  hideable: boolean;
  reorderable: boolean;
}

export function tableColumnCustomizerItems(
  columns: TableColumn[],
  hiddenColumnIds: string[] | undefined,
  columnOrder: string[] | undefined
): TableColumnCustomizerItem[] {
  const byId = new Map(columns.map(column => [column.id, column]));
  const resolvedHidden = resolveTableHiddenColumnIds(columns, hiddenColumnIds);
  const hidden = new Set(resolvedHidden);
  const dataItems = resolveTableColumnOrder(columns, columnOrder).flatMap(id => {
    const column = byId.get(id);
    if (!column) return [];
    return [
      {
        column,
        label: tableColumnCustomizerLabel(column),
        visible: !hidden.has(id),
        hideable: canToggleTableColumnHidden(columns, resolvedHidden, id),
        reorderable: true,
      },
    ];
  });
  return dataItems;
}

/** Menu switch rows for the table-owned column customizer. */
export function tableColumnCustomizerMenuItems(
  columns: TableColumn[],
  hiddenColumnIds: string[] | undefined,
  columnOrder: string[] | undefined
): MenuItemData[] {
  return tableColumnCustomizerItems(columns, hiddenColumnIds, columnOrder).map(item => ({
    label: item.label,
    value: item.column.id,
    showSwitch: true,
    switchValue: item.visible,
    isInactive: !item.hideable,
    reorderable: item.reorderable,
  }));
}

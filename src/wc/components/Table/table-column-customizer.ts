import type { MenuItemData } from '../Menu/menu-types';
import {
  canToggleListHidden,
  listCustomizerMenuItems,
  moveListOrder,
  moveListOrderBy,
  resolveListHiddenIds,
  resolveListOrder,
  toggleListHidden,
  type ListCustomizerOptions,
} from '../../utils/list-customizer';
import type { TableColumn } from './table-types';

/**
 * Table's customizer policy: the last visible data column cannot be hidden, and
 * rows reorder. Everything below is a thin adapter over the domain-neutral
 * helpers in utils/list-customizer so other catalogs can reuse the same state
 * machine with different policy.
 */
const TABLE_COLUMN_CUSTOMIZER: ListCustomizerOptions = { minVisible: 1, reorderable: true };

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
  return resolveListOrder(
    tableDataColumns(columns).map(column => column.id),
    columnOrder
  );
}

/**
 * Hidden data-column ids. Action and unknown ids are dropped. At least one data
 * column remains visible when the catalog has any data columns.
 */
export function resolveTableHiddenColumnIds(
  columns: TableColumn[],
  hiddenColumnIds: string[] | undefined
): string[] {
  return resolveListHiddenIds(
    tableDataColumns(columns).map(column => column.id),
    hiddenColumnIds,
    TABLE_COLUMN_CUSTOMIZER
  );
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

  return canToggleListHidden(
    tableDataColumns(columns).map(candidate => candidate.id),
    hiddenColumnIds,
    columnId,
    TABLE_COLUMN_CUSTOMIZER
  );
}

export function toggleTableColumnHidden(
  columns: TableColumn[],
  hiddenColumnIds: string[] | undefined,
  columnId: string
): string[] {
  const column = columns.find(candidate => candidate.id === columnId);
  if (!column || isTableActionColumn(column)) {
    return resolveTableHiddenColumnIds(columns, hiddenColumnIds);
  }

  return toggleListHidden(
    tableDataColumns(columns).map(candidate => candidate.id),
    hiddenColumnIds,
    columnId,
    TABLE_COLUMN_CUSTOMIZER
  );
}

export function moveTableColumnOrder(order: string[], fromId: string, toId: string): string[] {
  return moveListOrder(order, fromId, toId);
}

export function moveTableColumnInOrder(
  order: string[],
  columnId: string,
  offset: number
): string[] {
  return moveListOrderBy(order, columnId, offset);
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
  return listCustomizerMenuItems(
    tableDataColumns(columns).map(column => ({
      id: column.id,
      label: tableColumnCustomizerLabel(column),
    })),
    hiddenColumnIds,
    columnOrder,
    TABLE_COLUMN_CUSTOMIZER
  );
}

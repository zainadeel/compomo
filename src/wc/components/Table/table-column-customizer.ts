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
  return column.label.trim() || column.accessibleLabel?.trim() || column.id;
}

export function tableDataColumns(columns: TableColumn[]): TableColumn[] {
  return columns.filter(column => !isTableActionColumn(column));
}

/** Data-column ids in display order. Unknown, duplicate, and action ids are ignored. */
export function resolveTableColumnOrder(
  columns: TableColumn[],
  fieldOrder: string[] | undefined
): string[] {
  return resolveListOrder(
    tableDataColumns(columns).map(column => column.id),
    fieldOrder
  );
}

/**
 * Hidden data-column ids. Action and unknown ids are dropped. At least one data
 * column remains visible when the catalog has any data columns.
 */
export function resolveTableHiddenColumnIds(
  columns: TableColumn[],
  hiddenFieldIds: string[] | undefined
): string[] {
  return resolveListHiddenIds(
    tableDataColumns(columns).map(column => column.id),
    hiddenFieldIds,
    TABLE_COLUMN_CUSTOMIZER
  );
}

export function resolveTableVisibleColumns(
  columns: TableColumn[],
  options: {
    columnCustomizer?: boolean;
    hiddenFieldIds?: string[];
    fieldOrder?: string[];
  } = {}
): TableColumn[] {
  if (!options.columnCustomizer) return columns;

  const byId = new Map(columns.map(column => [column.id, column]));
  const hidden = new Set(resolveTableHiddenColumnIds(columns, options.hiddenFieldIds));
  const visibleData = resolveTableColumnOrder(columns, options.fieldOrder)
    .map(id => byId.get(id))
    .filter((column): column is TableColumn => !!column && !hidden.has(column.id));

  return [...visibleData, ...columns.filter(isTableActionColumn)];
}

export function canToggleTableColumnHidden(
  columns: TableColumn[],
  hiddenFieldIds: string[] | undefined,
  fieldId: string
): boolean {
  const column = columns.find(candidate => candidate.id === fieldId);
  if (!column || isTableActionColumn(column)) return false;

  return canToggleListHidden(
    tableDataColumns(columns).map(candidate => candidate.id),
    hiddenFieldIds,
    fieldId,
    TABLE_COLUMN_CUSTOMIZER
  );
}

export function toggleTableColumnHidden(
  columns: TableColumn[],
  hiddenFieldIds: string[] | undefined,
  fieldId: string
): string[] {
  const column = columns.find(candidate => candidate.id === fieldId);
  if (!column || isTableActionColumn(column)) {
    return resolveTableHiddenColumnIds(columns, hiddenFieldIds);
  }

  return toggleListHidden(
    tableDataColumns(columns).map(candidate => candidate.id),
    hiddenFieldIds,
    fieldId,
    TABLE_COLUMN_CUSTOMIZER
  );
}

export function moveTableColumnOrder(order: string[], fromId: string, toId: string): string[] {
  return moveListOrder(order, fromId, toId);
}

export function moveTableColumnInOrder(order: string[], fieldId: string, offset: number): string[] {
  return moveListOrderBy(order, fieldId, offset);
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
  hiddenFieldIds: string[] | undefined,
  fieldOrder: string[] | undefined
): TableColumnCustomizerItem[] {
  const byId = new Map(columns.map(column => [column.id, column]));
  const resolvedHidden = resolveTableHiddenColumnIds(columns, hiddenFieldIds);
  const hidden = new Set(resolvedHidden);
  const dataItems = resolveTableColumnOrder(columns, fieldOrder).flatMap(id => {
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
  hiddenFieldIds: string[] | undefined,
  fieldOrder: string[] | undefined
): MenuItemData[] {
  return listCustomizerMenuItems(
    tableDataColumns(columns).map(column => ({
      id: column.id,
      label: tableColumnCustomizerLabel(column),
    })),
    hiddenFieldIds,
    fieldOrder,
    TABLE_COLUMN_CUSTOMIZER
  );
}

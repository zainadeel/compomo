import type { MenuItemData, MenuItemsSection } from '../Menu/menu-types';
import {
  canToggleListHidden,
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

function hasResolvedTableColumnSize(column: TableColumn): boolean {
  return (
    typeof column.size === 'string' ||
    (typeof column.size === 'number' && Number.isFinite(column.size) && column.size > 0) ||
    Boolean(column.imageTracks)
  );
}

function tablePinnableColumns(columns: TableColumn[]): TableColumn[] {
  return tableDataColumns(columns).filter(
    column => !column.sticky && hasResolvedTableColumnSize(column)
  );
}

/** User-managed pinned ids. Fixed start/end columns remain column-owned. */
export function resolveTablePinnedFieldIds(
  columns: TableColumn[],
  pinnedFieldIds: string[] | undefined,
  fieldOrder?: string[]
): string[] {
  const pinnable = new Set(tablePinnableColumns(columns).map(column => column.id));
  const requested = new Set((pinnedFieldIds ?? []).filter(id => pinnable.has(id)));
  return resolveTableColumnOrder(columns, fieldOrder).filter(id => requested.has(id));
}

/** Fixed-start, user-pinned, unpinned, then fixed-end data columns. */
export function resolveTableConfiguredColumnOrder(
  columns: TableColumn[],
  fieldOrder: string[] | undefined,
  pinnedFieldIds: string[] | undefined
): string[] {
  const base = resolveTableColumnOrder(columns, fieldOrder);
  const byId = new Map(columns.map(column => [column.id, column]));
  const pinned = new Set(resolveTablePinnedFieldIds(columns, pinnedFieldIds, base));
  return [
    ...base.filter(id => byId.get(id)?.sticky === 'start'),
    ...base.filter(id => pinned.has(id)),
    ...base.filter(id => !pinned.has(id) && !byId.get(id)?.sticky),
    ...base.filter(id => byId.get(id)?.sticky === 'end'),
  ];
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
    pinnedFieldIds?: string[];
  } = {}
): TableColumn[] {
  if (!options.columnCustomizer) return columns;

  const byId = new Map(columns.map(column => [column.id, column]));
  const hidden = new Set(resolveTableHiddenColumnIds(columns, options.hiddenFieldIds));
  const pinned = new Set(
    resolveTablePinnedFieldIds(columns, options.pinnedFieldIds, options.fieldOrder)
  );
  const visibleData = resolveTableConfiguredColumnOrder(
    columns,
    options.fieldOrder,
    options.pinnedFieldIds
  )
    .map(id => byId.get(id))
    .filter((column): column is TableColumn => !!column && !hidden.has(column.id));

  return [
    ...visibleData.map(column =>
      pinned.has(column.id) && !column.sticky ? { ...column, sticky: 'start' as const } : column
    ),
    ...columns.filter(isTableActionColumn),
  ];
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
  pinned: boolean;
  pinnable: boolean;
}

export function tableColumnCustomizerItems(
  columns: TableColumn[],
  hiddenFieldIds: string[] | undefined,
  fieldOrder: string[] | undefined,
  pinnedFieldIds: string[] | undefined = []
): TableColumnCustomizerItem[] {
  const byId = new Map(columns.map(column => [column.id, column]));
  const resolvedHidden = resolveTableHiddenColumnIds(columns, hiddenFieldIds);
  const hidden = new Set(resolvedHidden);
  const pinned = new Set(resolveTablePinnedFieldIds(columns, pinnedFieldIds, fieldOrder));
  const configuredOrder = resolveTableConfiguredColumnOrder(columns, fieldOrder, pinnedFieldIds);
  const pinnedCount = configuredOrder.filter(id => pinned.has(id)).length;
  const unpinnedCount = configuredOrder.filter(id => !pinned.has(id)).length;
  const dataItems = configuredOrder.flatMap(id => {
    const column = byId.get(id);
    if (!column) return [];
    const isPinned = pinned.has(id);
    const pinnable = !column.sticky && hasResolvedTableColumnSize(column);
    return [
      {
        column,
        label: tableColumnCustomizerLabel(column),
        visible: !hidden.has(id),
        hideable: canToggleTableColumnHidden(columns, resolvedHidden, id),
        reorderable: !column.sticky && (isPinned ? pinnedCount > 1 : unpinnedCount > 1),
        pinned: isPinned,
        pinnable,
      },
    ];
  });
  return dataItems;
}

/** Menu action rows for the table-owned column customizer. */
export function tableColumnCustomizerMenuItems(
  columns: TableColumn[],
  hiddenFieldIds: string[] | undefined,
  fieldOrder: string[] | undefined,
  pinnedFieldIds: string[] | undefined = []
): MenuItemData[] {
  return tableColumnCustomizerItems(columns, hiddenFieldIds, fieldOrder, pinnedFieldIds).map(
    item => ({
      label: item.label,
      value: item.column.id,
      reorderable: item.reorderable,
      reorderHandleInactive: item.pinned && !item.reorderable,
      trailingActions: [
        {
          id: 'visibility',
          icon: item.visible ? 'EyeStrikethrough' : 'Eye',
          label: item.visible ? `Hide ${item.label}` : `Show ${item.label}`,
          isInactive: !item.hideable,
        },
        ...(item.pinnable
          ? [
              {
                id: 'pin',
                icon: item.pinned ? 'Cross' : 'Pin',
                label: item.pinned ? `Unpin ${item.label}` : `Pin ${item.label}`,
              },
            ]
          : []),
      ],
    })
  );
}

/** Column subgroups retain one parent heading while enforcing drag boundaries. */
export function tableColumnCustomizerSections(
  columns: TableColumn[],
  hiddenFieldIds: string[] | undefined,
  fieldOrder: string[] | undefined,
  pinnedFieldIds: string[] | undefined = []
): MenuItemsSection[] {
  const items = tableColumnCustomizerMenuItems(columns, hiddenFieldIds, fieldOrder, pinnedFieldIds);
  const pinnedIds = new Set(resolveTablePinnedFieldIds(columns, pinnedFieldIds, fieldOrder));
  const pinned = items.filter(item => item.value && pinnedIds.has(item.value));
  const unpinned = items.filter(item => !item.value || !pinnedIds.has(item.value));
  if (!pinned.length) return [{ header: 'Columns', items: unpinned }];
  return [
    { header: 'Columns', subheader: 'Pinned columns', items: pinned },
    ...(unpinned.length
      ? [{ subheader: 'Other columns', insetDividerBefore: true, items: unpinned }]
      : []),
  ];
}

export interface TableFieldsConfiguration {
  hiddenFieldIds: string[];
  fieldOrder: string[];
  pinnedFieldIds: string[];
}

export function resolveTableFieldsConfiguration(
  columns: TableColumn[],
  hiddenFieldIds: string[] | undefined,
  fieldOrder: string[] | undefined,
  pinnedFieldIds: string[] | undefined
): TableFieldsConfiguration {
  const order = resolveTableConfiguredColumnOrder(columns, fieldOrder, pinnedFieldIds);
  return {
    hiddenFieldIds: resolveTableHiddenColumnIds(columns, hiddenFieldIds),
    fieldOrder: order,
    pinnedFieldIds: resolveTablePinnedFieldIds(columns, pinnedFieldIds, order),
  };
}

/** Pin appends to the pinned block; unpinning inserts at the start of unpinned columns. */
export function toggleTableColumnPinned(
  columns: TableColumn[],
  hiddenFieldIds: string[] | undefined,
  fieldOrder: string[] | undefined,
  pinnedFieldIds: string[] | undefined,
  fieldId: string
): TableFieldsConfiguration {
  const pinnable = tablePinnableColumns(columns).some(column => column.id === fieldId);
  const current = resolveTableFieldsConfiguration(
    columns,
    hiddenFieldIds,
    fieldOrder,
    pinnedFieldIds
  );
  if (!pinnable) return current;

  const pinned = new Set(current.pinnedFieldIds);
  if (pinned.has(fieldId)) pinned.delete(fieldId);
  else pinned.add(fieldId);
  return resolveTableFieldsConfiguration(columns, current.hiddenFieldIds, current.fieldOrder, [
    ...pinned,
  ]);
}

/** Apply a drag result to only its pinned or unpinned partition. */
export function reorderTableColumnPartition(
  columns: TableColumn[],
  hiddenFieldIds: string[] | undefined,
  fieldOrder: string[] | undefined,
  pinnedFieldIds: string[] | undefined,
  reorderedIds: string[]
): TableFieldsConfiguration {
  const current = resolveTableFieldsConfiguration(
    columns,
    hiddenFieldIds,
    fieldOrder,
    pinnedFieldIds
  );
  const pinned = new Set(current.pinnedFieldIds);
  const byId = new Map(columns.map(column => [column.id, column]));
  const fixedStart = current.fieldOrder.filter(id => byId.get(id)?.sticky === 'start');
  const fixedEnd = current.fieldOrder.filter(id => byId.get(id)?.sticky === 'end');
  const pinnedOrder = current.fieldOrder.filter(id => pinned.has(id));
  const unpinnedOrder = current.fieldOrder.filter(id => !pinned.has(id) && !byId.get(id)?.sticky);
  const reordersPinned = reorderedIds.some(id => pinned.has(id));
  const nextPinned = reordersPinned ? resolveListOrder(pinnedOrder, reorderedIds) : pinnedOrder;
  const nextUnpinned = reordersPinned
    ? unpinnedOrder
    : resolveListOrder(unpinnedOrder, reorderedIds);
  return resolveTableFieldsConfiguration(
    columns,
    current.hiddenFieldIds,
    [...fixedStart, ...nextPinned, ...nextUnpinned, ...fixedEnd],
    current.pinnedFieldIds
  );
}

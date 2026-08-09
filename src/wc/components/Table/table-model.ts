import type {
  TableCellBlank,
  TableCellAction,
  TableCellEmpty,
  TableCellIcon,
  TableCellImage,
  TableCellPrimaryText,
  TableCellText,
  TableCellTag,
  TableCellValue,
  TableColumn,
  TableGroup,
  TableGroupingState,
  TableRow,
  TableSortState,
} from './table-types';

export interface TableSelectionState {
  selectableRowIds: string[];
  selectedLoadedCount: number;
  allSelected: boolean;
  indeterminate: boolean;
}

const TABLE_COLUMN_WIDTH_TOKENS = {
  xs: '--dimension-table-column-width-xs',
  sm: '--dimension-table-column-width-sm',
  md: '--dimension-table-column-width-md',
  lg: '--dimension-table-column-width-lg',
  xl: '--dimension-table-column-width-xl',
} as const;

export function isTableCellText(value: TableCellValue): value is TableCellText {
  return typeof value === 'object' && value !== null && 'primary' in value && !('kind' in value);
}

export function isTableCellPrimaryText(value: TableCellValue): value is TableCellPrimaryText {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'primary-text';
}

export function isTableCellTag(value: TableCellValue): value is TableCellTag {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'tag';
}

export function isTableCellIcon(value: TableCellValue): value is TableCellIcon {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'icon';
}

export function isTableCellImage(value: TableCellValue): value is TableCellImage {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'image';
}

export function isTableCellAction(value: TableCellValue): value is TableCellAction {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'action';
}

export function isTableCellEmpty(value: TableCellValue): value is TableCellEmpty {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'empty';
}

export function isTableCellBlank(value: TableCellValue): value is TableCellBlank {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'blank';
}

export function tableCellPrimary(value: TableCellValue): string | number | null {
  if (value == null) return null;
  if (isTableCellTag(value)) return value.label;
  if (isTableCellIcon(value)) return null;
  if (isTableCellImage(value)) return value.alt;
  if (isTableCellAction(value)) return value.label ?? value.ariaLabel;
  if (isTableCellPrimaryText(value)) return value.primary;
  if (isTableCellEmpty(value) || isTableCellBlank(value)) return null;
  return isTableCellText(value) ? value.primary : value;
}

export function tableRowSelectionLabel(row: TableRow, columns: TableColumn[]): string {
  const explicit = row.selectionLabel?.trim();
  if (explicit) return explicit;

  for (const column of columns) {
    const primary = tableCellPrimary(row.cells[column.id]);
    if (primary != null && String(primary).trim()) return String(primary);
  }

  return row.id;
}

export function nextTableSortState(
  current: TableSortState | null | undefined,
  columnId: string,
): TableSortState {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
  if (current.direction === 'asc') return { columnId, direction: 'desc' };
  return { columnId, direction: 'asc' };
}

export function nextTableGroupOrder(grouping: TableGroupingState): TableGroupingState {
  return {
    ...grouping,
    direction: grouping.direction === 'asc' ? 'desc' : 'asc',
  };
}

export function clampTableColumnSize(column: TableColumn): number | undefined {
  if (typeof column.size !== 'number' || !Number.isFinite(column.size) || column.size <= 0) {
    return undefined;
  }

  const minimum = Number.isFinite(column.minSize) && (column.minSize ?? 0) > 0
    ? column.minSize!
    : 0;
  const maximum = Number.isFinite(column.maxSize) && (column.maxSize ?? 0) > 0
    ? Math.max(column.maxSize!, minimum)
    : Number.POSITIVE_INFINITY;

  return Math.min(Math.max(column.size!, minimum), maximum);
}

export function tableColumnSize(column: TableColumn): string | undefined {
  if (typeof column.size === 'string') {
    return `var(${TABLE_COLUMN_WIDTH_TOKENS[column.size]})`;
  }
  const width = clampTableColumnSize(column);
  return width == null ? undefined : `${width}px`;
}

export function tableExplicitMinWidth(columns: TableColumn[]): string | undefined {
  const widths = columns.map(tableColumnSize).filter((width): width is string => !!width);
  if (widths.length === 0) return undefined;
  return widths.length === 1 ? widths[0] : `calc(${widths.join(' + ')})`;
}

export function tableRows(rows: TableRow[], groups: TableGroup[], grouped: boolean): TableRow[] {
  return grouped ? groups.flatMap(group => group.rows) : rows;
}

function canSelectRow(row: TableRow): boolean {
  return row.selectable !== false && !row.disabled;
}

export function deriveTableSelectionState(
  rows: TableRow[],
  selectedRowIds: readonly string[],
): TableSelectionState {
  const selected = new Set(selectedRowIds);
  const selectableRowIds = rows.filter(canSelectRow).map(row => row.id);
  const selectedLoadedCount = selectableRowIds.reduce(
    (count, id) => count + (selected.has(id) ? 1 : 0),
    0,
  );

  return {
    selectableRowIds,
    selectedLoadedCount,
    allSelected: selectableRowIds.length > 0 && selectedLoadedCount === selectableRowIds.length,
    indeterminate: selectedLoadedCount > 0 && selectedLoadedCount < selectableRowIds.length,
  };
}

export function toggleTableRowSelection(
  selectedRowIds: readonly string[],
  row: TableRow,
): string[] {
  if (!canSelectRow(row)) return [...selectedRowIds];
  const selected = new Set(selectedRowIds);
  if (selected.has(row.id)) selected.delete(row.id);
  else selected.add(row.id);
  return [...selected];
}

export function toggleAllLoadedTableRows(
  selectedRowIds: readonly string[],
  loadedRows: TableRow[],
): string[] {
  const selected = new Set(selectedRowIds);
  const state = deriveTableSelectionState(loadedRows, selectedRowIds);

  for (const id of state.selectableRowIds) {
    if (state.allSelected) selected.delete(id);
    else selected.add(id);
  }

  return [...selected];
}

export function resolvedTableGroupCount(group: TableGroup): number {
  const total = Number.isFinite(group.totalCount) ? Math.max(0, group.totalCount!) : 0;
  return Math.max(total, group.rows.length);
}

export function tableModelIssues(
  columns: TableColumn[],
  rows: TableRow[],
  groups: TableGroup[],
  grouped: boolean,
): string[] {
  const issues: string[] = [];
  const columnIds = new Set<string>();
  for (const column of columns) {
    if (!column.id.trim()) issues.push('Every column requires a non-empty id.');
    else if (columnIds.has(column.id)) issues.push(`Duplicate column id: ${column.id}`);
    columnIds.add(column.id);
  }

  const groupIds = new Set<string>();
  if (grouped) {
    for (const group of groups) {
      if (!group.id.trim()) issues.push('Every group requires a non-empty id.');
      else if (groupIds.has(group.id)) issues.push(`Duplicate group id: ${group.id}`);
      groupIds.add(group.id);
      if (group.totalCount != null && group.totalCount < group.rows.length) {
        issues.push(`Group ${group.id} totalCount is smaller than its loaded row count.`);
      }
    }
  }

  const rowIds = new Set<string>();
  for (const row of tableRows(rows, groups, grouped)) {
    if (!row.id.trim()) issues.push('Every row requires a non-empty id.');
    else if (rowIds.has(row.id)) issues.push(`Duplicate row id: ${row.id}`);
    rowIds.add(row.id);
  }

  return [...new Set(issues)];
}

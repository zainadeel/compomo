export type TableSortDirection = 'asc' | 'desc';
export type TableSelectionMode = 'none' | 'multiple';
export type TableCellAlign = 'start' | 'center' | 'end';
export type TableDensity = 'md' | 'sm';
export type TableCaptionVisibility = 'visible' | 'hidden';
export type TableLoadMoreMode = 'auto' | 'manual';
export type TableLoadMoreReason = 'auto' | 'manual' | 'retry';

/** Controlled member-row sort state. Group order is controlled separately. */
export interface TableSortState {
  columnId: string;
  direction: TableSortDirection;
}

/** One controlled grouping level plus the supplied group-order direction. */
export interface TableGroupingState {
  columnId: string;
  direction: TableSortDirection;
}

/** Standard two-line cell content owned by the table renderer. */
export interface TableCellText {
  primary: string | number;
  secondary?: string;
  /** Allow this cell to wrap even when its column truncates by default. */
  wrap?: boolean;
  fontFeature?: 'normal' | 'tabular-nums';
}

export type TableCellValue = string | number | null | undefined | TableCellText;

export interface TableColumn {
  /** Stable column identity. */
  id: string;
  header: string;
  align?: TableCellAlign;
  sortable?: boolean;
  /** Preferred width in CSS pixels. */
  size?: number;
  /** Minimum accepted preferred width in CSS pixels. */
  minSize?: number;
  /** Maximum accepted preferred width in CSS pixels. */
  maxSize?: number;
  /** Wrap cell text instead of truncating it to one line. */
  wrap?: boolean;
}

export interface TableRow {
  /** Stable identity, unique across all groups. */
  id: string;
  cells: Record<string, TableCellValue>;
  /** Accessible row name used by its selection control. Falls back to the first cell. */
  selectionLabel?: string;
  /** Exclude this row from selection without muting its content. */
  selectable?: boolean;
  /** Keep the row visible while disabling its selection control and styling it as inactive. */
  disabled?: boolean;
}

export interface TableGroup {
  /** Stable group identity. */
  id: string;
  label: string;
  value?: string | number;
  /** Total server-side member count; may exceed the currently loaded row count. */
  totalCount?: number;
  /** Optional localized, display-ready count such as “18 vehicles”. */
  countLabel?: string;
  rows: TableRow[];
}

export interface TableSortChangeDetail {
  sort: TableSortState | null;
}

export interface TableGroupingChangeDetail {
  grouping: TableGroupingState;
}

export interface TableSelectionChangeDetail {
  selectedRowIds: string[];
  scope: 'row' | 'all-loaded';
  changedRowId?: string;
  selected?: boolean;
}

export interface TableLoadMoreDetail {
  reason: TableLoadMoreReason;
  loadIdentity: string | number;
  loadedRowCount: number;
}


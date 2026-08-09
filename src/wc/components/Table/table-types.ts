import type { TagContrast, TagIntent } from '../Tag/Tag';
import type { IconColor } from '../Icon/Icon';

export type TableSortDirection = 'asc' | 'desc';
export type TableSelectionMode = 'none' | 'multiple';
export type TableCellAlign = 'start' | 'center' | 'end';
export type TableCaptionVisibility = 'visible' | 'hidden';
export type TableLoadMoreMode = 'auto' | 'manual';
export type TableLoadMoreReason = 'auto' | 'manual' | 'retry';
export type TableColumnWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Independently sortable label within a compound column header. */
export interface TableHeaderSegment {
  label: string;
  /** Stable key emitted through TableSortState.columnId. */
  sortKey: string;
  /** Visible separator rendered after this label when another segment follows. */
  separator?: string;
}

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

/** Two-line text content where both tracks use primary body text. */
export interface TableCellPrimaryText {
  kind: 'primary-text';
  primary: string | number;
  secondary: string | number;
  /** Allow this cell to wrap even when its column truncates by default. */
  wrap?: boolean;
  fontFeature?: 'normal' | 'tabular-nums';
}

/** Applicable data point whose value is currently unavailable. */
export interface TableCellEmpty {
  kind: 'empty';
}

/** Data point that is intentionally not applicable to this row. */
export interface TableCellBlank {
  kind: 'blank';
}

/** Declarative icon-only content rendered by the table's standard cell primitive. */
export interface TableCellIcon {
  kind: 'icon';
  /** Exact canonical IcoMo export name. */
  icon: string;
  color?: IconColor;
  /** Accessible label for informative icons. Omit only when the icon is decorative. */
  label?: string;
  /** Application-owned value used when this icon column participates in sorting. */
  sortValue?: string | number | boolean;
}

/** Declarative 16:9 image preview rendered by the table's standard cell primitive. */
export interface TableCellImage {
  kind: 'image';
  /** Optional image source. Omit it to render the standard bordered placeholder. */
  src?: string;
  /** Accessible description for either the image or its placeholder. */
  alt: string;
}

interface TableCellActionBase {
  kind: 'action';
  /** Stable application-owned action identity emitted with dsCellAction. */
  actionId: string;
  /** Add the ButtonUnfilled resting border. Action cells are unbordered by default. */
  hasBorder?: boolean;
  isInactive?: boolean;
  isLoading?: boolean;
}

/** Declarative ButtonUnfilled content rendered by the table's standard action cell. */
export type TableCellAction = TableCellActionBase & (
  | {
      variant?: 'label';
      label: string;
      icon?: never;
      ariaLabel?: string;
    }
  | {
      variant: 'icon-label';
      label: string;
      icon: string;
      ariaLabel?: string;
    }
  | {
      variant: 'icon';
      label?: never;
      icon: string;
      ariaLabel: string;
    }
);

/** Declarative Tag content rendered by the table's standard cell primitive. */
export type TableCellTagVariant = 'tag-only' | 'tag-with-text' | 'text-with-tag';

interface TableCellTagBase {
  kind: 'tag';
  label: string;
  intent?: TagIntent;
  contrast?: TagContrast;
  icon?: string;
  rounded?: boolean;
}

export type TableCellTag = TableCellTagBase & (
  | {
      variant?: 'tag-only';
      text?: never;
    }
  | {
      variant: Exclude<TableCellTagVariant, 'tag-only'>;
      text: string;
    }
);

export type TableCellValue =
  | string
  | number
  | null
  | undefined
  | TableCellText
  | TableCellPrimaryText
  | TableCellTag
  | TableCellIcon
  | TableCellImage
  | TableCellAction
  | TableCellEmpty
  | TableCellBlank;

export interface TableColumn {
  /** Stable column identity. */
  id: string;
  header: string;
  /** Optional labels for columns that present and sort multiple related data points. */
  headerSegments?: TableHeaderSegment[];
  align?: TableCellAlign;
  sortable?: boolean;
  /** Preferred TokoMo table-column width. Numbers remain available for exceptional custom pixel widths. */
  size?: TableColumnWidth | number;
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

export interface TableCellActionDetail {
  actionId: string;
  rowId: string;
  columnId: string;
}

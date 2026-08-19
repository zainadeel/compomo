import type { TagContrast, TagIntent } from '../Tag/Tag';
import type { IconColor } from '../Icon/Icon';
import type { TextColor } from '../Text/text-types';
import type { PaginationState } from '../Pagination/pagination-types';

export type TableSortDirection = 'asc' | 'desc';
export type TableSelectionMode = 'none' | 'multiple';
export type TableCellAlign = 'start' | 'center' | 'end';
export type TableCellLinkTarget = '_self' | '_blank';
export type TableColumnSticky = 'start' | 'end';
export type TableCaptionVisibility = 'visible' | 'hidden';
export type TableLoadMoreMode = 'auto' | 'manual';
export type TableDataMode = 'infinite' | 'pagination';
export type TableLoadMoreReason = 'auto' | 'manual' | 'retry';
export type TableColumnWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/** Semantic color for a group section header (faint surface + bold title). */
export type TableGroupIntent =
  | 'brand'
  | 'neutral'
  | 'negative'
  | 'warning'
  | 'caution'
  | 'positive';

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

/** One controlled grouping level. Applications supply groups in their final fixed order. */
export interface TableGroupingState {
  columnId: string;
  direction: TableSortDirection;
}

/** One independently colored run inside a secondary or tertiary track. */
export interface TableCellTextRun {
  text: string;
  /** Defaults to the track’s standard color. */
  color?: TextColor;
}

/** A secondary or tertiary track: one string, or up to three colorable runs. */
export type TableCellTextTrack = string | TableCellTextRun[];

/** Standard two- or three-line cell content owned by the table renderer. */
export interface TableCellText {
  primary: string | number;
  secondary?: TableCellTextTrack;
  /** Third subdued track; ignored on dual-primary cells. */
  tertiary?: TableCellTextTrack;
  /** Optional semantic foreground for a string secondary track. */
  secondaryColor?: TextColor;
  /** Optional semantic foreground for a string tertiary track. */
  tertiaryColor?: TextColor;
  /** Application-owned URL for the primary track only. Scalars stay unlinked. */
  href?: string;
  /** Native anchor target for a resolved primary link. */
  target?: TableCellLinkTarget;
  /** Allow this cell to wrap even when its column truncates by default. */
  wrap?: boolean;
  fontFeature?: 'normal' | 'tabular-nums';
}

/** Two-line text content where both tracks use primary body text. */
export interface TableCellPrimaryText {
  kind: 'primary-text';
  primary: string | number;
  secondary: string | number;
  /** Application-owned URL for the primary track only. */
  href?: string;
  /** Native anchor target for a resolved primary link. */
  target?: TableCellLinkTarget;
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

/**
 * Prefix icon beside a text copy stack. Independent of icon-only and plain
 * text cells so those recipes stay unchanged.
 */
export interface TableCellIconText {
  kind: 'icon-text';
  /** Exact canonical IcoMo export name. */
  icon: string;
  iconColor?: IconColor;
  /** Accessible name. Omit when the glyph is decorative. */
  iconLabel?: string;
  primary: string | number;
  secondary?: TableCellTextTrack;
  tertiary?: TableCellTextTrack;
  secondaryColor?: TextColor;
  tertiaryColor?: TextColor;
  href?: string;
  target?: TableCellLinkTarget;
  wrap?: boolean;
  fontFeature?: 'normal' | 'tabular-nums';
}

/** Body-row track stack an image preview occupies. */
export type TableCellImageTracks = 1 | 2 | 3;

/** Declarative 16:9 image preview rendered by the table's standard cell primitive. */
export interface TableCellImage {
  kind: 'image';
  /** Optional image source. Omit it to render the standard bordered placeholder. */
  src?: string;
  /** Accessible description for either the image or its placeholder. */
  alt: string;
  /**
   * Which body-row contract the preview fills. The thumbnail height is that
   * cell height minus 8px padding; width follows 16:9. Defaults to 1.
   */
  tracks?: TableCellImageTracks;
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
  | TableCellIconText
  | TableCellImage
  | TableCellAction
  | TableCellEmpty
  | TableCellBlank;

export type TableSkeletonWidth = string | number;

/** Representative loading geometry for one table column. */
export type TableCellSkeleton =
  | {
      kind: 'text';
      /** One track for scalar content, two for primary and secondary, three when tertiary is present. */
      lines?: 1 | 2 | 3;
      primaryWidth?: TableSkeletonWidth;
      secondaryWidth?: TableSkeletonWidth;
      tertiaryWidth?: TableSkeletonWidth;
  }
  | {
      kind: 'image';
      /** Match the loaded image cell's track stack. Defaults to 1. */
      tracks?: TableCellImageTracks;
  }
  | {
      kind: 'tag';
      width?: TableSkeletonWidth;
  }
  | {
      kind: 'icon';
      rounded?: boolean;
  }
  | {
      kind: 'icon-text';
      lines?: 1 | 2 | 3;
      primaryWidth?: TableSkeletonWidth;
      secondaryWidth?: TableSkeletonWidth;
      tertiaryWidth?: TableSkeletonWidth;
  }
  | {
      kind: 'action';
      /** Icon actions use a square control canvas; labeled actions may provide a wider width. */
      variant?: 'icon' | 'label' | 'icon-label';
      width?: TableSkeletonWidth;
  }
  | {
      kind: 'blank';
  };

export interface TableColumn {
  /** Stable column identity. */
  id: string;
  /** Visible column label. May be empty when headerLabel supplies a non-visual name. */
  header: string;
  /** Screen-reader-only column name for an intentionally blank visual header. */
  headerLabel?: string;
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
  /** Pin one application column to either inline edge during horizontal scrolling. */
  sticky?: TableColumnSticky;
  /**
   * Declare a trailing application-action lane. Action columns keep fixed
   * geometry and may host grouped table-level controls in their header.
   */
  kind?: 'data' | 'action';
  /** Representative loading geometry for this column. Defaults to one text line. */
  skeleton?: TableCellSkeleton;
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
  /** Make the complete row a keyboard- and pointer-activatable application target. */
  interactive?: boolean;
}

export interface TableGroup {
  /** Stable group identity. */
  id: string;
  label: string;
  value?: string | number;
  /** Total server-side member count; may exceed the currently loaded row count. */
  totalCount?: number;
  /** Optional localized total-count phrase such as “166 events” for accessible loaded progress. */
  countLabel?: string;
  /**
   * Optional semantic intent for the group section header. Applies a faint
   * intent background and bold intent title color.
   */
  intent?: TableGroupIntent;
  /** Whether this group has more member rows available to load. */
  hasMore?: boolean;
  /** Controlled incremental loading state for this group's member rows. */
  loadingMore?: boolean;
  /** Controlled incremental loading failure for this group's member rows. */
  loadMoreError?: string;
  /** Reset key for this group's query, sort, or filter state. Defaults to the group ID. */
  loadIdentity?: string | number;
  rows: TableRow[];
}

export interface TableSortChangeDetail {
  sort: TableSortState | null;
}

export interface TableSelectionChangeDetail {
  selectedRowIds: string[];
  scope: 'row' | 'all-loaded' | 'group';
  changedRowId?: string;
  /** Present when scope is `group`. */
  groupId?: string;
  selected?: boolean;
}

export interface TableLoadMoreDetail {
  reason: TableLoadMoreReason;
  loadIdentity: string | number;
  loadedRowCount: number;
}

export interface TableGroupLoadMoreDetail extends TableLoadMoreDetail {
  groupId: string;
}

export interface TableCellActionDetail {
  actionId: string;
  rowId: string;
  columnId: string;
}

export interface TableGroupCollapseChangeDetail {
  scope: 'group' | 'all';
  /** Present when a single group was toggled. */
  groupId?: string;
  collapsed: boolean;
  collapsedGroupIds: string[];
}

export interface TableRowActivateDetail {
  rowId: string;
}

/** Controlled top-level pagination state. Rows or groups contain only the active page. */
export interface TablePaginationState extends PaginationState {
  /** Change to request one fresh fitted-capacity snapshot for the current query shape. */
  fitIdentity?: string | number;
}

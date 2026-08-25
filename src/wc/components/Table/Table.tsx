import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import {
  deriveTableSelectionState,
  formatTableResultSummary,
  formatTableTotalSummary,
  hasOwnedTableFooterSlot,
  isTableCellAction,
  nextTableSortState,
  tableColumnSize,
  tableModelIssues,
  tableRows,
  tableRowSelectionLabel,
  toggleAllLoadedTableRows,
  toggleTableGroupCollapsed,
  toggleTableGroupSelection,
  nextTableGroupsCollapsed,
  toggleTableRowSelection,
} from './table-model';
import {
  resolveTableCellImageTracks,
  resolveTableCellPresentation,
  tableCellImageVariant,
  tableCellTextOverflowProps,
  type TableCellPresentation,
} from './table-cell-model';
import {
  createTableRenderModel,
  type TableGroupRenderModel,
  type TableRenderModel,
} from './table-render-model';
import {
  isRenderableTableActionMenu,
  isTableCellActionMenu,
  nextTableActionMenuElementId,
  tableActionMenuSections,
  tableActionTriggerId,
} from './table-action-menu';
import {
  nextTableColumnCustomizerElementId,
  resolveTableColumnOrder,
  resolveTableHiddenColumnIds,
  resolveTableVisibleColumns,
  tableColumnCustomizerMenuItems,
  toggleTableColumnHidden,
} from './table-column-customizer';
import {
  nextTableDataModeSwitcherElementId,
  tableDataModeFromMenuItem,
  tableDataModeMenuItems,
} from './table-data-mode-switcher';
import { resolveTableTruncateTrack, tableTruncateLabel } from './table-truncate';
import { TableLayoutController } from './table-layout-controller';
import { TableLoadController } from './table-load-controller';
import { TableGroupLoadController } from './table-group-load-controller';
import {
  flattenTableVirtualItems,
  resolveTableVirtualPlan,
  TABLE_VIRTUAL_TOTAL_SUMMARY_LABEL,
  TABLE_VIRTUAL_VIEWPORT_REQUIRED_BODY,
  TABLE_VIRTUAL_VIEWPORT_REQUIRED_HEADING,
  type TableVirtualItem,
  type TableVirtualNode,
  type TableVirtualPlan,
} from './table-virtual-model';
import { TableVirtualController } from './table-virtual-controller';
import type { PaginationChangeDetail } from '../Pagination/pagination-types';
import type { MenuItemData, MenuReorderDetail } from '../Menu/menu-types';
import { resolvePaginationState } from '../Pagination/pagination-model';
import { resolveCssLengthPx } from '../../utils/resolve-css-length-px';
import { isElementTruncated } from '../../utils/is-element-truncated';
import { resolveSafeUrl } from '../../utils/safe-url';
import { observeTableCaptionCompact } from '../../utils/table-caption-compact';
import { resolveTableFitPageSize } from './table-pagination-fit';
import {
  paginationShortcutBlockedByPath,
  shouldHandleContainingPagePaginationShortcut,
} from './table-pagination-shortcut';
import {
  TableViewportFitController,
  type TableViewportFitMetrics,
} from './table-viewport-fit-controller';
import type {
  TableCaptionVisibility,
  TableCellActionDetail,
  TableCellLineClamp,
  TableCellSkeleton,
  TableCellTextRun,
  TableColumn,
  TableColumnsConfigChangeDetail,
  TableDataMode,
  TableDataModeChangeDetail,
  TableGroup,
  TableGroupCollapseChangeDetail,
  TableGroupLoadMoreDetail,
  TableGroupingState,
  TableLoadMoreDetail,
  TableLoadMoreMode,
  TablePaginationState,
  TableRow,
  TableRowActivateDetail,
  TableSelectionChangeDetail,
  TableSelectionMode,
  TableSortChangeDetail,
  TableSortState,
} from './table-types';

const TABLE_FOOTER_SLOT_LEADING = 1;
const TABLE_FOOTER_SLOT_COPY = 2;
const TABLE_FOOTER_SLOT_TRAILING = 4;

@Component({
  tag: 'ds-table',
  styleUrls: ['../../utils/focus-ring.css', '../../utils/interaction-fill.css', 'Table.css'],
  scoped: true,
})
export class Table {
  @Element() el!: HTMLElement;
  /** Stable column definitions. Assign through JavaScript. */
  @Prop() columns: TableColumn[] = [];
  /** Ungrouped row data. Ignored while grouping is active. Assign through JavaScript. */
  @Prop() rows: TableRow[] = [];
  /** One level of application-owned grouped data. Assign through JavaScript. */
  @Prop() groups: TableGroup[] = [];
  /** Controlled grouping column. Applications supply groups in their final fixed order. */
  @Prop() grouping: TableGroupingState | null = null;
  /** Controlled member-row sort state. */
  @Prop() sort: TableSortState | null = null;
  /** Controlled collapsed group identities. Groups not listed remain expanded. */
  @Prop() collapsedGroupIds: string[] = [];

  /** Required accessible table name, retained as a native caption. */
  @Prop() caption!: string;
  /** Shows a matching presentational title bar above the native table frame. */
  @Prop() captionVisibility: TableCaptionVisibility = 'hidden';
  /**
   * Opt in to the table-owned column customizer. The `columns` prop remains the
   * catalog; hidden and ordered columns are controlled separately. The trigger
   * opens the shared Menu of live show/hide switch rows.
   */
  @Prop() columnCustomizer: boolean = false;
  /** Controlled hidden data-column identities. Action ids are ignored. */
  @Prop() hiddenColumnIds: string[] = [];
  /** Controlled data-column identities in display order. Omitted ids append in catalog order. */
  @Prop() columnOrder: string[] = [];
  /**
   * Optional result summary footer. When both `displayedCount` and `totalCount`
   * are finite numbers, infinite mode shows “Displaying {displayed} of {total}”.
   * Virtual mode ignores `displayedCount` and derives its total from the
   * complete supplied rows; a mismatched `totalCount` emits a warning.
   */
  @Prop() displayedCount: number | undefined;
  @Prop() totalCount: number | undefined;
  /** Supports {displayed} and {total} placeholders. */
  @Prop() resultSummaryLabel: string = 'Displaying {displayed} of {total}';
  /** Supports the {total} placeholder. Used when dataMode is virtual. */
  @Prop() resultTotalSummaryLabel: string = TABLE_VIRTUAL_TOTAL_SUMMARY_LABEL;
  @Prop() stickyHeader: boolean = false;
  /** Maximum scroll-region height. Numbers resolve to CSS pixels. */
  @Prop() maxHeight: string | number | undefined;
  /** Fixed height for the complete header, table frame, and footer composition. */
  @Prop() height: string | number | undefined;
  /** Fit the complete table composition to its nearest vertical scrollport. */
  @Prop() fitViewport: boolean = false;
  /** Reserved space above a viewport-fitted table once surrounding chrome is compact. */
  @Prop() viewportInsetBlockStart: string | number = 0;
  /** Reserved space below a viewport-fitted table. */
  @Prop() viewportInsetBlockEnd: string | number = 0;
  /** Optional explicit label for the horizontal/vertical scroll region. */
  @Prop() scrollLabel: string | undefined;

  @Prop() selectionMode: TableSelectionMode = 'none';
  /** Controlled selected row identities. IDs outside the loaded rows are preserved. */
  @Prop() selectedRowIds: string[] = [];

  /** Initial loading state. Existing rows stay visible; incremental loading uses loadingMore. */
  @Prop() loading: boolean = false;
  /** Replace opted-in table-owned caption controls with same-size visual skeletons. */
  @Prop() chromeLoading: boolean = false;
  /** Initial-loading rows. Defaults to ten so bounded tables retain a useful filled viewport. */
  @Prop() skeletonRows: number = 10;
  @Prop() emptyHeading: string = 'No results';
  @Prop() emptyBody: string = 'No data is available.';
  /** Initial error state. Existing rows stay visible; incremental failures use loadMoreError. */
  @Prop() error: boolean = false;
  @Prop() errorHeading: string = 'Unable to load data';
  @Prop() errorBody: string = 'The data could not be loaded.';
  @Prop() emptyCellLabel: string = 'Not available';

  /** Top-level data-window strategy. Virtual mode recycles row DOM only. */
  @Prop() dataMode: TableDataMode = 'infinite';
  /** Opt in to the table-owned control for choosing between supported data modes. */
  @Prop() dataModeSwitcher: boolean = false;
  @Prop() dataModeSwitcherLabel: string = 'Change table variation';
  @Prop() dataModeMenuLabel: string = 'Table variation';
  @Prop() infiniteModeLabel: string = 'Infinite scroll';
  @Prop() paginationModeLabel: string = 'Pagination + Infinite groups';
  @Prop() virtualModeLabel: string = 'Virtual scroll';
  /** Controlled top-level pagination state. Required when dataMode is pagination. */
  @Prop() pagination: TablePaginationState | null = null;
  @Prop() loadMoreMode: TableLoadMoreMode = 'auto';
  @Prop() hasMore: boolean = false;
  @Prop() loadingMore: boolean = false;
  @Prop() loadMoreError: string | undefined;
  /** Reset key for a new query/group/sort dataset. */
  @Prop() loadIdentity: string | number = 'default';
  /** IntersectionObserver root margin in CSS pixels. */
  @Prop() loadMoreThreshold: number = 0;
  @Prop() loadMoreLabel: string = 'Load more';
  @Prop() retryLabel: string = 'Retry';
  @Prop() loadingMoreLabel: string = 'Loading more items';
  @Prop() endOfResultsLabel: string = 'All results loaded';
  /** Supports {count} and {total} placeholders. */
  @Prop() rowsLoadedLabel: string = '{count} more rows loaded. {total} rows loaded.';
  @Prop() groupLoadMoreLabel: string = 'Load more';
  /** Supports the {group} placeholder. */
  @Prop() groupLoadMoreAriaLabel: string = 'Load more {group} results';
  /** Supports the {group} placeholder. */
  @Prop() groupRetryLabel: string = 'Retry loading {group} results';
  /** Supports the {group} placeholder. */
  @Prop() groupLoadingMoreLabel: string = 'Loading more items';
  /** Supports the {group} placeholder. */
  @Prop() groupEndOfResultsLabel: string = 'All {group} results loaded';
  /** Supports {group}, {count}, {loaded}, and {total} placeholders. */
  @Prop() groupRowsLoadedLabel: string =
    '{count} more rows loaded in {group}. {loaded} of {total} rows loaded.';

  @Event() dsSortChange!: EventEmitter<TableSortChangeDetail>;
  @Event() dsGroupCollapseChange!: EventEmitter<TableGroupCollapseChangeDetail>;
  @Event() dsSelectionChange!: EventEmitter<TableSelectionChangeDetail>;
  @Event() dsLoadMore!: EventEmitter<TableLoadMoreDetail>;
  @Event() dsGroupLoadMore!: EventEmitter<TableGroupLoadMoreDetail>;
  @Event() dsPaginationChange!: EventEmitter<PaginationChangeDetail>;
  @Event() dsCellAction!: EventEmitter<TableCellActionDetail>;
  @Event() dsRowActivate!: EventEmitter<TableRowActivateDetail>;
  @Event() dsColumnsConfigChange!: EventEmitter<TableColumnsConfigChangeDetail>;
  @Event() dsDataModeChange!: EventEmitter<TableDataModeChangeDetail>;

  @State() private overflowStart = false;
  @State() private overflowEnd = false;
  @State() private scrollable = false;
  @State() private announcement = '';
  @State() private activeStickyGroupId: string | null = null;
  @State() private viewportFitSettled = false;
  @State() private headerPresent = false;
  @State() private headerUsesToolbar = false;
  @State() private footerSlotPresence = 0;
  @State() private fitPageSize: number | undefined;
  @State() private actionMenu: { rowId: string; columnId: string } | null = null;
  @State() private actionMenuInitialFocusVisible = false;
  @State() private truncateTooltipLabel = '';
  @State() private captionCompact = false;
  @State() private columnCustomizerOpen = false;
  @State() private columnCustomizerInitialFocusVisible = false;
  @State() private dataModeSwitcherOpen = false;
  @State() private dataModeSwitcherInitialFocusVisible = false;
  @State() private virtualWindow: TableVirtualPlan | null = null;

  private readonly actionMenuElementId = nextTableActionMenuElementId();
  private readonly columnCustomizerElementId = nextTableColumnCustomizerElementId();
  private readonly dataModeSwitcherElementId = nextTableDataModeSwitcherElementId();
  private truncateTooltipEl?: HTMLDsTooltipElement;
  private truncateAnchor: HTMLElement | null = null;
  private truncateTooltipBound = false;
  private focusedRowId: string | null = null;
  private virtualItems: TableVirtualItem[] = [];
  private visibleColumnsCache: {
    columns: TableColumn[];
    columnCustomizer: boolean;
    hiddenColumnIds: string[];
    columnOrder: string[];
    value: TableColumn[];
  } | null = null;
  private renderModelCache: {
    columns: TableColumn[];
    rows: TableRow[];
    groups: TableGroup[];
    grouped: boolean;
    selectionMode: TableSelectionMode;
    selectedRowIds: string[];
    collapsedGroupIds: string[];
    virtualCounts: boolean;
    value: TableRenderModel;
  } | null = null;
  private virtualItemsCache: {
    columns: TableColumn[];
    rows: TableRow[];
    groups: TableGroup[];
    grouped: boolean;
    collapsedGroupIds: string[];
  } | null = null;
  private virtualLookupCache: {
    rows: TableRow[];
    groups: TableGroupRenderModel[];
    rowsById: Map<string, TableRow>;
    groupsById: Map<string, TableGroupRenderModel>;
  } | null = null;
  private virtualRowPoolStates = new Map<
    string,
    {
      slotsByRowId: Map<string, number>;
      nextSlot: number;
    }
  >();

  private rootEl: HTMLElement | null = null;
  private viewportEl: HTMLElement | null = null;
  private frameEl: HTMLElement | null = null;
  private interactiveHeadEl: HTMLTableSectionElement | null = null;
  private collapseAllOverlayEl: HTMLElement | null = null;
  private stickyHeaderTableEl: HTMLTableElement | null = null;
  private tableEl: HTMLTableElement | null = null;
  private sentinelEl: HTMLElement | null = null;
  private incrementalWindowActive = false;
  private readonly groupSentinelEls = new Map<string, HTMLElement>();
  private previousModelWarning = '';
  private modelWarningQueued = false;
  private hasLoaded = false;
  private renderedModel: TableRenderModel | null = null;
  private stickyGroupConnected = false;
  private headerSlotObserver: MutationObserver | null = null;
  private footerSlotObserver: MutationObserver | null = null;
  private captionCompactDisconnect: (() => void) | undefined;
  private fitResizeObserver: ResizeObserver | null = null;
  private fitObservedViewport: HTMLElement | null = null;
  private fitObservedTable: HTMLTableElement | null = null;
  private fitMeasurementPending = false;
  private readonly layoutController = new TableLayoutController({
    elements: () => ({
      viewport: this.viewportEl,
      contentTable: this.tableEl,
      stickyHeaderTable: this.stickyHeaderTableEl,
      collapseAllOverlay: this.collapseAllOverlayEl,
      frame: this.frameEl,
      interactiveHead: this.interactiveHeadEl,
    }),
    mode: () => ({
      documentStickyHeader: this.documentStickyHeader,
      floatingCollapseAll: this.renderedModel?.collapseAllHost?.mode === 'floating',
      clampVerticalOverscroll: this.fitViewport && this.viewportFitSettled,
    }),
    verticalEdgeWheel: deltaY => this.viewportFitController.scrollOuterBy(deltaY),
    overflowChanged: state => {
      if (state.start !== this.overflowStart) this.overflowStart = state.start;
      if (state.end !== this.overflowEnd) this.overflowEnd = state.end;
      if (state.scrollable !== this.scrollable) this.scrollable = state.scrollable;
    },
  });
  private readonly loadController = new TableLoadController({
    state: () => ({
      lazyLoading: this.dataMode === 'infinite' && !this.grouped,
      loadMoreMode: this.loadMoreMode,
      hasMore: this.hasMore,
      loadingMore: this.loadingMore,
      loadMoreError: this.loadMoreError,
      loadIdentity: this.loadIdentity,
      loadMoreThreshold: this.loadMoreThreshold,
      containedScroll: this.containedScroll,
      loadingMoreLabel: this.loadingMoreLabel,
      endOfResultsLabel: this.endOfResultsLabel,
      rowsLoadedLabel: this.rowsLoadedLabel,
      loadedRowCount: this.currentLoadedRowCount(),
      viewport: this.viewportEl,
      sentinel: this.sentinelEl,
    }),
    announce: message => {
      this.announcement = message;
    },
    request: detail => {
      this.dsLoadMore.emit(detail);
    },
  });
  private readonly groupLoadController = new TableGroupLoadController({
    state: () => ({
      enabled: this.grouped && this.dataMode !== 'virtual',
      loadMoreMode: this.loadMoreMode,
      loadMoreThreshold: this.loadMoreThreshold,
      containedScroll: this.containedScroll,
      groups: this.groups,
      viewport: this.viewportEl,
      sentinels: this.groupSentinelEls,
      loadingMoreLabel: this.groupLoadingMoreLabel,
      endOfResultsLabel: this.groupEndOfResultsLabel,
      rowsLoadedLabel: this.groupRowsLoadedLabel,
    }),
    announce: message => {
      this.announcement = message;
    },
    request: detail => {
      this.dsGroupLoadMore.emit(detail);
    },
  });
  private readonly virtualController = new TableVirtualController({
    state: () => ({
      enabled: this.virtualizationEnabled,
      items: this.virtualItems,
      pinnedRowIds: this.virtualPinnedRowIds(),
      viewport: this.viewportEl,
      viewportSize: this.estimateVirtualViewportSize(),
    }),
    windowChanged: plan => {
      this.virtualWindow = plan;
    },
  });
  private readonly viewportFitController = new TableViewportFitController({
    enabled: () => this.fitViewport,
    elements: () => ({ host: this.el, surface: this.rootEl }),
    insets: () => ({
      blockStart: this.viewportInsetBlockStart,
      blockEnd: this.viewportInsetBlockEnd,
    }),
    fitChanged: (metrics: TableViewportFitMetrics | null) => {
      const settled = metrics?.settled ?? false;
      if (settled !== this.viewportFitSettled) this.viewportFitSettled = settled;
    },
  });

  componentWillLoad(): void {
    // Reserve the final viewport-fit height before the first paint. The fitted
    // surface is connected after render, but the host can already resolve its
    // owning scrollport and prevent an initial auto-height frame.
    this.viewportFitController.connect();
    this.incrementalWindowActive = this.hasIncrementalState;
    this.syncHeaderSlotPresence();
    this.syncFooterSlotPresence();
    this.loadController.initialize();
    this.groupLoadController.initialize();
    this.warnModelIssues();
  }

  componentDidLoad(): void {
    this.hasLoaded = true;
    this.layoutController.connect();
    this.loadController.connect();
    this.groupLoadController.connect();
    this.virtualController.connect();
    this.viewportFitController.connect();
    this.syncStickyGroupConnection();
    this.connectHeaderSlotObserver();
    this.connectFooterSlotObserver();
    this.connectFitObserver();
    this.connectCaptionCompactObserver();
    this.syncFitPageSize();
    this.connectTruncateTooltip();
  }

  componentDidRender(): void {
    this.layoutController.refresh(false);
    this.loadController.refresh();
    this.groupLoadController.refresh();
    this.virtualController.refresh();
    this.virtualController.collectMeasurements(this.tableEl);
    if (
      this.dataMode === 'virtual' &&
      this.truncateAnchor &&
      this.tableEl &&
      !this.tableEl.contains(this.truncateAnchor)
    ) {
      this.dismissTruncateTooltip();
    }
    this.viewportFitController.refresh(false);
    this.syncStickyGroupConnection();
    this.connectFitObserver();
    this.connectCaptionCompactObserver();
    this.syncFitPageSize();
    if (this.stickyGroupConnected) this.updateStickyGroup();
  }

  connectedCallback(): void {
    if (!this.hasLoaded) return;
    this.layoutController.connect();
    this.loadController.connect();
    this.groupLoadController.connect();
    this.virtualController.connect();
    this.viewportFitController.connect();
    this.syncStickyGroupConnection();
    this.connectHeaderSlotObserver();
    this.connectFooterSlotObserver();
    this.connectFitObserver();
    this.connectCaptionCompactObserver();
    this.connectTruncateTooltip();
  }

  disconnectedCallback(): void {
    this.layoutController.disconnect();
    this.loadController.disconnect();
    this.groupLoadController.disconnect();
    this.virtualController.disconnect();
    this.viewportFitController.disconnect();
    this.disconnectStickyGroup();
    this.headerSlotObserver?.disconnect();
    this.headerSlotObserver = null;
    this.footerSlotObserver?.disconnect();
    this.footerSlotObserver = null;
    this.disconnectFitObserver();
    this.disconnectCaptionCompactObserver();
    this.disconnectTruncateTooltip();
    this.closeColumnCustomizer();
  }

  private syncHeaderSlotPresence = () => {
    const header = this.el.querySelector<HTMLElement>('[slot="header"]');
    this.headerPresent = !!header;
    this.headerUsesToolbar = header?.tagName === 'DS-TABLE-TOOLBAR';
  };

  private connectHeaderSlotObserver(): void {
    if (this.headerSlotObserver || typeof MutationObserver === 'undefined') return;
    this.headerSlotObserver = new MutationObserver(this.syncHeaderSlotPresence);
    this.headerSlotObserver.observe(this.el, { childList: true });
    this.syncHeaderSlotPresence();
  }

  private syncFooterSlotPresence = () => {
    let presence = 0;
    if (hasOwnedTableFooterSlot(this.el, 'footer-leading')) presence |= TABLE_FOOTER_SLOT_LEADING;
    if (hasOwnedTableFooterSlot(this.el, 'footer')) presence |= TABLE_FOOTER_SLOT_COPY;
    if (hasOwnedTableFooterSlot(this.el, 'footer-trailing')) presence |= TABLE_FOOTER_SLOT_TRAILING;
    if (presence !== this.footerSlotPresence) this.footerSlotPresence = presence;
  };

  private connectFooterSlotObserver(): void {
    if (this.footerSlotObserver || typeof MutationObserver === 'undefined') return;
    this.footerSlotObserver = new MutationObserver(this.syncFooterSlotPresence);
    this.footerSlotObserver.observe(this.el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['slot'],
    });
    this.syncFooterSlotPresence();
  }

  private connectStickyGroup(): void {
    if (this.stickyGroupConnected || typeof window === 'undefined') return;
    this.stickyGroupConnected = true;
    document.addEventListener('scroll', this.updateStickyGroup, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', this.updateStickyGroup, { passive: true });
    this.updateStickyGroup();
  }

  private syncStickyGroupConnection(): void {
    if (this.documentStickyHeader && this.grouped) {
      this.connectStickyGroup();
      return;
    }

    this.disconnectStickyGroup();
    this.frameEl?.style.removeProperty('--_table-sticky-group-top');
    if (this.activeStickyGroupId !== null) {
      this.activeStickyGroupId = null;
    }
  }

  private disconnectStickyGroup(): void {
    if (!this.stickyGroupConnected || typeof window === 'undefined') return;
    this.stickyGroupConnected = false;
    document.removeEventListener('scroll', this.updateStickyGroup, true);
    window.removeEventListener('resize', this.updateStickyGroup);
  }

  private readonly updateStickyGroup = (): void => {
    if (!this.documentStickyHeader || !this.grouped || !this.frameEl || !this.tableEl) {
      if (this.activeStickyGroupId !== null) this.activeStickyGroupId = null;
      return;
    }

    const stickyHeader = this.frameEl.querySelector<HTMLElement>(
      '.ds-table__document-sticky-header'
    );
    if (!stickyHeader) return;
    const threshold = stickyHeader.getBoundingClientRect().bottom;
    let activeGroupId: string | null = null;
    let activeGroupTop = threshold;
    for (const body of this.tableEl.querySelectorAll<HTMLElement>('tbody[data-group-id]')) {
      const source = body.querySelector<HTMLElement>('.ds-table__group-cell');
      if (!source) continue;
      const sourceRect = source.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();
      if (sourceRect.top <= threshold && bodyRect.bottom > threshold) {
        activeGroupId = body.dataset.groupId ?? null;
        // A sticky section is bounded by its own row group. As that boundary
        // approaches the sticky lane, move the outgoing section bar with it so
        // the incoming source bar pushes it away instead of rendering beneath it.
        activeGroupTop = Math.min(threshold, bodyRect.bottom - sourceRect.height);
      }
    }

    const frameRect = this.frameEl.getBoundingClientRect();
    this.frameEl.style.setProperty(
      '--_table-sticky-group-top',
      `${activeGroupTop - frameRect.top}px`
    );

    if (activeGroupId !== this.activeStickyGroupId) {
      this.activeStickyGroupId = activeGroupId;
      return;
    }
  };

  @Watch('columns')
  @Watch('grouping')
  @Watch('hiddenColumnIds')
  @Watch('columnOrder')
  @Watch('columnCustomizer')
  handleStructureChange(): void {
    this.scheduleModelIssueWarning();
    this.loadController.structureChanged();
    this.groupLoadController.structureChanged();
    this.virtualController.invalidateMeasures();
  }

  @Watch('rows')
  @Watch('groups')
  handleDataChange(): void {
    if (this.grouped) this.groupLoadController.dataChanged();
    else this.loadController.dataChanged();
    this.scheduleModelIssueWarning();
    this.syncActionMenu();
    this.virtualController.invalidateMeasures();
  }

  @Watch('totalCount')
  handleTotalCountChange(): void {
    this.scheduleModelIssueWarning();
  }

  @Watch('loadIdentity')
  handleLoadIdentityChange(): void {
    this.incrementalWindowActive = this.hasIncrementalState;
    this.loadController.identityChanged();
    this.virtualController.resetToTop();
  }

  @Watch('sort')
  @Watch('grouping')
  handleVirtualIndexReset(): void {
    this.virtualController.resetToTop();
  }

  @Watch('loadMoreMode')
  @Watch('loadMoreThreshold')
  handleLazyConfigurationChange(): void {
    this.loadController.configurationChanged();
    this.groupLoadController.configurationChanged();
  }

  @Watch('dataMode')
  handleDataModeChange(): void {
    this.incrementalWindowActive = this.hasIncrementalState;
    this.scheduleModelIssueWarning();
    this.handleLazyConfigurationChange();
    if (this.dataMode === 'virtual') this.virtualController.resetToTop();
  }

  @Watch('pagination')
  handlePaginationChange(
    pagination: TablePaginationState | null,
    previous: TablePaginationState | null
  ): void {
    if (pagination?.pageSizeMode === 'fit' && pagination.fitIdentity !== previous?.fitIdentity) {
      this.fitMeasurementPending = true;
    }
  }

  @Watch('loadingMore')
  handleLoadingMoreChange(loading: boolean): void {
    if (loading) this.incrementalWindowActive = true;
    if (!this.grouped) this.loadController.loadingChanged(loading);
  }

  @Watch('loadMoreError')
  handleLoadMoreErrorChange(error: string | undefined): void {
    if (error?.trim()) this.incrementalWindowActive = true;
    if (!this.grouped) this.loadController.errorChanged(error);
  }

  @Watch('hasMore')
  handleHasMoreChange(hasMore: boolean, hadMore: boolean): void {
    if (hasMore) this.incrementalWindowActive = true;
    if (!this.grouped) this.loadController.hasMoreChanged(hasMore, hadMore);
  }

  @Watch('columnCustomizer')
  @Watch('captionVisibility')
  handleColumnCustomizerAvailability(): void {
    if (!this.showsColumnCustomizer) this.closeColumnCustomizer();
  }

  @Watch('dataModeSwitcher')
  @Watch('captionVisibility')
  handleDataModeSwitcherAvailability(): void {
    if (!this.showsDataModeSwitcher) this.closeDataModeSwitcher();
  }

  @Watch('chromeLoading')
  handleChromeLoadingChange(loading: boolean): void {
    if (!loading) return;
    this.closeColumnCustomizer();
    this.closeDataModeSwitcher();
  }

  private get grouped(): boolean {
    return this.grouping !== null;
  }

  private get hasIncrementalState(): boolean {
    return (
      this.dataMode === 'infinite' &&
      (this.hasMore || this.loadingMore || !!this.loadMoreError?.trim())
    );
  }

  private get selectable(): boolean {
    return this.selectionMode === 'multiple';
  }

  private get visibleColumns(): TableColumn[] {
    const cached = this.visibleColumnsCache;
    if (
      cached &&
      cached.columns === this.columns &&
      cached.columnCustomizer === this.columnCustomizer &&
      cached.hiddenColumnIds === this.hiddenColumnIds &&
      cached.columnOrder === this.columnOrder
    ) {
      return cached.value;
    }
    const value = resolveTableVisibleColumns(this.columns, {
      columnCustomizer: this.columnCustomizer,
      hiddenColumnIds: this.hiddenColumnIds,
      columnOrder: this.columnOrder,
    });
    this.visibleColumnsCache = {
      columns: this.columns,
      columnCustomizer: this.columnCustomizer,
      hiddenColumnIds: this.hiddenColumnIds,
      columnOrder: this.columnOrder,
      value,
    };
    return value;
  }

  private get showsColumnCustomizer(): boolean {
    return this.columnCustomizer && this.captionVisibility === 'visible';
  }

  private get showsDataModeSwitcher(): boolean {
    return this.dataModeSwitcher && this.captionVisibility === 'visible';
  }

  private get showsCaptionTrailing(): boolean {
    return this.showsDataModeSwitcher || this.showsColumnCustomizer;
  }

  private get documentStickyHeader(): boolean {
    return this.stickyHeader && !this.containedScroll;
  }

  private get fixedHeight(): boolean {
    return !this.fitViewport && this.resolvedHeight !== undefined;
  }

  private get boundedComposition(): boolean {
    return this.fitViewport || this.fixedHeight;
  }

  private get containedScroll(): boolean {
    return this.boundedComposition || this.resolvedMaxHeight !== undefined;
  }

  private connectFitObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;
    if (this.fitObservedViewport === this.viewportEl && this.fitObservedTable === this.tableEl) {
      return;
    }
    this.disconnectFitObserver();
    this.fitObservedViewport = this.viewportEl;
    this.fitObservedTable = this.tableEl;
    this.fitResizeObserver = new ResizeObserver(this.syncFitPageSize);
    if (this.fitObservedViewport) this.fitResizeObserver.observe(this.fitObservedViewport);
    if (this.fitObservedTable) this.fitResizeObserver.observe(this.fitObservedTable);
  }

  private disconnectFitObserver(): void {
    this.fitResizeObserver?.disconnect();
    this.fitResizeObserver = null;
    this.fitObservedViewport = null;
    this.fitObservedTable = null;
  }

  private connectCaptionCompactObserver(): void {
    if (this.captionCompactDisconnect) return;
    this.captionCompactDisconnect = observeTableCaptionCompact(this.el, compact => {
      if (this.captionCompact !== compact) this.captionCompact = compact;
    });
  }

  private disconnectCaptionCompactObserver(): void {
    this.captionCompactDisconnect?.();
    this.captionCompactDisconnect = undefined;
  }

  private readonly syncFitPageSize = (): void => {
    const pagination = this.dataMode === 'pagination' ? this.pagination : null;
    if (
      !pagination?.fitToPage ||
      pagination.fitToPageInactive ||
      !this.containedScroll ||
      !this.viewportEl ||
      !this.tableEl
    ) {
      if (this.fitPageSize !== undefined) this.fitPageSize = undefined;
      this.fitMeasurementPending = false;
      return;
    }
    const header = this.tableEl.querySelector<HTMLElement>('.ds-table__head .ds-table__header-row');
    const item = this.tableEl.querySelector<HTMLElement>(
      this.grouped ? '.ds-table__group-row' : '.ds-table__body .ds-table__row'
    );
    const itemBlockSize =
      item?.getBoundingClientRect().height ||
      resolveCssLengthPx(
        'var(--ds-table-row-min-block-size, var(--dimension-size-500))',
        0,
        this.rootEl ?? this.el
      );
    const next = resolveTableFitPageSize({
      viewportBlockSize: this.viewportEl.clientHeight,
      headerBlockSize: header?.getBoundingClientRect().height ?? 0,
      itemBlockSize,
    });
    if (next !== this.fitPageSize) this.fitPageSize = next;
    if (!this.fitMeasurementPending || pagination.pageSizeMode !== 'fit' || next === undefined) {
      return;
    }
    this.fitMeasurementPending = false;
    if (next === pagination.pageSize && pagination.pageIndex === 0) return;
    this.dsPaginationChange.emit({
      pageIndex: 0,
      pageSize: next,
      pageSizeMode: 'fit',
      totalItems: pagination.totalItems,
      pageSizeOptions: pagination.pageSizeOptions ?? [25, 50, 100, 200],
      fitToPage: true,
      fitToPageInactive: false,
      fitPageSize: next,
      fitPageSizeLabel: pagination.fitPageSizeLabel ?? 'Fit to page',
      fitPageSizeTriggerLabel: pagination.fitPageSizeTriggerLabel ?? 'Fit',
      itemLabel: pagination.itemLabel ?? 'items',
      pageSizeLabel: pagination.pageSizeLabel ?? 'Items',
      ariaLabel: pagination.ariaLabel ?? `${this.caption} pagination`,
      previousPageIndex: pagination.pageIndex,
      previousPageSize: pagination.pageSize,
      previousPageSizeMode: 'fit',
      reason: 'fit',
    });
  };

  @Listen('keydown', { target: 'window' })
  handleWindowPaginationKeyDown(event: KeyboardEvent): void {
    this.handlePaginationKeyDown(event, true);
  }

  private handlePaginationKeyDown(event: KeyboardEvent, fromWindow = false): void {
    const pagination = this.dataMode === 'pagination' ? this.pagination : null;
    if (
      !pagination ||
      this.loading ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
    ) {
      return;
    }

    if (paginationShortcutBlockedByPath(event.composedPath())) return;

    if (fromWindow) {
      const origin = event.composedPath()[0];
      const originNode = origin instanceof Text ? origin.parentNode : origin;
      if (
        !shouldHandleContainingPagePaginationShortcut({
          origin: originNode,
          table: this.el,
          eventPath: event.composedPath(),
        })
      ) {
        return;
      }
    }

    const state = resolvePaginationState(pagination);
    const pageIndex = event.key === 'ArrowLeft' ? state.pageIndex - 1 : state.pageIndex + 1;
    if (pageIndex < 0 || pageIndex >= state.totalPages) return;

    event.preventDefault();
    this.dsPaginationChange.emit({
      pageIndex,
      pageSize: state.pageSize,
      pageSizeMode: state.pageSizeMode,
      totalItems: state.totalItems,
      pageSizeOptions: state.pageSizeOptions,
      fitToPage: pagination.fitToPage ?? false,
      fitToPageInactive: pagination.fitToPageInactive ?? false,
      fitPageSize: this.fitPageSize ?? pagination.fitPageSize,
      fitPageSizeLabel: pagination.fitPageSizeLabel ?? 'Fit to page',
      fitPageSizeTriggerLabel: pagination.fitPageSizeTriggerLabel ?? 'Fit',
      itemLabel: pagination.itemLabel ?? 'items',
      pageSizeLabel: pagination.pageSizeLabel ?? 'Items',
      ariaLabel: pagination.ariaLabel ?? `${this.caption} pagination`,
      previousPageIndex: state.pageIndex,
      previousPageSize: state.pageSize,
      previousPageSizeMode: state.pageSizeMode,
      reason: 'page',
    });
  }

  private currentLoadedRows(): TableRow[] {
    return tableRows(this.rows, this.groups, this.grouped);
  }

  private currentLoadedRowCount(): number {
    return this.grouped
      ? this.groups.reduce((count, group) => count + group.rows.length, 0)
      : this.rows.length;
  }

  private createRenderModel(): TableRenderModel {
    const columns = this.visibleColumns;
    const grouped = this.grouped;
    const virtualCounts = this.dataMode === 'virtual';
    const cached = this.renderModelCache;
    if (
      cached &&
      cached.columns === columns &&
      cached.rows === this.rows &&
      cached.groups === this.groups &&
      cached.grouped === grouped &&
      cached.selectionMode === this.selectionMode &&
      cached.selectedRowIds === this.selectedRowIds &&
      cached.collapsedGroupIds === this.collapsedGroupIds &&
      cached.virtualCounts === virtualCounts
    ) {
      return cached.value;
    }
    const value = createTableRenderModel({
      columns,
      rows: this.rows,
      groups: this.groups,
      grouped,
      selectionMode: this.selectionMode,
      selectedRowIds: this.selectedRowIds,
      collapsedGroupIds: this.collapsedGroupIds,
      groupCountPresentation: virtualCounts ? 'total' : 'loaded-progress',
    });
    this.renderModelCache = {
      columns,
      rows: this.rows,
      groups: this.groups,
      grouped,
      selectionMode: this.selectionMode,
      selectedRowIds: this.selectedRowIds,
      collapsedGroupIds: this.collapsedGroupIds,
      virtualCounts,
      value,
    };
    return value;
  }

  private get virtualizationEnabled(): boolean {
    return this.dataMode === 'virtual' && this.hasVirtualViewportBounds;
  }

  private get virtualViewportMissing(): boolean {
    return this.dataMode === 'virtual' && !this.hasVirtualViewportBounds;
  }

  private get hasVirtualViewportBounds(): boolean {
    return this.containedScroll && this.estimateVirtualViewportSize() > 0;
  }

  private estimateVirtualViewportSize(): number {
    const measured =
      this.virtualController.currentViewportSize() || this.viewportEl?.clientHeight || 0;
    const chrome =
      (this.captionVisibility === 'visible' ? 48 : 0) + (this.hasResultFooter ? 48 : 0);
    if (this.fixedHeight && this.resolvedHeight) {
      if (measured > 0) return measured;
      return Math.max(
        0,
        resolveCssLengthPx(this.resolvedHeight, 0, this.rootEl ?? this.el) - chrome
      );
    }
    if (this.fitViewport) return Math.max(0, measured);
    if (this.resolvedMaxHeight) {
      if (this.resolvedMaxHeight.trim().toLowerCase() === 'none') return 0;
      return resolveCssLengthPx(this.resolvedMaxHeight, 0, this.rootEl ?? this.el);
    }
    return 0;
  }

  private virtualPinnedRowIds(): Set<string> {
    const pinned = new Set<string>();
    if (this.focusedRowId) pinned.add(this.focusedRowId);
    if (this.actionMenu?.rowId) pinned.add(this.actionMenu.rowId);
    return pinned;
  }

  private syncVirtualItems(model: TableRenderModel): void {
    if (this.dataMode !== 'virtual') {
      this.virtualItems = [];
      this.virtualItemsCache = null;
      this.virtualRowPoolStates.clear();
      return;
    }
    const columns = this.visibleColumns;
    const cached = this.virtualItemsCache;
    if (
      cached &&
      cached.columns === columns &&
      cached.rows === this.rows &&
      cached.groups === this.groups &&
      cached.grouped === model.grouped &&
      cached.collapsedGroupIds === this.collapsedGroupIds
    ) {
      return;
    }
    this.virtualItems = flattenTableVirtualItems({
      grouped: model.grouped,
      rows: this.rows,
      groups: this.groups,
      collapsedGroupIds: this.collapsedGroupIds,
      columns,
    });
    this.virtualItemsCache = {
      columns,
      rows: this.rows,
      groups: this.groups,
      grouped: model.grouped,
      collapsedGroupIds: this.collapsedGroupIds,
    };
  }

  private shouldVirtualize(model: TableRenderModel): boolean {
    return (
      this.virtualizationEnabled && (model.hasData || (model.grouped && model.groups.length > 0))
    );
  }

  private get resolvedMaxHeight(): string | undefined {
    if (this.maxHeight == null || this.maxHeight === '') return undefined;
    return typeof this.maxHeight === 'number' ? `${Math.max(0, this.maxHeight)}px` : this.maxHeight;
  }

  private get resolvedHeight(): string | undefined {
    if (this.height == null || this.height === '') return undefined;
    return typeof this.height === 'number' ? `${Math.max(0, this.height)}px` : this.height;
  }

  private warnModelIssues(): void {
    const issues = tableModelIssues(this.columns, this.rows, this.groups, this.grouped);
    const visibleColumns = this.visibleColumns;
    if (!this.caption?.trim()) issues.unshift('A non-empty caption is required.');
    if (this.grouping) {
      const groupingColumn = this.columns.find(column => column.id === this.grouping!.columnId);
      if (!groupingColumn) {
        issues.push(`Grouping references unknown column id: ${this.grouping.columnId}`);
      } else if (!visibleColumns.some(column => column.id === groupingColumn.id)) {
        issues.push(`Grouping references hidden column id: ${this.grouping.columnId}`);
      }
    }
    if (this.sort) {
      const sortColumn = this.columns.find(
        column =>
          column.id === this.sort!.columnId ||
          column.headerSegments?.some(segment => segment.sortKey === this.sort!.columnId)
      );
      if (!sortColumn) {
        issues.push(`Sorting references unknown column id: ${this.sort.columnId}`);
      } else if (!visibleColumns.some(column => column.id === sortColumn.id)) {
        issues.push(`Sorting references hidden column id: ${this.sort.columnId}`);
      }
    }
    if (
      this.dataMode === 'virtual' &&
      Number.isFinite(this.totalCount) &&
      Math.max(0, Math.trunc(this.totalCount!)) !== this.currentLoadedRowCount()
    ) {
      issues.push('Virtual mode requires totalCount to match the complete supplied row count.');
    }
    const stickyStart = visibleColumns.filter(column => column.sticky === 'start');
    const stickyEnd = visibleColumns.filter(column => column.sticky === 'end');
    if (stickyStart.length > 1 || (this.selectable && stickyStart.length > 0)) {
      issues.push(
        'Only one sticky start column is supported, and row selection already owns that lane.'
      );
    }
    if (stickyEnd.length > 1) issues.push('Only one sticky end column is supported.');
    for (const column of [...stickyStart, ...stickyEnd]) {
      if (!tableColumnSize(column))
        issues.push(`Sticky column ${column.id} requires an explicit size.`);
    }
    const message = issues.join(' ');
    if (!message) {
      this.previousModelWarning = '';
      return;
    }
    if (message === this.previousModelWarning) return;
    this.previousModelWarning = message;
    console.warn(`[ds-table] ${message}`);
  }

  private scheduleModelIssueWarning(): void {
    if (this.modelWarningQueued) return;
    this.modelWarningQueued = true;
    queueMicrotask(() => {
      this.modelWarningQueued = false;
      this.warnModelIssues();
    });
  }

  private emitSort(column: TableColumn, sortKey = column.id): void {
    if (!column.sortable) return;
    this.dsSortChange.emit({ sort: nextTableSortState(this.sort, sortKey) });
  }

  private sortButtonLabel(column: TableColumn, sortKey = column.id, label = column.header): string {
    if (this.sort?.columnId !== sortKey) return `Sort ${label} ascending`;
    if (this.sort.direction === 'asc') return `Sort ${label} descending. Currently ascending.`;
    return `Sort ${label} ascending. Currently descending.`;
  }

  private emitRowSelection(row: TableRow): void {
    const next = toggleTableRowSelection(this.selectedRowIds, row);
    const selected = next.includes(row.id);
    this.dsSelectionChange.emit({
      selectedRowIds: next,
      scope: 'row',
      changedRowId: row.id,
      selected,
    });
  }

  private emitAllSelection(): void {
    const loadedRows = this.currentLoadedRows();
    const selection = deriveTableSelectionState(loadedRows, this.selectedRowIds);
    this.dsSelectionChange.emit({
      selectedRowIds: toggleAllLoadedTableRows(this.selectedRowIds, loadedRows),
      scope: 'all-loaded',
      selected: !selection.allSelected,
    });
  }

  private emitGroupSelection(group: TableGroup): void {
    const state = deriveTableSelectionState(group.rows, this.selectedRowIds);
    this.dsSelectionChange.emit({
      selectedRowIds: toggleTableGroupSelection(this.selectedRowIds, group.rows),
      scope: 'group',
      groupId: group.id,
      selected: !state.allSelected,
    });
  }

  private rowEventOwnsActivation(event: Event): boolean {
    const currentTarget = event.currentTarget;
    return !event.composedPath().some(target => {
      if (!(target instanceof HTMLElement) || target === currentTarget) return false;
      return target.matches(
        'button, a, input, select, textarea, [role="button"], [role="checkbox"], [popover], ds-button-unfilled, ds-menu'
      );
    });
  }

  private emitRowActivation(row: TableRow, event: Event): void {
    if (!row.interactive || row.disabled || !this.rowEventOwnsActivation(event)) return;
    this.dsRowActivate.emit({ rowId: row.id });
  }

  private syncActionMenu(): void {
    if (!this.actionMenu) return;
    const row = tableRows(this.rows, this.groups, this.grouped).find(
      candidate => candidate.id === this.actionMenu?.rowId
    );
    const value = row && !row.disabled ? row.cells[this.actionMenu.columnId] : undefined;
    if (!isTableCellAction(value) || !isRenderableTableActionMenu(value)) {
      this.actionMenu = null;
    }
  }

  private closeActionMenu(): void {
    this.actionMenu = null;
  }

  private handleActionMenuSelect(item: MenuItemData): void {
    const open = this.actionMenu;
    const actionId = item.value;
    if (!open || !actionId || item.isInactive) return;
    this.dsCellAction.emit({
      actionId,
      rowId: open.rowId,
      columnId: open.columnId,
    });
    const triggerId = tableActionTriggerId(this.actionMenuElementId, open.rowId, open.columnId);
    this.closeActionMenu();
    requestAnimationFrame(() => {
      const trigger = this.el.querySelector<HTMLElement & { setFocus?: () => void }>(
        `#${CSS.escape(triggerId)}`
      );
      trigger?.setFocus?.();
    });
  }

  private toggleActionMenu(row: TableRow, column: TableColumn, event: MouseEvent): void {
    if (row.disabled) return;
    const open = this.actionMenu?.rowId === row.id && this.actionMenu?.columnId === column.id;
    this.actionMenuInitialFocusVisible = event.detail === 0;
    this.actionMenu = open ? null : { rowId: row.id, columnId: column.id };
  }

  private renderOverflowActionMenu() {
    const open = this.actionMenu;
    const row = open
      ? tableRows(this.rows, this.groups, this.grouped).find(
          candidate => candidate.id === open.rowId
        )
      : undefined;
    const value = row && open ? row.cells[open.columnId] : undefined;
    const menu = isTableCellAction(value) && isRenderableTableActionMenu(value) ? value : undefined;
    const sections = menu ? tableActionMenuSections(menu.items) : [];
    const triggerId = open
      ? tableActionTriggerId(this.actionMenuElementId, open.rowId, open.columnId)
      : undefined;

    return (
      <ds-menu
        id={this.actionMenuElementId}
        open={Boolean(open && sections.length)}
        anchorId={triggerId}
        align="end"
        side="bottom"
        menuLabel={menu?.ariaLabel ?? 'More actions'}
        initialFocusVisible={this.actionMenuInitialFocusVisible}
        sections={sections}
        onDsClose={() => this.closeActionMenu()}
        onDsSelect={event => this.handleActionMenuSelect(event.detail)}
      />
    );
  }

  private connectTruncateTooltip(): void {
    if (this.truncateTooltipBound) return;
    this.el.addEventListener('pointerover', this.onTruncatePointerOver);
    this.el.addEventListener('pointerout', this.onTruncatePointerOut);
    this.el.addEventListener('focusin', this.onTruncateFocusIn);
    this.el.addEventListener('focusout', this.onTruncateFocusOut);
    this.truncateTooltipBound = true;
  }

  private disconnectTruncateTooltip(): void {
    if (!this.truncateTooltipBound) return;
    this.el.removeEventListener('pointerover', this.onTruncatePointerOver);
    this.el.removeEventListener('pointerout', this.onTruncatePointerOut);
    this.el.removeEventListener('focusin', this.onTruncateFocusIn);
    this.el.removeEventListener('focusout', this.onTruncateFocusOut);
    this.truncateTooltipBound = false;
    this.dismissTruncateTooltip();
  }

  private onTruncatePointerOver = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const track = resolveTableTruncateTrack(event.target);
    if (!track) return;
    this.presentOrDismissTruncateTrack(track);
  };

  private onTruncatePointerOut = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (resolveTableTruncateTrack(event.relatedTarget)) return;
    const next = event.relatedTarget;
    const cell = this.truncateAnchor?.closest('.ds-table__cell');
    if (cell && next instanceof Node && cell.contains(next)) return;
    this.dismissTruncateTooltip();
  };

  private onTruncateFocusIn = (event: FocusEvent) => {
    const track = resolveTableTruncateTrack(event.target);
    if (!track) {
      this.dismissTruncateTooltip();
      return;
    }
    this.presentOrDismissTruncateTrack(track);
  };

  private onTruncateFocusOut = (event: FocusEvent) => {
    if (resolveTableTruncateTrack(event.relatedTarget)) return;
    this.dismissTruncateTooltip();
  };

  private presentOrDismissTruncateTrack(track: HTMLElement): void {
    if (!isElementTruncated(track)) {
      this.dismissTruncateTooltip();
      return;
    }
    const label = tableTruncateLabel(track);
    if (!label) {
      this.dismissTruncateTooltip();
      return;
    }
    this.truncateAnchor = track;
    this.truncateTooltipLabel = label;
    void this.truncateTooltipEl?.presentFrom(track, label);
  }

  private dismissTruncateTooltip(): void {
    this.truncateAnchor = null;
    if (!this.truncateTooltipLabel && !this.truncateTooltipEl) return;
    this.truncateTooltipLabel = '';
    void this.truncateTooltipEl?.dismiss();
  }

  private renderTruncateTooltip() {
    return (
      <ds-tooltip
        ref={element => {
          this.truncateTooltipEl = element;
        }}
        label={this.truncateTooltipLabel}
        describedBy={false}
        wrapLabel={true}
        size="sm"
        delay={0}
        side="top"
      />
    );
  }

  private truncateAttr(lineClamp: TableCellLineClamp) {
    return lineClamp === 'none' ? undefined : '';
  }

  private handleRowKeydown(row: TableRow, event: KeyboardEvent): void {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' '))
      return;
    event.preventDefault();
    this.emitRowActivation(row, event);
  }

  private onVirtualFocusIn = (event: FocusEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const row = target.closest('[data-row-id]');
    const id = row?.getAttribute('data-row-id') ?? null;
    if (id === this.focusedRowId) return;
    this.focusedRowId = id;
    if (this.virtualizationEnabled) this.virtualController.schedule();
  };

  private renderSelectionControl(
    label: string,
    checked: boolean,
    indeterminate: boolean,
    disabled: boolean,
    onActivate: () => void
  ) {
    return (
      <button
        class="ds-table__selection-control ds-focus-ring ds-interaction-fill__content"
        type="button"
        role="checkbox"
        aria-label={label}
        aria-checked={indeterminate ? 'mixed' : String(checked)}
        disabled={disabled}
        onClick={onActivate}
      >
        <ds-checkbox
          label=""
          size="md"
          checked={checked}
          indeterminate={indeterminate}
          presentation={true}
        />
      </button>
    );
  }

  private renderStickyEdge(sticky: TableColumn['sticky']) {
    if (!sticky) return null;
    return (
      <span class={`ds-table__sticky-edge ds-table__sticky-edge--${sticky}`} aria-hidden="true" />
    );
  }

  private renderCollapseAllButton() {
    return (
      <ds-button-unfilled
        class="ds-table__collapse-all"
        variant="icon"
        icon="ChevronDownUp"
        size="xs"
        style={{ width: 'var(--dimension-size-300)' }}
        aria-label="Collapse all groups"
        hasBorder={false}
        activeFill={false}
        pressScale={false}
        onDsClick={event => {
          event.stopPropagation();
          this.emitAllGroupsCollapse();
        }}
      />
    );
  }

  private renderFloatingCollapseAll(model: TableRenderModel) {
    if (model.collapseAllHost?.mode !== 'floating') return null;
    return (
      <span
        class="ds-table__collapse-all-overlay"
        ref={element => {
          this.collapseAllOverlayEl = element ?? null;
        }}
      >
        <span class="ds-table__collapse-all-surface ds-control-elevation ds-control-elevation--md">
          {this.renderCollapseAllButton()}
        </span>
      </span>
    );
  }

  private renderColumnHeader(
    column: TableColumn,
    model: TableRenderModel,
    interactive = true,
    presentational = false
  ) {
    const groupedColumn = this.grouping?.columnId === column.id;
    const headerSegments = column.headerSegments?.length
      ? column.headerSegments
      : [{ label: column.header, sortKey: column.id }];
    const activeMemberSegment = headerSegments.find(
      segment => segment.sortKey === this.sort?.columnId
    );
    const activeMemberSort = !!activeMemberSegment;
    const activeSort = activeMemberSort;
    const align = column.align ?? 'start';
    const direction = activeMemberSort ? this.sort!.direction : undefined;
    const memberAriaSort = activeMemberSort
      ? this.sort!.direction === 'asc'
        ? 'ascending'
        : 'descending'
      : undefined;

    const help = column.help?.trim();
    const labels = (
      <span
        class="ds-table__header-labels"
        tabIndex={interactive && help && !column.sortable ? 0 : undefined}
        data-header-help={help ? '' : undefined}
      >
        {headerSegments.map((segment, index) => {
          const segmentActive = activeMemberSegment?.sortKey === segment.sortKey;
          const segmentInteractive = interactive && !!column.sortable;
          const label = (
            <ds-text
              class="ds-table__header-label-box ds-control-label-box"
              as="span"
              variant="text-caption"
              emphasis={segmentActive}
              color="inherit"
              decoration={help ? 'dotted-underline' : undefined}
              lineTruncation={1}
            >
              {segment.label}
            </ds-text>
          );
          const control = segmentInteractive ? (
            <button
              class="ds-table__header-label ds-table__header-label--interactive ds-focus-ring"
              type="button"
              aria-label={this.sortButtonLabel(column, segment.sortKey, segment.label)}
              data-sort-control="label"
              data-sort-key={segment.sortKey}
              data-sort-active={segmentActive ? 'true' : undefined}
              onClick={() => this.emitSort(column, segment.sortKey)}
            >
              {label}
            </button>
          ) : (
            <span class="ds-table__header-label ds-table__header-static">{label}</span>
          );

          return (
            <span class="ds-table__header-segment" key={segment.sortKey}>
              {control}
              {index < headerSegments.length - 1 && (
                <ds-text
                  class="ds-table__header-separator"
                  as="span"
                  variant="text-caption"
                  color="tertiary"
                  aria-hidden="true"
                >
                  {segment.separator ?? '/'}
                </ds-text>
              )}
            </span>
          );
        })}
      </span>
    );
    const labelControl =
      interactive && help ? (
        <ds-tooltip label={help} side="top" size="sm" wrapLabel={true}>
          {labels}
        </ds-tooltip>
      ) : (
        labels
      );
    const sortControl = interactive ? (
      <span class="ds-table__sort-slot">
        {activeSort && (
          <ds-button-unfilled
            class="ds-table__sort-direction"
            variant="icon"
            icon={direction === 'asc' ? 'ArrowUp' : 'ArrowDown'}
            size="xs"
            aria-label={this.sortButtonLabel(
              column,
              activeMemberSegment?.sortKey ?? column.id,
              activeMemberSegment?.label ?? column.header
            )}
            hasBorder={false}
            activeFill={false}
            isActive={true}
            pressScale={false}
            data-sort-control="direction"
            onDsClick={() => this.emitSort(column, activeMemberSegment?.sortKey ?? column.id)}
          />
        )}
      </span>
    ) : null;
    const collapseHost = model.collapseAllHost;
    const actionCollapseHost =
      collapseHost?.mode === 'action' && collapseHost.columnId === column.id;
    const blankActionCollapseHost =
      actionCollapseHost && !column.header.trim() && !column.headerSegments?.length;
    const collapseControl =
      interactive && actionCollapseHost ? (
        <span class="ds-table__collapse-slot">{this.renderCollapseAllButton()}</span>
      ) : null;

    return (
      <th
        key={column.id}
        class={{
          'ds-table__header-cell': true,
          [`ds-table__cell--align-${align}`]: true,
          'ds-table__cell--sticky-start': column.sticky === 'start',
          'ds-table__cell--sticky-end': column.sticky === 'end',
          'ds-table__header-cell--collapse-all': actionCollapseHost,
        }}
        scope={presentational ? undefined : 'col'}
        aria-sort={presentational ? undefined : memberAriaSort}
        data-column-id={column.id}
        data-grouped={groupedColumn ? 'true' : undefined}
        data-sort-active={activeSort ? 'true' : undefined}
      >
        {!column.header.trim() && column.headerLabel?.trim() && (
          <span class="ds-visually-hidden">{column.headerLabel}</span>
        )}
        {blankActionCollapseHost ? (
          <span class="ds-table__header-content ds-table__header-content--collapse-all">
            {collapseControl}
          </span>
        ) : (
          <span class="ds-table__header-content">
            {align === 'end' && sortControl}
            {align === 'center' && (
              <span
                class="ds-table__sort-slot ds-table__sort-slot--balance"
                data-sort-balance="true"
                aria-hidden="true"
              />
            )}
            {labelControl}
            {align !== 'end' && sortControl}
            {collapseControl}
          </span>
        )}
        {this.renderStickyEdge(column.sticky)}
      </th>
    );
  }

  private renderColgroup(model: TableRenderModel) {
    return (
      <colgroup>
        {model.selectable && <col class="ds-table__selection-column" />}
        {this.visibleColumns.map(column => {
          const width = tableColumnSize(column);
          const flexible = column.id === model.flexibleColumnId;
          return (
            <col
              key={column.id}
              class={{
                'ds-table__action-column': column.kind === 'action',
                'ds-table__flexible-column': flexible,
              }}
              style={width && !flexible ? { width } : undefined}
            />
          );
        })}
      </colgroup>
    );
  }

  private renderHeader(
    model: TableRenderModel,
    interactive = true,
    presentational = false,
    ariaRowIndex?: number
  ) {
    const selection = model.selection;
    return (
      <thead
        class={{
          'ds-table__head': true,
          'ds-table__head--semantic-copy': !interactive,
        }}
        ref={element => {
          if (interactive) this.interactiveHeadEl = element ?? null;
        }}
      >
        <tr class="ds-table__header-row" aria-rowindex={ariaRowIndex}>
          {model.selectable && (
            <th
              class="ds-table__header-cell ds-table__selection-cell ds-table__cell--sticky-start"
              scope={presentational ? undefined : 'col'}
            >
              {interactive ? (
                this.renderSelectionControl(
                  selection.allSelected ? 'Deselect all loaded rows' : 'Select all loaded rows',
                  selection.allSelected,
                  selection.indeterminate,
                  selection.selectableRowIds.length === 0,
                  () => this.emitAllSelection()
                )
              ) : (
                <span class="ds-visually-hidden">Select rows</span>
              )}
              {this.renderStickyEdge('start')}
            </th>
          )}
          {this.visibleColumns.map(column =>
            this.renderColumnHeader(column, model, interactive, presentational)
          )}
        </tr>
      </thead>
    );
  }

  private renderCellValue(cell: TableCellPresentation, column: TableColumn, row: TableRow) {
    if (cell.kind === 'blank') return null;

    if (cell.kind === 'empty') {
      return (
        <ds-text
          class="ds-table__cell-track ds-table__cell-track--text"
          as="span"
          variant="text-body-medium"
          color="tertiary"
        >
          <span aria-hidden="true">—</span>
          <span class="ds-visually-hidden">{this.emptyCellLabel}</span>
        </ds-text>
      );
    }

    if (cell.kind === 'icon') {
      const value = cell.value;
      return (
        <ds-icon
          name={value.icon}
          size="md"
          color={value.color ?? 'secondary'}
          label={value.label}
        />
      );
    }

    if (cell.kind === 'icon-text') {
      return (
        <span class="ds-table__cell-icon-text">
          <span class="ds-table__cell-icon-text-icon">
            <ds-icon
              name={cell.icon}
              size="md"
              color={cell.iconColor ?? 'secondary'}
              label={cell.iconLabel}
            />
          </span>
          {this.renderTextCopy(cell)}
        </span>
      );
    }

    if (cell.kind === 'image') {
      const value = cell.value;
      return (
        <span class="ds-table__cell-image">
          {value.src ? (
            <img
              class="ds-table__cell-image-content"
              src={value.src}
              alt={value.alt}
              loading="lazy"
            />
          ) : (
            <span class="ds-table__cell-image-placeholder" role="img" aria-label={value.alt} />
          )}
        </span>
      );
    }

    if (cell.kind === 'action') {
      const value = cell.value;
      const menu = isRenderableTableActionMenu(value);
      const triggerId = tableActionTriggerId(this.actionMenuElementId, row.id, column.id);
      const expanded =
        menu && this.actionMenu?.rowId === row.id && this.actionMenu?.columnId === column.id;
      return (
        <ds-button-unfilled
          id={menu ? triggerId : undefined}
          variant={menu ? 'icon' : (value.variant ?? 'label')}
          size="md"
          isInset={true}
          insetDepth="double"
          label={value.label ?? ''}
          icon={value.icon ?? (menu ? 'Ellipses' : '')}
          aria-label={value.ariaLabel ?? null}
          hasBorder={value.hasBorder ?? false}
          isInactive={value.isInactive ?? false}
          isLoading={value.isLoading ?? false}
          hasMenu={menu}
          expanded={menu ? expanded : undefined}
          controls={menu ? this.actionMenuElementId : undefined}
          onDsClick={event => {
            event.stopPropagation();
            if (menu) {
              this.toggleActionMenu(row, column, event.detail);
              return;
            }
            if (isTableCellActionMenu(value)) return;
            this.dsCellAction.emit({
              actionId: value.actionId,
              rowId: row.id,
              columnId: column.id,
            });
          }}
        />
      );
    }

    if (cell.kind === 'tag') {
      const value = cell.value;
      const variant = cell.variant;
      const tag = (
        <ds-tag
          label={value.label}
          intent={value.intent ?? 'neutral'}
          contrast={value.contrast ?? 'faint'}
          size={variant === 'text-with-tag' ? 'sm' : 'md'}
          icon={value.icon ?? ''}
          rounded={value.rounded ?? false}
          isInset
          insetDepth={variant === 'text-with-tag' ? 'single' : 'double'}
        />
      );

      if (variant === 'tag-only') return tag;

      return (
        <span class={`ds-table__cell-tag-stack ds-table__cell-tag-stack--${variant}`}>
          {variant === 'tag-with-text' && tag}
          <ds-text
            class="ds-table__cell-tag-text ds-table__cell-track"
            as="span"
            variant={variant === 'tag-with-text' ? 'text-body-small' : 'text-body-medium'}
            color="secondary"
            lineTruncation={1}
            data-table-truncate=""
          >
            {value.text}
          </ds-text>
          {variant === 'text-with-tag' && (
            <span class="ds-table__cell-tag-control-track">{tag}</span>
          )}
        </span>
      );
    }

    if (cell.kind !== 'text') return null;
    return this.renderTextCopy(cell);
  }

  private renderTextCopy(cell: Extract<TableCellPresentation, { kind: 'text' | 'icon-text' }>) {
    const text = cell.value;
    const wraps = cell.wraps;
    const overflow = tableCellTextOverflowProps(cell.lineClamp);
    const truncate = this.truncateAttr(cell.lineClamp);
    const primaryText = cell.kind === 'text' && cell.primaryText;
    const href = resolveSafeUrl(text.href);
    const primary = (
      <ds-text
        class="ds-table__cell-primary ds-table__cell-track ds-table__cell-track--text"
        as="span"
        variant="text-body-medium"
        color={href ? 'inherit' : 'primary'}
        lineTruncation={overflow.lineTruncation}
        wrap={overflow.wrap}
        fontFeature={text.fontFeature ?? 'normal'}
        data-table-truncate={truncate}
      >
        {text.primary}
      </ds-text>
    );

    return (
      <span class={{ 'ds-table__cell-copy': true, 'ds-table__cell-copy--wrap': wraps }}>
        {href ? (
          <a
            class="ds-table__cell-link ds-text-action ds-focus-ring"
            href={href}
            target={text.target === '_blank' ? '_blank' : undefined}
            rel={text.target === '_blank' ? 'noopener noreferrer' : undefined}
          >
            {primary}
          </a>
        ) : (
          primary
        )}
        {this.renderTextTrack(text.secondary, {
          track: 'secondary',
          variant: primaryText ? 'text-body-medium' : 'text-body-small',
          defaultColor: primaryText ? 'primary' : 'secondary',
          wholeColor: text.secondaryColor,
          lineClamp: cell.lineClamp,
        })}
        {this.renderTextTrack(text.tertiary, {
          track: 'tertiary',
          variant: 'text-body-small',
          defaultColor: 'secondary',
          wholeColor: text.tertiaryColor,
          lineClamp: cell.lineClamp,
        })}
      </span>
    );
  }

  private renderTextTrack(
    runs: TableCellTextRun[] | undefined,
    options: {
      track: 'secondary' | 'tertiary';
      variant: 'text-body-medium' | 'text-body-small';
      defaultColor: 'primary' | 'secondary';
      wholeColor?: TableCellTextRun['color'];
      lineClamp: TableCellLineClamp;
    }
  ) {
    if (!runs?.length) return null;
    const trackClass = `ds-table__cell-${options.track} ds-table__cell-track ds-table__cell-track--text`;
    const overflow = tableCellTextOverflowProps(options.lineClamp);
    const truncate = this.truncateAttr(options.lineClamp);
    const colorFor = (run: TableCellTextRun) =>
      run.color ?? options.wholeColor ?? options.defaultColor;
    if (runs.length === 1) {
      return (
        <ds-text
          class={trackClass}
          as="span"
          variant={options.variant}
          color={colorFor(runs[0])}
          lineTruncation={overflow.lineTruncation}
          wrap={overflow.wrap}
          data-table-truncate={truncate}
        >
          {runs[0].text}
        </ds-text>
      );
    }

    return (
      <span class={`${trackClass} ds-table__cell-track--runs`}>
        {runs.map((run, index) => [
          index > 0 && (
            <ds-text
              key={`${options.track}-sep-${index}`}
              class="ds-table__cell-run-separator"
              as="span"
              variant={options.variant}
              color="secondary"
              aria-hidden="true"
            >
              ·
            </ds-text>
          ),
          <ds-text
            key={`${options.track}-run-${index}`}
            class="ds-table__cell-run"
            as="span"
            variant={options.variant}
            color={colorFor(run)}
            lineTruncation={overflow.lineTruncation}
            wrap={overflow.wrap}
            data-table-truncate={truncate}
          >
            {run.text}
          </ds-text>,
        ])}
      </span>
    );
  }

  private renderRow(
    row: TableRow,
    model: TableRenderModel,
    ariaRowIndex?: number,
    variableVirtualSize = false,
    rowKey = row.id
  ) {
    const selected = model.selectedRowIds.has(row.id);
    const rowSelectable = row.selectable !== false && !row.disabled;
    return (
      <tr
        key={rowKey}
        class={{
          'ds-table__row': true,
          'ds-table__row--selected': selected,
          'ds-table__row--disabled': !!row.disabled,
          'ds-table__row--interactive': !!row.interactive && !row.disabled,
          'ds-focus-ring': !!row.interactive && !row.disabled,
        }}
        data-row-id={row.id}
        data-virtual-id={ariaRowIndex != null ? `row:${row.id}` : undefined}
        data-virtual-pool-key={ariaRowIndex != null ? rowKey : undefined}
        data-virtual-measure={ariaRowIndex != null && variableVirtualSize ? 'true' : undefined}
        data-selected={selected ? 'true' : undefined}
        aria-rowindex={ariaRowIndex}
        aria-disabled={row.disabled ? 'true' : undefined}
        tabIndex={row.interactive && !row.disabled ? 0 : undefined}
        onClick={event => this.emitRowActivation(row, event)}
        onKeyDown={event => this.handleRowKeydown(row, event)}
      >
        {model.selectable && (
          <td
            class={{
              'ds-table__cell': true,
              'ds-table__selection-cell': true,
              'ds-table__cell--sticky-start': true,
              'ds-interaction-fill': true,
              'ds-interaction-fill--grouped': true,
              'ds-interaction-fill--selected': selected,
            }}
          >
            {this.renderSelectionControl(
              `${selected ? 'Deselect' : 'Select'} ${tableRowSelectionLabel(row, this.visibleColumns)}`,
              selected,
              false,
              !rowSelectable,
              () => this.emitRowSelection(row)
            )}
            {this.renderStickyEdge('start')}
          </td>
        )}
        {this.visibleColumns.map(column => {
          const align = column.align ?? 'start';
          const cell = resolveTableCellPresentation(row.cells[column.id], column);
          const tagCell = cell.kind === 'tag';
          const iconCell = cell.kind === 'icon';
          const iconTextCell = cell.kind === 'icon-text';
          const imageCell = cell.kind === 'image';
          const actionCell = cell.kind === 'action';
          const actionMenuCell = actionCell && isRenderableTableActionMenu(cell.value);
          const textCell = cell.kind === 'text';
          const primaryTextCell = textCell && cell.primaryText;
          const singleTextCell = textCell && cell.singleLine;
          const emptyCell = cell.kind === 'empty';
          const blankCell = cell.kind === 'blank';
          const tagVariant = tagCell ? cell.variant : undefined;
          const textVariant = textCell ? cell.variant : undefined;
          const imageVariant = cell.kind === 'image' ? cell.variant : undefined;
          const iconTextVariant = iconTextCell ? cell.variant : undefined;
          const wraps = (cell.kind === 'text' || cell.kind === 'icon-text') && cell.wraps;
          return (
            <td
              key={`${row.id}:${column.id}`}
              class={{
                'ds-table__cell': true,
                [`ds-table__cell--align-${align}`]: true,
                'ds-table__cell--tag': tagCell,
                [`ds-table__cell--tag-${tagVariant}`]: tagCell,
                'ds-table__cell--icon': iconCell,
                'ds-table__cell--icon-text': iconTextCell,
                [`ds-table__cell--icon-text-${iconTextVariant}`]: iconTextCell,
                'ds-table__cell--icon-text-wrap': iconTextCell && wraps,
                'ds-table__cell--image': imageCell,
                [`ds-table__cell--image-${imageVariant}`]: imageCell,
                'ds-table__cell--action': actionCell,
                'ds-table__cell--action-menu': actionMenuCell,
                'ds-table__cell--primary-text': primaryTextCell,
                'ds-table__cell--text-single': singleTextCell,
                'ds-table__cell--text-multi':
                  textCell && !singleTextCell && textVariant !== 'triple',
                'ds-table__cell--text-triple': textVariant === 'triple',
                'ds-table__cell--text-wrap': textCell && wraps,
                'ds-table__cell--empty': emptyCell,
                'ds-table__cell--blank': blankCell,
                'ds-table__cell--sticky-start': column.sticky === 'start',
                'ds-table__cell--sticky-end': column.sticky === 'end',
                'ds-interaction-fill': true,
                'ds-interaction-fill--grouped': true,
                'ds-interaction-fill--selected': selected,
              }}
              data-column-id={column.id}
              data-cell-type={cell.cellType}
              data-cell-variant={tagVariant ?? textVariant ?? imageVariant ?? iconTextVariant}
            >
              <span class="ds-table__cell-content ds-interaction-fill__content">
                {this.renderCellValue(cell, column, row)}
              </span>
              {this.renderStickyEdge(column.sticky)}
            </td>
          );
        })}
      </tr>
    );
  }

  private emitGroupCollapse(group: TableGroup) {
    const collapsedGroupIds = toggleTableGroupCollapsed(this.collapsedGroupIds, group.id);
    this.dsGroupCollapseChange.emit({
      scope: 'group',
      groupId: group.id,
      collapsed: collapsedGroupIds.includes(group.id),
      collapsedGroupIds,
    });
  }

  private emitAllGroupsCollapse() {
    const groupIds = this.groups.map(group => group.id);
    const collapsedGroupIds = nextTableGroupsCollapsed(this.collapsedGroupIds, groupIds);
    this.dsGroupCollapseChange.emit({
      scope: 'all',
      collapsed: collapsedGroupIds.length > 0,
      collapsedGroupIds,
    });
  }

  private renderGroupContent(groupModel: TableRenderModel['groups'][number]) {
    const {
      group,
      countLabel,
      collapsed: isCollapsed,
      labelColor,
      selection: groupSelection,
    } = groupModel;
    return (
      <span class="ds-table__group-content">
        {groupSelection && (
          <span class="ds-table__group-selection">
            {this.renderSelectionControl(
              groupSelection.allSelected
                ? `Deselect loaded rows in ${group.label} group`
                : `Select loaded rows in ${group.label} group`,
              groupSelection.allSelected,
              groupSelection.indeterminate,
              groupSelection.selectableRowIds.length === 0,
              () => this.emitGroupSelection(group)
            )}
          </span>
        )}
        <span class="ds-table__group-copy">
          <ds-text
            class="ds-table__group-label"
            as="span"
            variant="text-body-medium"
            emphasis={true}
            color={labelColor}
          >
            {group.label}
          </ds-text>
          <ds-text
            class="ds-table__group-separator"
            as="span"
            variant="text-body-medium"
            color="secondary"
            aria-hidden="true"
          >
            ·
          </ds-text>
          <ds-text
            class="ds-table__group-count"
            as="span"
            variant="text-body-medium"
            color="secondary"
            aria-hidden="true"
          >
            {groupModel.visibleCountText}
          </ds-text>
          <span class="ds-visually-hidden">{countLabel}</span>
        </span>
        <ds-button-unfilled
          class="ds-table__group-toggle"
          variant="icon"
          size="md"
          isInset={true}
          insetDepth="double"
          icon={isCollapsed ? 'ChevronDown' : 'ChevronUp'}
          expanded={!isCollapsed}
          aria-label={isCollapsed ? `Expand ${group.label} group` : `Collapse ${group.label} group`}
          hasBorder={false}
          onDsClick={event => {
            event.stopPropagation();
            this.emitGroupCollapse(group);
          }}
        />
      </span>
    );
  }

  private formatGroupLoadLabel(template: string, group: TableGroup): string {
    return template.split('{group}').join(group.label);
  }

  private renderGroupLoadRow(group: TableGroup, totalColumns: number) {
    const error = group.loadMoreError?.trim();
    if (!error && !group.loadingMore && !group.hasMore) return null;
    const manualFallback =
      this.loadMoreMode === 'manual' || !this.groupLoadController.intersectionSupported;

    return (
      <tr
        class="ds-table__load-row ds-table__group-load-row"
        data-group-id={group.id}
        ref={element => {
          if (element) this.groupSentinelEls.set(group.id, element);
          else this.groupSentinelEls.delete(group.id);
        }}
      >
        <td class="ds-table__load-cell" colSpan={totalColumns}>
          <div class="ds-table__viewport-band ds-table__load-band">
            {error ? (
              <span class="ds-table__load-content ds-table__load-content--error">
                <span class="ds-table__load-copy">
                  <ds-icon name="ErrorTriangle" size="md" color="secondary" aria-hidden="true" />
                  <ds-text as="span" variant="text-body-medium" color="secondary">
                    {error}
                  </ds-text>
                </span>
                <ds-button-unfilled
                  label={this.formatGroupLoadLabel(this.groupRetryLabel, group)}
                  size="md"
                  onDsClick={() => this.groupLoadController.request(group.id, 'retry')}
                />
              </span>
            ) : group.loadingMore ? (
              <span class="ds-table__load-content">
                <ds-loader size="md" color="secondary" />
                <ds-text as="span" variant="text-body-medium" color="secondary">
                  {this.formatGroupLoadLabel(this.groupLoadingMoreLabel, group)}
                </ds-text>
              </span>
            ) : group.hasMore && manualFallback ? (
              <span class="ds-table__load-content">
                <ds-button-unfilled
                  label={this.groupLoadMoreLabel}
                  aria-label={this.formatGroupLoadLabel(this.groupLoadMoreAriaLabel, group)}
                  size="md"
                  onDsClick={() => this.groupLoadController.request(group.id, 'manual')}
                />
              </span>
            ) : (
              <span class="ds-table__auto-sentinel" aria-hidden="true" />
            )}
          </div>
        </td>
      </tr>
    );
  }

  private renderStickyGroup(model: TableRenderModel) {
    if (!this.documentStickyHeader || !this.activeStickyGroupId) return null;
    const groupModel = model.groups.find(item => item.group.id === this.activeStickyGroupId);
    if (!groupModel) return null;
    return (
      <div
        class={{
          'ds-table__sticky-group': true,
          'ds-table__sticky-group--selectable': model.selectable,
          [groupModel.intentClass ?? '']: !!groupModel.intentClass,
        }}
        data-group-id={groupModel.group.id}
        data-group-intent={groupModel.intent}
      >
        {this.renderGroupContent(groupModel)}
      </div>
    );
  }

  private renderVirtualSpacer(
    node: Extract<TableVirtualNode, { kind: 'spacer' }>,
    totalColumns: number
  ) {
    if (node.size <= 0) return null;
    return (
      <tr class="ds-table__virtual-spacer-row" key={node.key} aria-hidden="true">
        <td
          class="ds-table__virtual-spacer-cell"
          colSpan={totalColumns}
          style={
            { '--_table-virtual-spacer-block-size': `${node.size}px` } as Record<string, string>
          }
        />
      </tr>
    );
  }

  private renderVirtualRow(
    node: Extract<TableVirtualNode, { kind: 'row' }>,
    model: TableRenderModel,
    rowsById: Map<string, TableRow>,
    rowKey: string
  ) {
    const row = node.item.rowId ? rowsById.get(node.item.rowId) : undefined;
    if (!row) return null;
    return this.renderRow(row, model, node.index + 2, node.item.variableSize, rowKey);
  }

  private virtualRowPoolKeys(
    nodes: readonly TableVirtualNode[],
    scope: string
  ): Map<number, string> {
    const rows = nodes.filter(
      (node): node is Extract<TableVirtualNode, { kind: 'row' }> => node.kind === 'row'
    );
    const state = this.virtualRowPoolStates.get(scope) ?? {
      slotsByRowId: new Map<string, number>(),
      nextSlot: 0,
    };
    this.virtualRowPoolStates.set(scope, state);
    const desiredIds = new Set(rows.map(node => node.item.rowId ?? node.item.id));
    const freeSlots: number[] = [];
    for (const [rowId, slot] of state.slotsByRowId) {
      if (desiredIds.has(rowId)) continue;
      state.slotsByRowId.delete(rowId);
      freeSlots.push(slot);
    }
    freeSlots.sort((left, right) => left - right);

    const keys = new Map<number, string>();
    for (const node of rows) {
      const rowId = node.item.rowId ?? node.item.id;
      let slot = state.slotsByRowId.get(rowId);
      if (slot == null) {
        slot = freeSlots.shift() ?? state.nextSlot++;
        state.slotsByRowId.set(rowId, slot);
      }
      keys.set(node.index, `virtual-row-slot-${slot}`);
    }
    return keys;
  }

  private renderVirtualGroup(
    node: Extract<TableVirtualNode, { kind: 'group' }>,
    model: TableRenderModel,
    rowsById: Map<string, TableRow>,
    groupsById: Map<string, TableGroupRenderModel>
  ) {
    const groupModel = groupsById.get(node.groupId);
    if (!groupModel) return null;
    const { group, collapsed: isCollapsed, intent, intentClass } = groupModel;
    const rowKeys = this.virtualRowPoolKeys(node.nodes, `group:${group.id}`);
    return (
      <tbody
        class="ds-table__body ds-table__group"
        role="rowgroup"
        data-group-id={group.id}
        data-group-intent={intent}
        data-collapsed={isCollapsed ? 'true' : undefined}
        key={group.id}
      >
        <tr
          role="row"
          data-virtual-id={`group:${group.id}`}
          aria-rowindex={node.headerIndex + 2}
          class={{
            'ds-table__group-row': true,
            'ds-table__group-row--native-sticky': this.stickyHeader && !this.documentStickyHeader,
          }}
        >
          <th
            class={{
              'ds-table__group-cell': true,
              [intentClass ?? '']: !!intentClass,
            }}
            role="rowheader"
            scope="rowgroup"
            colSpan={model.totalColumns}
          >
            {this.renderGroupContent(groupModel)}
          </th>
        </tr>
        {node.nodes.map(child =>
          child.kind === 'spacer'
            ? this.renderVirtualSpacer(child, model.totalColumns)
            : this.renderVirtualRow(
                child,
                model,
                rowsById,
                rowKeys.get(child.index) ?? `virtual-row-${child.index}`
              )
        )}
      </tbody>
    );
  }

  private renderVirtualBodies(model: TableRenderModel, plan: TableVirtualPlan) {
    let lookup = this.virtualLookupCache;
    if (!lookup || lookup.rows !== model.loadedRows || lookup.groups !== model.groups) {
      lookup = {
        rows: model.loadedRows,
        groups: model.groups,
        rowsById: new Map(model.loadedRows.map(row => [row.id, row])),
        groupsById: new Map(model.groups.map(groupModel => [groupModel.group.id, groupModel])),
      };
      this.virtualLookupCache = lookup;
    }
    const { rowsById, groupsById } = lookup;
    if (!model.grouped) {
      for (const scope of this.virtualRowPoolStates.keys()) {
        if (scope !== 'flat') this.virtualRowPoolStates.delete(scope);
      }
      const rowKeys = this.virtualRowPoolKeys(plan.nodes, 'flat');
      return (
        <tbody class="ds-table__body">
          {plan.nodes.map(node =>
            node.kind === 'spacer'
              ? this.renderVirtualSpacer(node, model.totalColumns)
              : node.kind === 'row'
                ? this.renderVirtualRow(
                    node,
                    model,
                    rowsById,
                    rowKeys.get(node.index) ?? `virtual-row-${node.index}`
                  )
                : null
          )}
        </tbody>
      );
    }

    const activeGroupScopes = new Set(
      plan.nodes
        .filter(
          (node): node is Extract<TableVirtualNode, { kind: 'group' }> => node.kind === 'group'
        )
        .map(node => `group:${node.groupId}`)
    );
    for (const scope of this.virtualRowPoolStates.keys()) {
      if (!activeGroupScopes.has(scope)) this.virtualRowPoolStates.delete(scope);
    }
    return plan.nodes.map(node => {
      if (node.kind === 'spacer') {
        return (
          <tbody class="ds-table__body ds-table__virtual-pad" aria-hidden="true" key={node.key}>
            {this.renderVirtualSpacer(node, model.totalColumns)}
          </tbody>
        );
      }
      if (node.kind === 'group') {
        return this.renderVirtualGroup(node, model, rowsById, groupsById);
      }
      return null;
    });
  }

  private renderDataBodies(model: TableRenderModel, plan: TableVirtualPlan | null) {
    if (plan) return this.renderVirtualBodies(model, plan);

    if (!model.grouped) {
      return (
        <tbody class="ds-table__body">{this.rows.map(row => this.renderRow(row, model))}</tbody>
      );
    }

    return model.groups.map(groupModel => {
      const { group, collapsed: isCollapsed, intent, intentClass } = groupModel;
      const stickySourceHidden = this.documentStickyHeader && this.activeStickyGroupId === group.id;
      return (
        <tbody
          class="ds-table__body ds-table__group"
          role="rowgroup"
          data-group-id={group.id}
          data-group-intent={intent}
          data-collapsed={isCollapsed ? 'true' : undefined}
          aria-busy={!isCollapsed && group.loadingMore ? 'true' : undefined}
          key={group.id}
        >
          <tr
            role="row"
            aria-hidden={stickySourceHidden ? 'true' : undefined}
            class={{
              'ds-table__group-row': true,
              'ds-table__group-row--native-sticky': this.stickyHeader && !this.documentStickyHeader,
            }}
          >
            <th
              class={{
                'ds-table__group-cell': true,
                'ds-table__group-cell--sticky-source-hidden': stickySourceHidden,
                [intentClass ?? '']: !!intentClass,
              }}
              role="rowheader"
              scope="rowgroup"
              colSpan={model.totalColumns}
            >
              {this.renderGroupContent(groupModel)}
            </th>
          </tr>
          {!isCollapsed && group.rows.map(row => this.renderRow(row, model))}
          {!isCollapsed && this.renderGroupLoadRow(group, model.totalColumns)}
        </tbody>
      );
    });
  }

  private renderSkeletonBody(model: TableRenderModel) {
    const count = Math.min(20, Math.max(1, Math.round(this.skeletonRows) || 1));
    return (
      <tbody class="ds-table__body ds-table__skeleton-body">
        {Array.from({ length: count }, (_, index) => (
          <tr class="ds-table__row ds-table__skeleton-row" key={`skeleton-${index}`}>
            {model.selectable && (
              <td
                class="ds-table__cell ds-table__selection-cell ds-table__cell--sticky-start ds-table__skeleton-cell ds-interaction-fill ds-interaction-fill--grouped"
                data-skeleton-kind="checkbox"
              >
                <span class="ds-table__skeleton-checkbox-canvas ds-interaction-fill__content">
                  <ds-skeleton
                    class="ds-table__skeleton-checkbox"
                    variant="control"
                    controlSize="xs"
                    width="var(--dimension-iconography-sm)"
                  />
                </span>
                {this.renderStickyEdge('start')}
              </td>
            )}
            {this.visibleColumns.map(column => this.renderSkeletonCell(column, index))}
          </tr>
        ))}
      </tbody>
    );
  }

  private renderSkeletonCell(column: TableColumn, rowIndex: number) {
    const skeleton =
      column.skeleton ??
      ((column.kind === 'action'
        ? { kind: 'action', variant: 'icon' }
        : { kind: 'text', lines: 1 }) satisfies TableCellSkeleton);
    const align = column.align ?? 'start';
    const text = skeleton.kind === 'text';
    const iconText = skeleton.kind === 'icon-text';
    const lines = text || iconText ? (skeleton.lines ?? 1) : 1;
    const tag = skeleton.kind === 'tag';
    const icon = skeleton.kind === 'icon';
    const image = skeleton.kind === 'image';
    const imageVariant = image
      ? tableCellImageVariant(resolveTableCellImageTracks(skeleton.tracks))
      : undefined;
    const iconTextVariant = iconText
      ? lines === 3
        ? 'triple'
        : lines === 2
          ? 'multi'
          : 'single'
      : undefined;
    const action = skeleton.kind === 'action';
    const blank = skeleton.kind === 'blank';

    return (
      <td
        class={{
          'ds-table__cell': true,
          [`ds-table__cell--align-${align}`]: true,
          'ds-table__skeleton-cell': true,
          'ds-table__cell--text-single': text && lines === 1,
          'ds-table__cell--text-multi': text && lines === 2,
          'ds-table__cell--text-triple': text && lines === 3,
          'ds-table__cell--tag': tag,
          'ds-table__cell--tag-tag-only': tag,
          'ds-table__cell--icon': icon,
          'ds-table__cell--icon-text': iconText,
          [`ds-table__cell--icon-text-${iconTextVariant}`]: iconText,
          'ds-table__cell--image': image,
          [`ds-table__cell--image-${imageVariant}`]: image,
          'ds-table__cell--action': action,
          'ds-table__cell--blank': blank,
          'ds-table__cell--sticky-start': column.sticky === 'start',
          'ds-table__cell--sticky-end': column.sticky === 'end',
          'ds-interaction-fill': true,
          'ds-interaction-fill--grouped': true,
        }}
        data-column-id={column.id}
        data-skeleton-kind={skeleton.kind}
        data-cell-variant={imageVariant ?? iconTextVariant}
        key={`skeleton-${rowIndex}:${column.id}`}
      >
        <span class="ds-table__cell-content ds-interaction-fill__content">
          {this.renderSkeletonCellContent(skeleton)}
        </span>
        {this.renderStickyEdge(column.sticky)}
      </td>
    );
  }

  private renderSkeletonCellContent(skeleton: TableCellSkeleton) {
    if (skeleton.kind === 'blank') return null;

    if (skeleton.kind === 'image') {
      return (
        <span class="ds-table__cell-image ds-table__skeleton-image">
          <ds-skeleton
            class="ds-table__skeleton-image-shape"
            variant="control"
            controlSize="md"
            width="100%"
          />
        </span>
      );
    }

    if (skeleton.kind === 'icon') {
      return <ds-skeleton variant="icon" iconSize="md" rounded={skeleton.rounded ?? false} />;
    }

    if (skeleton.kind === 'tag') {
      return <ds-skeleton variant="control" controlSize="sm" width={skeleton.width ?? '64%'} />;
    }

    if (skeleton.kind === 'action') {
      const iconOnly = (skeleton.variant ?? 'icon') === 'icon';
      return (
        <ds-skeleton
          variant="control"
          controlSize="sm"
          width={skeleton.width ?? (iconOnly ? '24px' : '72%')}
        />
      );
    }

    const lines = skeleton.lines ?? 1;
    const copy = (
      <span class="ds-table__cell-copy">
        <span class="ds-table__cell-primary ds-table__cell-track ds-table__cell-track--text">
          <ds-skeleton
            variant="text"
            textVariant="text-body-medium"
            width={skeleton.primaryWidth ?? '100%'}
          />
        </span>
        {lines >= 2 && (
          <span class="ds-table__cell-secondary ds-table__cell-track ds-table__cell-track--text">
            <ds-skeleton
              variant="text"
              textVariant="text-body-small"
              width={skeleton.secondaryWidth ?? '72%'}
            />
          </span>
        )}
        {lines === 3 && (
          <span class="ds-table__cell-tertiary ds-table__cell-track ds-table__cell-track--text">
            <ds-skeleton
              variant="text"
              textVariant="text-body-small"
              width={skeleton.tertiaryWidth ?? '56%'}
            />
          </span>
        )}
      </span>
    );
    if (skeleton.kind === 'icon-text') {
      return (
        <span class="ds-table__cell-icon-text">
          <span class="ds-table__cell-icon-text-icon">
            <ds-skeleton variant="icon" iconSize="md" />
          </span>
          {copy}
        </span>
      );
    }
    return copy;
  }

  private renderStateBody(kind: 'empty' | 'error' | 'virtual-viewport', totalColumns: number) {
    const error = kind !== 'empty';
    const heading =
      kind === 'virtual-viewport'
        ? TABLE_VIRTUAL_VIEWPORT_REQUIRED_HEADING
        : error
          ? this.errorHeading
          : this.emptyHeading;
    const body =
      kind === 'virtual-viewport'
        ? TABLE_VIRTUAL_VIEWPORT_REQUIRED_BODY
        : error
          ? this.errorBody
          : this.emptyBody;
    return (
      <tbody class="ds-table__body ds-table__state-body">
        <tr class="ds-table__state-row">
          <td class="ds-table__state-cell" colSpan={totalColumns}>
            <div class="ds-table__viewport-band ds-table__state-band">
              <ds-empty-state
                icon={error ? 'ErrorTriangle' : 'Inbox'}
                heading={heading}
                body={body}
              />
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  private renderLazyBody(model: TableRenderModel) {
    if (
      this.dataMode !== 'infinite' ||
      !this.incrementalWindowActive ||
      !model.hasData ||
      model.grouped
    )
      return null;
    const error = this.loadMoreError?.trim();
    const manualFallback =
      this.loadMoreMode === 'manual' || !this.loadController.intersectionSupported;

    return (
      <tbody class="ds-table__body ds-table__load-body">
        <tr
          class="ds-table__load-row"
          ref={element => {
            this.sentinelEl = element ?? null;
          }}
        >
          <td class="ds-table__load-cell" colSpan={model.totalColumns}>
            <div class="ds-table__viewport-band ds-table__load-band">
              {error ? (
                <span class="ds-table__load-content ds-table__load-content--error">
                  <span class="ds-table__load-copy">
                    <ds-icon name="ErrorTriangle" size="md" color="secondary" aria-hidden="true" />
                    <ds-text as="span" variant="text-body-medium" color="secondary">
                      {error}
                    </ds-text>
                  </span>
                  <ds-button-unfilled
                    label={this.retryLabel}
                    size="md"
                    onDsClick={() => this.loadController.request('retry')}
                  />
                </span>
              ) : this.loadingMore ? (
                <span class="ds-table__load-content">
                  <ds-loader size="md" color="secondary" />
                  <ds-text as="span" variant="text-body-medium" color="secondary">
                    {this.loadingMoreLabel}
                  </ds-text>
                </span>
              ) : this.hasMore && manualFallback ? (
                <span class="ds-table__load-content">
                  <ds-button-unfilled
                    label={this.loadMoreLabel}
                    size="md"
                    onDsClick={() => this.loadController.request('manual')}
                  />
                </span>
              ) : this.hasMore ? (
                <span class="ds-table__auto-sentinel" aria-hidden="true" />
              ) : (
                <ds-text
                  class="ds-table__load-content"
                  as="span"
                  variant="text-body-medium"
                  color="secondary"
                >
                  {this.endOfResultsLabel}
                </ds-text>
              )}
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  private renderDocumentStickyHeader(model: TableRenderModel) {
    if (!this.documentStickyHeader) return null;
    return (
      <div class="ds-table__document-sticky-header">
        <table
          class={{
            'ds-table__table': true,
            'ds-table__sticky-header-table': true,
            'ds-table__table--selectable': model.selectable,
            'ds-table__table--grouped': model.grouped,
          }}
          style={model.tableStyle}
          role="presentation"
          ref={element => {
            this.stickyHeaderTableEl = element ?? null;
          }}
        >
          {this.renderColgroup(model)}
          {this.renderHeader(model, true, true)}
        </table>
        {this.renderFloatingCollapseAll(model)}
      </div>
    );
  }

  private get resultSummary(): string | null {
    if (this.dataMode === 'pagination') return null;
    if (this.dataMode === 'virtual') {
      return formatTableTotalSummary(this.currentLoadedRowCount(), this.resultTotalSummaryLabel);
    }
    return formatTableResultSummary(this.displayedCount, this.totalCount, this.resultSummaryLabel);
  }

  private get hasResultFooter(): boolean {
    return (
      (this.dataMode === 'pagination' && !!this.pagination) ||
      !!this.resultSummary ||
      this.footerSlotPresence !== 0
    );
  }

  private renderResultFooter() {
    const summary = this.resultSummary;
    const hasLeading = (this.footerSlotPresence & TABLE_FOOTER_SLOT_LEADING) !== 0;
    const hasCopy = (this.footerSlotPresence & TABLE_FOOTER_SLOT_COPY) !== 0;
    const hasTrailing = (this.footerSlotPresence & TABLE_FOOTER_SLOT_TRAILING) !== 0;
    const pagination = this.dataMode === 'pagination' ? this.pagination : null;
    if (!this.hasResultFooter) return null;
    return (
      <div class="ds-table__footer ds-table__bar ds-chrome-header ds-control--md">
        <div class="ds-table__bar-copy ds-chrome-header__copy ds-control--md">
          {hasLeading && (
            <div class="ds-table__bar-status ds-chrome-header__heading">
              <slot name="footer-leading" onSlotchange={this.syncFooterSlotPresence} />
            </div>
          )}
          {hasCopy ? (
            <slot name="footer" onSlotchange={this.syncFooterSlotPresence} />
          ) : summary ? (
            <ds-text
              class="ds-table__footer-summary ds-table__bar-text"
              as="span"
              variant="text-body-medium"
              color="secondary"
              lineTruncation={1}
            >
              {summary}
            </ds-text>
          ) : null}
        </div>
        {(pagination || hasTrailing) && (
          <div class="ds-table__bar-trailing ds-chrome-header__trailing">
            {pagination && (
              <ds-pagination
                pageIndex={pagination.pageIndex}
                pageSize={pagination.pageSize}
                pageSizeMode={pagination.pageSizeMode ?? 'fixed'}
                totalItems={pagination.totalItems}
                pageSizeOptions={pagination.pageSizeOptions ?? [25, 50, 100, 200]}
                fitToPage={pagination.fitToPage ?? false}
                {...{ fitToPageInactive: pagination.fitToPageInactive ?? false }}
                fitPageSize={this.fitPageSize ?? pagination.fitPageSize}
                fitPageSizeLabel={pagination.fitPageSizeLabel ?? 'Fit to page'}
                fitPageSizeTriggerLabel={pagination.fitPageSizeTriggerLabel ?? 'Fit'}
                itemLabel={pagination.itemLabel ?? 'items'}
                pageSizeLabel={pagination.pageSizeLabel ?? 'Items'}
                label={pagination.ariaLabel ?? `${this.caption} pagination`}
                loading={this.loading}
                onDsChange={(event: CustomEvent<PaginationChangeDetail>) =>
                  this.dsPaginationChange.emit(event.detail)
                }
              />
            )}
            <slot name="footer-trailing" onSlotchange={this.syncFooterSlotPresence} />
          </div>
        )}
      </div>
    );
  }

  private renderCaptionBar() {
    if (this.captionVisibility !== 'visible') return null;
    return (
      <div class="ds-table__caption-bar ds-table__bar ds-control--md">
        <div
          class={{
            'ds-table__caption-content': true,
            'ds-table__caption-content--trailing': this.showsCaptionTrailing,
          }}
        >
          <div
            class={{
              'ds-table__caption-leading': true,
              'ds-table__caption-leading--toolbar': this.headerUsesToolbar,
            }}
          >
            <slot name="header" onSlotchange={this.syncHeaderSlotPresence} />
            {!this.headerPresent ? (
              <ds-text
                class="ds-table__caption-title ds-table__bar-text"
                as="div"
                variant="text-title-small"
                emphasis={true}
                color="primary"
                aria-hidden="true"
              >
                {this.caption}
              </ds-text>
            ) : null}
          </div>
          {this.renderCaptionTrailing()}
        </div>
      </div>
    );
  }

  private renderCaptionTrailing() {
    if (!this.showsCaptionTrailing) return null;
    return (
      <div class="ds-table__caption-trailing">
        {this.renderColumnCustomizerTrigger()}
        {this.showsColumnCustomizer && this.showsDataModeSwitcher ? (
          <ds-divider orientation="vertical" length="32px" />
        ) : null}
        {this.renderDataModeSwitcherTrigger()}
      </div>
    );
  }

  private renderDataModeSwitcherTrigger() {
    if (!this.showsDataModeSwitcher) return null;
    if (this.chromeLoading) {
      return <ds-skeleton variant="control" controlSize="md" width="var(--dimension-size-400)" />;
    }
    return (
      <ds-button-unfilled
        id={`${this.dataModeSwitcherElementId}-trigger`}
        variant="icon"
        size="md"
        icon="Ellipses"
        aria-label={this.dataModeSwitcherLabel}
        hasMenu={true}
        expanded={this.dataModeSwitcherOpen}
        controls={this.dataModeSwitcherElementId}
        activeFill={false}
        pressScale={false}
        onDsClick={(event: CustomEvent<MouseEvent>) => {
          this.toggleDataModeSwitcher(event.detail.detail === 0);
        }}
      />
    );
  }

  private renderDataModeSwitcherMenu() {
    if (!this.showsDataModeSwitcher || this.chromeLoading) return null;
    return (
      <ds-menu
        id={this.dataModeSwitcherElementId}
        open={this.dataModeSwitcherOpen}
        anchorId={`${this.dataModeSwitcherElementId}-trigger`}
        align="end"
        side="bottom"
        menuLabel={this.dataModeMenuLabel}
        initialFocusVisible={this.dataModeSwitcherInitialFocusVisible}
        items={tableDataModeMenuItems(this.dataMode, {
          infinite: this.infiniteModeLabel,
          pagination: this.paginationModeLabel,
          virtual: this.virtualModeLabel,
        })}
        onDsClose={() => this.closeDataModeSwitcher()}
        onDsSelect={event => this.handleDataModeSwitcherSelect(event.detail)}
      />
    );
  }

  private toggleDataModeSwitcher(fromKeyboard = false): void {
    if (this.dataModeSwitcherOpen) this.closeDataModeSwitcher();
    else this.openDataModeSwitcher(fromKeyboard);
  }

  private openDataModeSwitcher(fromKeyboard = false): void {
    if (!this.showsDataModeSwitcher || this.dataModeSwitcherOpen) return;
    this.closeColumnCustomizer();
    this.dataModeSwitcherInitialFocusVisible = fromKeyboard;
    this.dataModeSwitcherOpen = true;
  }

  private closeDataModeSwitcher(): void {
    this.dataModeSwitcherOpen = false;
  }

  private handleDataModeSwitcherSelect(item: MenuItemData): void {
    const dataMode = tableDataModeFromMenuItem(item);
    if (!dataMode) return;
    this.closeDataModeSwitcher();
    if (dataMode !== this.dataMode) this.dsDataModeChange.emit({ dataMode });
    requestAnimationFrame(() => {
      this.el
        .querySelector<HTMLElement & { setFocus?: () => void }>(
          `#${CSS.escape(`${this.dataModeSwitcherElementId}-trigger`)}`
        )
        ?.setFocus?.();
    });
  }

  private renderColumnCustomizerTrigger() {
    if (!this.showsColumnCustomizer) return null;
    return (
      <div
        class={{
          'ds-table__caption-customizer': true,
          'ds-table__caption-customizer--loading': this.chromeLoading,
        }}
        aria-hidden={this.chromeLoading ? 'true' : undefined}
      >
        <ds-button-unfilled
          id={`${this.columnCustomizerElementId}-trigger`}
          variant={this.captionCompact ? 'icon' : 'icon-label'}
          size="md"
          icon="Table"
          label="Customize"
          labelEmphasis={false}
          pressScale={false}
          aria-label="Customize table"
          hasMenu={true}
          expanded={this.columnCustomizerOpen}
          controls={this.columnCustomizerElementId}
          onDsClick={(event: CustomEvent<MouseEvent>) => {
            if (this.chromeLoading) return;
            this.toggleColumnCustomizer(event.detail.detail === 0);
          }}
        />
        {this.chromeLoading ? (
          <ds-skeleton variant="control" controlSize="md" width="100%" />
        ) : null}
      </div>
    );
  }

  private renderColumnCustomizerMenu() {
    if (!this.showsColumnCustomizer || this.chromeLoading) return null;
    return (
      <ds-menu
        id={this.columnCustomizerElementId}
        open={this.columnCustomizerOpen}
        anchorId={`${this.columnCustomizerElementId}-trigger`}
        align="end"
        side="bottom"
        menuLabel="Customize table"
        initialFocusVisible={this.columnCustomizerInitialFocusVisible}
        items={tableColumnCustomizerMenuItems(this.columns, this.hiddenColumnIds, this.columnOrder)}
        onDsClose={() => this.closeColumnCustomizer()}
        onDsSelect={event => this.handleColumnCustomizerSelect(event.detail)}
        onDsReorder={event => this.handleColumnCustomizerReorder(event.detail)}
      />
    );
  }

  private toggleColumnCustomizer(fromKeyboard = false): void {
    if (this.columnCustomizerOpen) this.closeColumnCustomizer();
    else this.openColumnCustomizer(fromKeyboard);
  }

  private openColumnCustomizer(fromKeyboard = false): void {
    if (!this.showsColumnCustomizer || this.columnCustomizerOpen) return;
    this.closeDataModeSwitcher();
    this.columnCustomizerInitialFocusVisible = fromKeyboard;
    this.columnCustomizerOpen = true;
  }

  private closeColumnCustomizer(): void {
    this.columnCustomizerOpen = false;
  }

  private emitColumnsConfigChange(hiddenColumnIds: string[], columnOrder: string[]): void {
    this.dsColumnsConfigChange.emit({
      hiddenColumnIds: resolveTableHiddenColumnIds(this.columns, hiddenColumnIds),
      columnOrder: resolveTableColumnOrder(this.columns, columnOrder),
    });
  }

  private handleColumnCustomizerReorder(detail: MenuReorderDetail): void {
    const order = detail.items
      .filter(item => item.reorderable)
      .map(item => item.value)
      .filter((id): id is string => !!id);
    this.emitColumnsConfigChange(this.hiddenColumnIds, order);
  }

  private handleColumnCustomizerSelect(item: MenuItemData): void {
    const columnId = item.value;
    if (!columnId || item.isInactive) return;
    this.emitColumnsConfigChange(
      toggleTableColumnHidden(this.columns, this.hiddenColumnIds, columnId),
      resolveTableColumnOrder(this.columns, this.columnOrder)
    );
  }

  render() {
    this.groupSentinelEls.clear();
    const model = this.createRenderModel();
    this.syncVirtualItems(model);
    this.renderedModel = model;
    const regionLabel = this.scrollLabel?.trim() || `${this.caption} scroll area`;
    const initialLoading = this.loading && !model.hasData;
    const initialError = !model.hasData && this.error;
    const hasGroupedStructure = model.grouped && model.groups.length > 0;
    const virtualize = this.shouldVirtualize(model);
    const virtualViewportMissing =
      this.virtualViewportMissing && !initialLoading && (model.hasData || hasGroupedStructure);
    const virtualPlan = virtualize
      ? (this.virtualWindow ??
        resolveTableVirtualPlan({
          items: this.virtualItems,
          sizes: this.virtualItems.map(item => this.virtualController.sizeFor(item)),
          scrollOffset: this.viewportEl?.scrollTop ?? 0,
          viewportSize: this.estimateVirtualViewportSize(),
          pinnedRowIds: this.virtualPinnedRowIds(),
        }))
      : null;
    const groupLoadingMore = hasGroupedStructure && this.groups.some(group => group.loadingMore);
    const viewportStyle =
      !this.boundedComposition && this.resolvedMaxHeight
        ? { '--ds-table-max-block-size': this.resolvedMaxHeight }
        : undefined;
    const hostStyle = this.fixedHeight
      ? { '--_table-fixed-block-size': this.resolvedHeight }
      : undefined;

    return (
      <Host
        class={{
          'table-host': true,
          'table-host--bounded': this.boundedComposition,
          'table-host--fixed-height': this.fixedHeight,
          'table-host--viewport-fit': this.fitViewport,
        }}
        style={hostStyle}
        onKeyDown={(event: KeyboardEvent) => this.handlePaginationKeyDown(event)}
        onFocusin={this.onVirtualFocusIn}
      >
        <div
          class={{
            'ds-table': true,
            'ds-table--bounded': this.boundedComposition,
            'ds-table--contained-scroll': this.containedScroll,
            'ds-table--fixed-height': this.fixedHeight,
            'ds-table--viewport-fit': this.fitViewport,
            'ds-table--viewport-fit-pending': this.fitViewport && !this.viewportFitSettled,
            'ds-table--viewport-fit-settled': this.fitViewport && this.viewportFitSettled,
            'ds-table--sticky-header': this.stickyHeader,
            'ds-table--document-sticky-header': this.documentStickyHeader,
            'ds-table--contained-sticky-header': this.stickyHeader && !this.documentStickyHeader,
            'ds-table--caption-visible': this.captionVisibility === 'visible',
            'ds-table--footer-visible': this.hasResultFooter,
            'ds-table--state-fill':
              !initialLoading &&
              (initialError || virtualViewportMissing || !(model.hasData || hasGroupedStructure)),
          }}
          ref={element => {
            this.rootEl = element ?? null;
          }}
        >
          {this.renderCaptionBar()}
          <div
            class={{
              'ds-table__frame': true,
              'ds-table__frame--overflow-start': this.overflowStart,
              'ds-table__frame--overflow-end': this.overflowEnd,
            }}
            ref={element => {
              this.frameEl = element ?? null;
            }}
          >
            {this.renderDocumentStickyHeader(model)}
            {this.renderStickyGroup(model)}
            {!this.documentStickyHeader && this.renderFloatingCollapseAll(model)}
            <div
              class={{
                'ds-table__viewport': true,
                'ds-focus-ring': this.scrollable,
              }}
              style={viewportStyle}
              ref={element => {
                this.viewportEl = element ?? null;
              }}
              role={this.scrollable ? 'region' : undefined}
              aria-label={this.scrollable ? regionLabel : undefined}
              tabIndex={this.scrollable ? 0 : undefined}
            >
              <table
                class={{
                  'ds-table__table': true,
                  'ds-table__table--selectable': model.selectable,
                  'ds-table__table--grouped': model.grouped,
                  'ds-table__table--virtual': virtualize,
                  'ds-table__table--native-group-sticky':
                    (model.grouped && this.stickyHeader && !this.documentStickyHeader) ||
                    virtualize,
                }}
                style={model.tableStyle}
                aria-rowcount={virtualize ? 1 + this.virtualItems.length : undefined}
                aria-busy={
                  initialLoading ||
                  (this.dataMode === 'infinite' && (this.loadingMore || groupLoadingMore))
                    ? 'true'
                    : undefined
                }
                ref={element => {
                  this.tableEl = element ?? null;
                }}
              >
                <caption class="ds-table__caption ds-visually-hidden">
                  <ds-text as="span" variant="text-title-small" emphasis={true} color="primary">
                    {this.caption}
                  </ds-text>
                </caption>
                {this.renderColgroup(model)}
                {this.renderHeader(
                  model,
                  !this.documentStickyHeader,
                  false,
                  virtualize ? 1 : undefined
                )}
                {initialLoading
                  ? this.renderSkeletonBody(model)
                  : initialError
                    ? this.renderStateBody('error', model.totalColumns)
                    : virtualViewportMissing
                      ? this.renderStateBody('virtual-viewport', model.totalColumns)
                      : model.hasData || hasGroupedStructure
                        ? this.renderDataBodies(model, virtualPlan)
                        : this.renderStateBody('empty', model.totalColumns)}
                {!initialLoading &&
                  !initialError &&
                  this.dataMode !== 'virtual' &&
                  this.renderLazyBody(model)}
              </table>
            </div>
          </div>
          {this.renderResultFooter()}
          {this.renderOverflowActionMenu()}
          {this.renderDataModeSwitcherMenu()}
          {this.renderColumnCustomizerMenu()}
          {this.renderTruncateTooltip()}
          <div class="ds-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {this.announcement}
          </div>
        </div>
      </Host>
    );
  }
}

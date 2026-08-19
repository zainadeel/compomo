import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import {
  deriveTableSelectionState,
  formatTableResultSummary,
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
  type TableCellPresentation,
} from './table-cell-model';
import {
  createTableRenderModel,
  type TableRenderModel,
} from './table-render-model';
import { TableLayoutController } from './table-layout-controller';
import { TableLoadController } from './table-load-controller';
import { TableGroupLoadController } from './table-group-load-controller';
import type { PaginationChangeDetail } from '../Pagination/pagination-types';
import { resolvePaginationState } from '../Pagination/pagination-model';
import { resolveCssLengthPx } from '../../utils/resolve-css-length-px';
import { resolveSafeUrl } from '../../utils/safe-url';
import { resolveTableFitPageSize } from './table-pagination-fit';
import {
  TableViewportFitController,
  type TableViewportFitMetrics,
} from './table-viewport-fit-controller';
import type {
  TableCaptionVisibility,
  TableCellActionDetail,
  TableCellSkeleton,
  TableCellTextRun,
  TableColumn,
  TableDataMode,
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

@Component({
  tag: 'ds-table',
  styleUrls: [
    '../../utils/focus-ring.css',
    '../../utils/interaction-fill.css',
    'Table.css',
  ],
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
   * Optional result summary footer. When both `displayedCount` and `totalCount`
   * are finite numbers, the table shows “Displaying {displayed} of {total}”.
   */
  @Prop() displayedCount: number | undefined;
  @Prop() totalCount: number | undefined;
  /** Supports {displayed} and {total} placeholders. */
  @Prop() resultSummaryLabel: string = 'Displaying {displayed} of {total}';
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
  /** Initial-loading rows. Defaults to ten so bounded tables retain a useful filled viewport. */
  @Prop() skeletonRows: number = 10;
  @Prop() emptyHeading: string = 'No results';
  @Prop() emptyBody: string = 'No data is available.';
  /** Initial error state. Existing rows stay visible; incremental failures use loadMoreError. */
  @Prop() error: boolean = false;
  @Prop() errorHeading: string = 'Unable to load data';
  @Prop() errorBody: string = 'The data could not be loaded.';
  @Prop() emptyCellLabel: string = 'Not available';

  /** Top-level data-window strategy. Group member loading remains group-owned. */
  @Prop() dataMode: TableDataMode = 'infinite';
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
  @Prop() groupRowsLoadedLabel: string = '{count} more rows loaded in {group}. {loaded} of {total} rows loaded.';

  @Event() dsSortChange!: EventEmitter<TableSortChangeDetail>;
  @Event() dsGroupCollapseChange!: EventEmitter<TableGroupCollapseChangeDetail>;
  @Event() dsSelectionChange!: EventEmitter<TableSelectionChangeDetail>;
  @Event() dsLoadMore!: EventEmitter<TableLoadMoreDetail>;
  @Event() dsGroupLoadMore!: EventEmitter<TableGroupLoadMoreDetail>;
  @Event() dsPaginationChange!: EventEmitter<PaginationChangeDetail>;
  @Event() dsCellAction!: EventEmitter<TableCellActionDetail>;
  @Event() dsRowActivate!: EventEmitter<TableRowActivateDetail>;

  @State() private overflowStart = false;
  @State() private overflowEnd = false;
  @State() private scrollable = false;
  @State() private announcement = '';
  @State() private activeStickyGroupId: string | null = null;
  @State() private viewportFitSettled = false;
  @State() private headerPresent = false;
  @State() private fitPageSize: number | undefined;

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
  private hasLoaded = false;
  private renderedModel: TableRenderModel | null = null;
  private stickyGroupConnected = false;
  private headerSlotObserver: MutationObserver | null = null;
  private fitResizeObserver: ResizeObserver | null = null;
  private fitObservedViewport: HTMLElement | null = null;
  private fitObservedTable: HTMLTableElement | null = null;
  private fitMeasurementPending = false;
  private readonly layoutController = new TableLayoutController({
    elements: () => ({
      viewport: this.viewportEl,
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
      enabled: this.grouped,
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
    this.incrementalWindowActive = this.hasIncrementalState;
    this.syncHeaderSlotPresence();
    this.loadController.initialize();
    this.groupLoadController.initialize();
    this.warnModelIssues();
  }

  componentDidLoad(): void {
    this.hasLoaded = true;
    this.layoutController.connect();
    this.loadController.connect();
    this.groupLoadController.connect();
    this.viewportFitController.connect();
    this.syncStickyGroupConnection();
    this.connectHeaderSlotObserver();
    this.connectFitObserver();
    this.syncFitPageSize();
  }

  componentDidRender(): void {
    this.layoutController.refresh();
    this.loadController.refresh();
    this.groupLoadController.refresh();
    this.viewportFitController.refresh();
    this.syncStickyGroupConnection();
    this.connectFitObserver();
    this.syncFitPageSize();
    if (this.stickyGroupConnected) this.updateStickyGroup();
  }

  connectedCallback(): void {
    if (!this.hasLoaded) return;
    this.layoutController.connect();
    this.loadController.connect();
    this.groupLoadController.connect();
    this.viewportFitController.connect();
    this.syncStickyGroupConnection();
    this.connectHeaderSlotObserver();
    this.connectFitObserver();
  }

  disconnectedCallback(): void {
    this.layoutController.disconnect();
    this.loadController.disconnect();
    this.groupLoadController.disconnect();
    this.viewportFitController.disconnect();
    this.disconnectStickyGroup();
    this.headerSlotObserver?.disconnect();
    this.headerSlotObserver = null;
    this.disconnectFitObserver();
  }

  private syncHeaderSlotPresence = () => {
    this.headerPresent = !!this.el.querySelector('[slot="header"]');
  };

  private connectHeaderSlotObserver(): void {
    if (this.headerSlotObserver || typeof MutationObserver === 'undefined') return;
    this.headerSlotObserver = new MutationObserver(this.syncHeaderSlotPresence);
    this.headerSlotObserver.observe(this.el, { childList: true });
    this.syncHeaderSlotPresence();
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
      '.ds-table__document-sticky-header',
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
      `${activeGroupTop - frameRect.top}px`,
    );

    if (activeGroupId !== this.activeStickyGroupId) {
      this.activeStickyGroupId = activeGroupId;
      return;
    }
  };

  @Watch('columns')
  @Watch('grouping')
  handleStructureChange(): void {
    this.warnModelIssues();
    this.loadController.structureChanged();
    this.groupLoadController.structureChanged();
  }

  @Watch('rows')
  @Watch('groups')
  handleDataChange(): void {
    if (this.grouped) this.groupLoadController.dataChanged();
    else this.loadController.dataChanged();
    this.warnModelIssues();
  }

  @Watch('loadIdentity')
  handleLoadIdentityChange(): void {
    this.incrementalWindowActive = this.hasIncrementalState;
    this.loadController.identityChanged();
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
    this.handleLazyConfigurationChange();
  }

  @Watch('pagination')
  handlePaginationChange(
    pagination: TablePaginationState | null,
    previous: TablePaginationState | null,
  ): void {
    if (
      pagination?.pageSizeMode === 'fit' &&
      pagination.fitIdentity !== previous?.fitIdentity
    ) {
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

  private get grouped(): boolean {
    return this.grouping !== null;
  }

  private get hasIncrementalState(): boolean {
    return this.dataMode === 'infinite' &&
      (this.hasMore || this.loadingMore || !!this.loadMoreError?.trim());
  }

  private get selectable(): boolean {
    return this.selectionMode === 'multiple';
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

  private readonly syncFitPageSize = (): void => {
    const pagination = this.dataMode === 'pagination' ? this.pagination : null;
    if (!pagination?.fitToPage || !this.containedScroll || !this.viewportEl || !this.tableEl) {
      if (this.fitPageSize !== undefined) this.fitPageSize = undefined;
      this.fitMeasurementPending = false;
      return;
    }
    const header = this.tableEl.querySelector<HTMLElement>(
      '.ds-table__head .ds-table__header-row',
    );
    const item = this.tableEl.querySelector<HTMLElement>(
      this.grouped ? '.ds-table__group-row' : '.ds-table__body .ds-table__row',
    );
    const itemBlockSize = item?.getBoundingClientRect().height || resolveCssLengthPx(
      'var(--ds-table-row-min-block-size, var(--dimension-size-500))',
      0,
      this.rootEl ?? this.el,
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

  private handlePaginationKeyDown(event: KeyboardEvent): void {
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

    const fromDirectionalControl = event.composedPath().some(node => {
      if (!(node instanceof HTMLElement)) return false;
      return node.tagName === 'DS-SELECT' ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName) ||
        node.isContentEditable ||
        node.getAttribute('role') === 'slider';
    });
    if (fromDirectionalControl) return;

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
    return createTableRenderModel({
      columns: this.columns,
      rows: this.rows,
      groups: this.groups,
      grouped: this.grouped,
      selectionMode: this.selectionMode,
      selectedRowIds: this.selectedRowIds,
      collapsedGroupIds: this.collapsedGroupIds,
    });
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
    if (!this.caption?.trim()) issues.unshift('A non-empty caption is required.');
    if (this.grouping && !this.columns.some(column => column.id === this.grouping!.columnId)) {
      issues.push(`Grouping references unknown column id: ${this.grouping.columnId}`);
    }
    if (
      this.sort &&
      !this.columns.some(column =>
        column.id === this.sort!.columnId ||
        column.headerSegments?.some(segment => segment.sortKey === this.sort!.columnId),
      )
    ) {
      issues.push(`Sorting references unknown column id: ${this.sort.columnId}`);
    }
    const stickyStart = this.columns.filter(column => column.sticky === 'start');
    const stickyEnd = this.columns.filter(column => column.sticky === 'end');
    if (stickyStart.length > 1 || (this.selectable && stickyStart.length > 0)) {
      issues.push('Only one sticky start column is supported, and row selection already owns that lane.');
    }
    if (stickyEnd.length > 1) issues.push('Only one sticky end column is supported.');
    for (const column of [...stickyStart, ...stickyEnd]) {
      if (!tableColumnSize(column)) issues.push(`Sticky column ${column.id} requires an explicit size.`);
    }
    const message = issues.join(' ');
    if (!message || message === this.previousModelWarning) return;
    this.previousModelWarning = message;
    console.warn(`[ds-table] ${message}`);
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
        'button, a, input, select, textarea, [role="button"], [role="checkbox"], ds-button-unfilled',
      );
    });
  }

  private emitRowActivation(row: TableRow, event: Event): void {
    if (!row.interactive || row.disabled || !this.rowEventOwnsActivation(event)) return;
    this.dsRowActivate.emit({ rowId: row.id });
  }

  private handleRowKeydown(row: TableRow, event: KeyboardEvent): void {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    this.emitRowActivation(row, event);
  }

  private renderSelectionControl(
    label: string,
    checked: boolean,
    indeterminate: boolean,
    disabled: boolean,
    onActivate: () => void,
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
      <span
        class={`ds-table__sticky-edge ds-table__sticky-edge--${sticky}`}
        aria-hidden="true"
      />
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
    presentational = false,
  ) {
    const groupedColumn = this.grouping?.columnId === column.id;
    const headerSegments = column.headerSegments?.length
      ? column.headerSegments
      : [{ label: column.header, sortKey: column.id }];
    const activeMemberSegment = headerSegments.find(
      segment => segment.sortKey === this.sort?.columnId,
    );
    const activeMemberSort = !!activeMemberSegment;
    const activeSort = activeMemberSort;
    const align = column.align ?? 'start';
    const direction = activeMemberSort ? this.sort!.direction : undefined;
    const memberAriaSort = activeMemberSort
      ? (this.sort!.direction === 'asc' ? 'ascending' : 'descending')
      : undefined;

    const labelControl = (
      <span class="ds-table__header-labels">
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
              activeMemberSegment?.label ?? column.header,
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
    const actionCollapseHost = collapseHost?.mode === 'action' && collapseHost.columnId === column.id;
    const blankActionCollapseHost = actionCollapseHost &&
      !column.header.trim() &&
      !column.headerSegments?.length;
    const collapseControl =
      interactive && actionCollapseHost ? (
        <span class="ds-table__collapse-slot">
          {this.renderCollapseAllButton()}
        </span>
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
        {this.columns.map(column => {
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
  ) {
    const selection = model.selection;
    return (
      <thead class={{
        'ds-table__head': true,
        'ds-table__head--semantic-copy': !interactive,
      }} ref={element => {
        if (interactive) this.interactiveHeadEl = element ?? null;
      }}>
        <tr class="ds-table__header-row">
          {model.selectable && (
            <th
              class="ds-table__header-cell ds-table__selection-cell ds-table__cell--sticky-start"
              scope={presentational ? undefined : 'col'}
            >
              {interactive ? this.renderSelectionControl(
                selection.allSelected ? 'Deselect all loaded rows' : 'Select all loaded rows',
                selection.allSelected,
                selection.indeterminate,
                selection.selectableRowIds.length === 0,
                () => this.emitAllSelection(),
              ) : (
                <span class="ds-visually-hidden">Select rows</span>
              )}
              {this.renderStickyEdge('start')}
            </th>
          )}
          {this.columns.map(column => (
            this.renderColumnHeader(column, model, interactive, presentational)
          ))}
        </tr>
      </thead>
    );
  }

  private renderCellValue(
    cell: TableCellPresentation,
    column: TableColumn,
    row: TableRow,
  ) {
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

    if (cell.kind === 'image') {
      const value = cell.value;
      return (
        <span class="ds-table__cell-image">
          {value.src ? (
            <img class="ds-table__cell-image-content" src={value.src} alt={value.alt} loading="lazy" />
          ) : (
            <span
              class="ds-table__cell-image-placeholder"
              role="img"
              aria-label={value.alt}
            />
          )}
        </span>
      );
    }

    if (cell.kind === 'action') {
      const value = cell.value;
      return (
        <ds-button-unfilled
          variant={value.variant ?? 'label'}
          size="md"
          isInset={true}
          insetDepth="double"
          label={value.label ?? ''}
          icon={value.icon ?? ''}
          aria-label={value.ariaLabel ?? null}
          hasBorder={value.hasBorder ?? false}
          isInactive={value.isInactive ?? false}
          isLoading={value.isLoading ?? false}
          onDsClick={event => {
            event.stopPropagation();
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
          >
            {value.text}
          </ds-text>
          {variant === 'text-with-tag' && (
            <span class="ds-table__cell-tag-control-track">{tag}</span>
          )}
        </span>
      );
    }

    const text = cell.value;
    const wraps = cell.wraps;
    const href = resolveSafeUrl(text.href);
    const primary = (
      <ds-text
        class="ds-table__cell-primary ds-table__cell-track ds-table__cell-track--text"
        as="span"
        variant="text-body-medium"
        color={href ? 'inherit' : 'primary'}
        lineTruncation={wraps ? 'none' : 1}
        wrap={wraps ? 'wrap' : 'nowrap'}
        fontFeature={text.fontFeature ?? 'normal'}
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
        ) : primary}
        {this.renderTextTrack(text.secondary, {
          track: 'secondary',
          variant: cell.primaryText ? 'text-body-medium' : 'text-body-small',
          defaultColor: cell.primaryText ? 'primary' : 'secondary',
          wholeColor: text.secondaryColor,
          wraps,
        })}
        {this.renderTextTrack(text.tertiary, {
          track: 'tertiary',
          variant: 'text-body-small',
          defaultColor: 'secondary',
          wholeColor: text.tertiaryColor,
          wraps,
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
      wraps: boolean;
    },
  ) {
    if (!runs?.length) return null;
    const trackClass = `ds-table__cell-${options.track} ds-table__cell-track ds-table__cell-track--text`;
    const colorFor = (run: TableCellTextRun) =>
      run.color ?? options.wholeColor ?? options.defaultColor;
    if (runs.length === 1) {
      return (
        <ds-text
          class={trackClass}
          as="span"
          variant={options.variant}
          color={colorFor(runs[0])}
          lineTruncation={options.wraps ? 'none' : 1}
          wrap={options.wraps ? 'wrap' : 'nowrap'}
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
            lineTruncation={options.wraps ? 'none' : 1}
            wrap={options.wraps ? 'wrap' : 'nowrap'}
          >
            {run.text}
          </ds-text>,
        ])}
      </span>
    );
  }

  private renderRow(row: TableRow, model: TableRenderModel) {
    const selected = model.selectedRowIds.has(row.id);
    const rowSelectable = row.selectable !== false && !row.disabled;
    return (
      <tr
        key={row.id}
        class={{
          'ds-table__row': true,
          'ds-table__row--selected': selected,
          'ds-table__row--disabled': !!row.disabled,
          'ds-table__row--interactive': !!row.interactive && !row.disabled,
          'ds-focus-ring': !!row.interactive && !row.disabled,
        }}
        data-row-id={row.id}
        data-selected={selected ? 'true' : undefined}
        aria-disabled={row.disabled ? 'true' : undefined}
        tabIndex={row.interactive && !row.disabled ? 0 : undefined}
        onClick={event => this.emitRowActivation(row, event)}
        onKeyDown={event => this.handleRowKeydown(row, event)}
      >
        {model.selectable && (
          <td class={{
            'ds-table__cell': true,
            'ds-table__selection-cell': true,
            'ds-table__cell--sticky-start': true,
            'ds-interaction-fill': true,
            'ds-interaction-fill--grouped': true,
            'ds-interaction-fill--selected': selected,
          }}>
            {this.renderSelectionControl(
              `${selected ? 'Deselect' : 'Select'} ${tableRowSelectionLabel(row, this.columns)}`,
              selected,
              false,
              !rowSelectable,
              () => this.emitRowSelection(row),
            )}
            {this.renderStickyEdge('start')}
          </td>
        )}
        {this.columns.map(column => {
          const align = column.align ?? 'start';
          const cell = resolveTableCellPresentation(row.cells[column.id], column);
          const tagCell = cell.kind === 'tag';
          const iconCell = cell.kind === 'icon';
          const imageCell = cell.kind === 'image';
          const actionCell = cell.kind === 'action';
          const textCell = cell.kind === 'text';
          const primaryTextCell = textCell && cell.primaryText;
          const singleTextCell = textCell && cell.singleLine;
          const emptyCell = cell.kind === 'empty';
          const blankCell = cell.kind === 'blank';
          const tagVariant = tagCell ? cell.variant : undefined;
          const textVariant = textCell ? cell.variant : undefined;
          const imageVariant = cell.kind === 'image' ? cell.variant : undefined;
          return (
            <td
              key={`${row.id}:${column.id}`}
              class={{
                'ds-table__cell': true,
                [`ds-table__cell--align-${align}`]: true,
                'ds-table__cell--tag': tagCell,
                [`ds-table__cell--tag-${tagVariant}`]: tagCell,
                'ds-table__cell--icon': iconCell,
                'ds-table__cell--image': imageCell,
                [`ds-table__cell--image-${imageVariant}`]: imageCell,
                'ds-table__cell--action': actionCell,
                'ds-table__cell--primary-text': primaryTextCell,
                'ds-table__cell--text-single': singleTextCell,
                'ds-table__cell--text-multi': textCell && !singleTextCell && textVariant !== 'triple',
                'ds-table__cell--text-triple': textVariant === 'triple',
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
              data-cell-variant={tagVariant ?? textVariant ?? imageVariant}
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
      count,
      loadedCount,
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
              () => this.emitGroupSelection(group),
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
            {loadedCount} of {count}
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
          aria-label={
            isCollapsed
              ? `Expand ${group.label} group`
              : `Collapse ${group.label} group`
          }
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
    const manualFallback = this.loadMoreMode === 'manual' ||
      !this.groupLoadController.intersectionSupported;

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
                  <ds-text as="span" variant="text-body-medium" color="secondary">{error}</ds-text>
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

  private renderDataBodies(model: TableRenderModel) {
    if (!model.grouped) {
      return (
        <tbody class="ds-table__body">
          {this.rows.map(row => this.renderRow(row, model))}
        </tbody>
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
            {this.columns.map(column => this.renderSkeletonCell(column, index))}
          </tr>
        ))}
      </tbody>
    );
  }

  private renderSkeletonCell(column: TableColumn, rowIndex: number) {
    const skeleton = column.skeleton ?? (
      column.kind === 'action'
        ? { kind: 'action', variant: 'icon' }
        : { kind: 'text', lines: 1 }
    ) satisfies TableCellSkeleton;
    const align = column.align ?? 'start';
    const text = skeleton.kind === 'text';
    const lines = text ? skeleton.lines ?? 1 : 1;
    const tag = skeleton.kind === 'tag';
    const icon = skeleton.kind === 'icon';
    const image = skeleton.kind === 'image';
    const imageVariant = image
      ? tableCellImageVariant(resolveTableCellImageTracks(skeleton.tracks))
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
        data-cell-variant={imageVariant}
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
      return (
        <ds-skeleton
          variant="control"
          controlSize="sm"
          width={skeleton.width ?? '64%'}
        />
      );
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
    return (
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
  }

  private renderStateBody(kind: 'empty' | 'error', totalColumns: number) {
    const error = kind === 'error';
    return (
      <tbody class="ds-table__body ds-table__state-body">
        <tr class="ds-table__state-row">
          <td class="ds-table__state-cell" colSpan={totalColumns}>
            <div class="ds-table__viewport-band ds-table__state-band">
              <ds-empty-state
                icon={error ? 'ErrorTriangle' : 'Inbox'}
                heading={error ? this.errorHeading : this.emptyHeading}
                body={error ? this.errorBody : this.emptyBody}
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
    ) return null;
    const error = this.loadMoreError?.trim();
    const manualFallback = this.loadMoreMode === 'manual' ||
      !this.loadController.intersectionSupported;

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
                    <ds-text as="span" variant="text-body-medium" color="secondary">{error}</ds-text>
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
      <div
        class="ds-table__document-sticky-header"
      >
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
    return formatTableResultSummary(
      this.displayedCount,
      this.totalCount,
      this.resultSummaryLabel,
    );
  }

  private get hasResultFooter(): boolean {
    return (this.dataMode === 'pagination' && !!this.pagination) ||
      !!this.resultSummary || !!this.el.querySelector(
      '[slot="footer-leading"], [slot="footer"], [slot="footer-trailing"]',
    );
  }

  private renderResultFooter() {
    const summary = this.resultSummary;
    const hasLeading = !!this.el.querySelector('[slot="footer-leading"]');
    const hasCopy = !!this.el.querySelector('[slot="footer"]');
    const hasTrailing = !!this.el.querySelector('[slot="footer-trailing"]');
    const pagination = this.dataMode === 'pagination' ? this.pagination : null;
    if (!this.hasResultFooter) return null;
    return (
      <div class="ds-table__footer ds-table__bar ds-chrome-header ds-control--md">
        <div class="ds-table__bar-copy ds-chrome-header__copy ds-control--md">
          {hasLeading && (
            <div class="ds-table__bar-status ds-chrome-header__heading">
              <slot name="footer-leading" />
            </div>
          )}
          {hasCopy ? (
            <slot name="footer" />
          ) : summary ? (
            <ds-text
              class="ds-table__footer-summary ds-table__bar-text"
              as="span"
              variant="text-body-medium"
              color="secondary"
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
                fitPageSize={this.fitPageSize ?? pagination.fitPageSize}
                fitPageSizeLabel={pagination.fitPageSizeLabel ?? 'Fit to page'}
                fitPageSizeTriggerLabel={pagination.fitPageSizeTriggerLabel ?? 'Fit'}
                itemLabel={pagination.itemLabel ?? 'items'}
                pageSizeLabel={pagination.pageSizeLabel ?? 'Items'}
                label={pagination.ariaLabel ?? `${this.caption} pagination`}
                loading={this.loading}
                onDsChange={(event: CustomEvent<PaginationChangeDetail>) =>
                  this.dsPaginationChange.emit(event.detail)}
              />
            )}
            <slot name="footer-trailing" />
          </div>
        )}
      </div>
    );
  }

  private renderCaptionBar() {
    if (this.captionVisibility !== 'visible') return null;
    return (
      <div class="ds-table__caption-bar ds-table__bar ds-control--md">
        <div class="ds-table__caption-content">
          <slot
            name="header"
            onSlotchange={this.syncHeaderSlotPresence}
          />
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
      </div>
    );
  }

  render() {
    this.groupSentinelEls.clear();
    const model = this.createRenderModel();
    this.renderedModel = model;
    const regionLabel = this.scrollLabel?.trim() || `${this.caption} scroll area`;
    const initialLoading = this.loading && !model.hasData;
    const initialError = !model.hasData && this.error;
    const hasGroupedStructure = model.grouped && model.groups.length > 0;
    const groupLoadingMore = hasGroupedStructure && this.groups.some(group => group.loadingMore);
    const viewportStyle = !this.boundedComposition && this.resolvedMaxHeight
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
      >
        <div class={{
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
        }} ref={element => {
          this.rootEl = element ?? null;
        }}>
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
                  'ds-table__table--native-group-sticky': model.grouped &&
                    this.stickyHeader && !this.documentStickyHeader,
                }}
                style={model.tableStyle}
                aria-busy={initialLoading || this.loadingMore || groupLoadingMore ? 'true' : undefined}
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
                {this.renderHeader(model, !this.documentStickyHeader)}
                {initialLoading
                  ? this.renderSkeletonBody(model)
                  : initialError
                    ? this.renderStateBody('error', model.totalColumns)
                    : model.hasData || hasGroupedStructure
                      ? this.renderDataBodies(model)
                      : this.renderStateBody('empty', model.totalColumns)}
                {!initialLoading && !initialError && this.renderLazyBody(model)}
              </table>
            </div>
          </div>
          {this.renderResultFooter()}
          <div class="ds-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {this.announcement}
          </div>
        </div>
      </Host>
    );
  }
}

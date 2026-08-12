import {
  Component,
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
  isTableCellAction,
  isTableCellBlank,
  isTableCellEmpty,
  isTableCellIcon,
  isTableCellImage,
  isTableCellPrimaryText,
  isTableCellText,
  isTableCellTag,
  nextTableGroupOrder,
  nextTableSortState,
  resolvedTableGroupCount,
  tableCollapseAllHost,
  tableColumnSize,
  tableExplicitMinWidth,
  tableFlexibleColumnId,
  tableGroupIntentClass,
  tableGroupLabelColor,
  tableModelIssues,
  tableRows,
  tableRowSelectionLabel,
  toggleAllLoadedTableRows,
  toggleTableGroupCollapsed,
  toggleTableGroupSelection,
  nextTableGroupsCollapsed,
  toggleTableRowSelection,
} from './table-model';
import type {
  TableCaptionVisibility,
  TableCellActionDetail,
  TableCellValue,
  TableColumn,
  TableGroup,
  TableGroupCollapseChangeDetail,
  TableGroupingChangeDetail,
  TableGroupingState,
  TableLoadMoreDetail,
  TableLoadMoreMode,
  TableLoadMoreReason,
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
    '../../utils/interaction-fill.css',
    'Table.css',
  ],
  scoped: true,
})
export class Table {
  /** Stable column definitions. Assign through JavaScript. */
  @Prop() columns: TableColumn[] = [];
  /** Ungrouped row data. Ignored while grouping is active. Assign through JavaScript. */
  @Prop() rows: TableRow[] = [];
  /** One level of application-owned grouped data. Assign through JavaScript. */
  @Prop() groups: TableGroup[] = [];
  /** Controlled grouping column and group-order direction. */
  @Prop() grouping: TableGroupingState | null = null;
  /** Controlled member-row sort state. */
  @Prop() sort: TableSortState | null = null;
  /** Controlled collapsed group identities. Groups not listed remain expanded. */
  @Prop() collapsedGroupIds: string[] = [];

  /** Required accessible table name, rendered as a native caption. */
  @Prop() caption!: string;
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
  /** Optional explicit label for the horizontal/vertical scroll region. */
  @Prop() scrollLabel: string | undefined;

  @Prop() selectionMode: TableSelectionMode = 'none';
  /** Controlled selected row identities. IDs outside the loaded rows are preserved. */
  @Prop() selectedRowIds: string[] = [];

  /** Initial loading state. Existing rows stay visible; incremental loading uses loadingMore. */
  @Prop() loading: boolean = false;
  @Prop() skeletonRows: number = 5;
  @Prop() emptyHeading: string = 'No results';
  @Prop() emptyBody: string = 'No data is available.';
  /** Initial error state. Existing rows stay visible; incremental failures use loadMoreError. */
  @Prop() error: boolean = false;
  @Prop() errorHeading: string = 'Unable to load data';
  @Prop() errorBody: string = 'The data could not be loaded.';
  @Prop() emptyCellLabel: string = 'Not available';

  /** Enable application-owned incremental loading without pagination. */
  @Prop() lazyLoading: boolean = false;
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
  @Prop() loadingMoreLabel: string = 'Loading more results';
  @Prop() endOfResultsLabel: string = 'All results loaded';
  /** Supports {count} and {total} placeholders. */
  @Prop() rowsLoadedLabel: string = '{count} more rows loaded. {total} rows loaded.';

  @Event() dsSortChange!: EventEmitter<TableSortChangeDetail>;
  @Event() dsGroupingChange!: EventEmitter<TableGroupingChangeDetail>;
  @Event() dsGroupCollapseChange!: EventEmitter<TableGroupCollapseChangeDetail>;
  @Event() dsSelectionChange!: EventEmitter<TableSelectionChangeDetail>;
  @Event() dsLoadMore!: EventEmitter<TableLoadMoreDetail>;
  @Event() dsCellAction!: EventEmitter<TableCellActionDetail>;
  @Event() dsRowActivate!: EventEmitter<TableRowActivateDetail>;

  @State() private overflowStart = false;
  @State() private overflowEnd = false;
  @State() private scrollable = false;
  @State() private intersectionSupported = true;
  @State() private announcement = '';

  private viewportEl: HTMLElement | null = null;
  private stickyHeaderTableEl: HTMLTableElement | null = null;
  private tableEl: HTMLTableElement | null = null;
  private sentinelEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private observedSentinel: HTMLElement | null = null;
  private requestPending = false;
  private requestedRowCount = 0;
  private previousLoadedRowCount = 0;
  private previousModelWarning = '';
  private hasLoaded = false;
  private reconnectFrame: number | null = null;
  private overflowSyncFrame: number | null = null;

  componentWillLoad(): void {
    this.previousLoadedRowCount = this.loadedRows.length;
    this.intersectionSupported = typeof IntersectionObserver !== 'undefined';
    this.warnModelIssues();
  }

  componentDidLoad(): void {
    this.hasLoaded = true;
    this.connectViewportObserver();
    this.syncOverflow();
    this.connectIntersectionObserver();
  }

  componentDidRender(): void {
    this.syncStickyHeaderPosition();
    this.connectIntersectionObserver();
  }

  connectedCallback(): void {
    if (!this.hasLoaded) return;
    if (this.reconnectFrame !== null) cancelAnimationFrame(this.reconnectFrame);
    this.reconnectFrame = requestAnimationFrame(() => {
      this.reconnectFrame = null;
      this.connectViewportObserver();
      this.syncOverflow();
      this.connectIntersectionObserver();
    });
  }

  disconnectedCallback(): void {
    if (this.reconnectFrame !== null) cancelAnimationFrame(this.reconnectFrame);
    this.reconnectFrame = null;
    if (this.overflowSyncFrame !== null) cancelAnimationFrame(this.overflowSyncFrame);
    this.overflowSyncFrame = null;
    this.viewportEl?.removeEventListener('scroll', this.syncOverflow);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.disconnectIntersectionObserver();
  }

  @Watch('columns')
  @Watch('grouping')
  handleStructureChange(): void {
    this.warnModelIssues();
    this.resetLoadRequest();
  }

  @Watch('rows')
  @Watch('groups')
  handleDataChange(): void {
    const nextCount = this.loadedRows.length;
    if (nextCount > this.previousLoadedRowCount) {
      const added = nextCount - this.previousLoadedRowCount;
      this.announcement = this.rowsLoadedLabel
        .replace('{count}', String(added))
        .replace('{total}', String(nextCount));
    }
    if (nextCount > this.requestedRowCount) this.requestPending = false;
    this.previousLoadedRowCount = nextCount;
    this.warnModelIssues();
    this.disconnectIntersectionObserver();
  }

  @Watch('loadIdentity')
  handleLoadIdentityChange(): void {
    this.previousLoadedRowCount = this.loadedRows.length;
    this.resetLoadRequest();
  }

  @Watch('lazyLoading')
  @Watch('loadMoreMode')
  @Watch('loadMoreThreshold')
  handleLazyConfigurationChange(): void {
    this.disconnectIntersectionObserver();
  }

  @Watch('loadingMore')
  handleLoadingMoreChange(loading: boolean): void {
    if (loading) {
      this.requestPending = true;
      this.announcement = this.loadingMoreLabel;
    } else if (this.loadMoreMode === 'manual') {
      // A completed manual request may legitimately append no rows. Permit a
      // deliberate follow-up activation; automatic mode stays guarded until
      // the data shape or query identity changes.
      this.requestPending = false;
    }
    this.disconnectIntersectionObserver();
  }

  @Watch('loadMoreError')
  handleLoadMoreErrorChange(error: string | undefined): void {
    if (error?.trim()) {
      this.requestPending = false;
      this.announcement = error;
    }
    this.disconnectIntersectionObserver();
  }

  @Watch('hasMore')
  handleHasMoreChange(hasMore: boolean, hadMore: boolean): void {
    if (!hasMore) {
      this.requestPending = false;
      if (hadMore) this.announcement = this.endOfResultsLabel;
    }
    this.disconnectIntersectionObserver();
  }

  private get grouped(): boolean {
    return this.grouping !== null;
  }

  private get selectable(): boolean {
    return this.selectionMode === 'multiple';
  }

  private get documentStickyHeader(): boolean {
    return this.stickyHeader && this.resolvedMaxHeight === undefined;
  }

  private get loadedRows(): TableRow[] {
    return tableRows(this.rows, this.groups, this.grouped);
  }

  private get hasData(): boolean {
    return this.loadedRows.length > 0;
  }

  private get totalColumns(): number {
    return this.columns.length + (this.selectable ? 1 : 0);
  }

  private get allGroupsCollapsed(): boolean {
    if (!this.grouped || this.groups.length === 0) return false;
    const collapsed = new Set(this.collapsedGroupIds);
    return this.groups.every(group => collapsed.has(group.id));
  }

  private get showCollapseAll(): boolean {
    return this.grouped && this.groups.length > 0 && !this.allGroupsCollapsed;
  }

  private get collapseAllHost() {
    if (!this.showCollapseAll) return undefined;
    return tableCollapseAllHost(this.columns);
  }

  private get flexibleColumnId(): string | undefined {
    return tableFlexibleColumnId(this.columns);
  }

  private get selectedSet(): Set<string> {
    return new Set(this.selectedRowIds);
  }

  private get selectionState() {
    return deriveTableSelectionState(this.loadedRows, this.selectedRowIds);
  }

  private get resolvedMaxHeight(): string | undefined {
    if (this.maxHeight == null || this.maxHeight === '') return undefined;
    return typeof this.maxHeight === 'number' ? `${Math.max(0, this.maxHeight)}px` : this.maxHeight;
  }

  private get tableStyle(): Record<string, string> | undefined {
    const width = tableExplicitMinWidth(this.columns);
    return width == null ? undefined : { '--ds-table-explicit-min-inline-size': width };
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

  private connectViewportObserver(): void {
    if (!this.viewportEl) return;
    this.viewportEl.removeEventListener('scroll', this.syncOverflow);
    this.viewportEl.addEventListener('scroll', this.syncOverflow, { passive: true });

    this.resizeObserver?.disconnect();
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(this.scheduleOverflowSync);
    this.resizeObserver.observe(this.viewportEl);
    if (this.tableEl) this.resizeObserver.observe(this.tableEl);
  }

  private scheduleOverflowSync = (): void => {
    if (this.overflowSyncFrame !== null) return;
    this.overflowSyncFrame = requestAnimationFrame(() => {
      this.overflowSyncFrame = null;
      this.syncOverflow();
    });
  };

  private syncOverflow = (): void => {
    const viewport = this.viewportEl;
    if (!viewport) return;
    const tableInlineSize = this.tableEl?.getBoundingClientRect().width ?? viewport.clientWidth;
    const visibleInlineSize = Math.min(viewport.clientWidth, tableInlineSize);
    const visibleInlineSizeValue = `${visibleInlineSize}px`;
    if (viewport.style.getPropertyValue('--ds-table-visible-inline-size') !== visibleInlineSizeValue) {
      viewport.style.setProperty('--ds-table-visible-inline-size', visibleInlineSizeValue);
    }
    const overflows = viewport.scrollWidth - viewport.clientWidth > 1;
    const scrollable = overflows || viewport.scrollHeight - viewport.clientHeight > 1;
    const nextStart = overflows && viewport.scrollLeft > 1;
    const nextEnd = overflows && viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1;
    if (nextStart !== this.overflowStart) this.overflowStart = nextStart;
    if (nextEnd !== this.overflowEnd) this.overflowEnd = nextEnd;
    if (scrollable !== this.scrollable) this.scrollable = scrollable;
    this.syncStickyHeaderPosition();
  };

  private syncStickyHeaderPosition(): void {
    if (!this.viewportEl || !this.stickyHeaderTableEl) return;
    const offset = this.viewportEl.scrollLeft;
    const maxOffset = Math.max(0, this.viewportEl.scrollWidth - this.viewportEl.clientWidth);
    this.stickyHeaderTableEl.style.setProperty('--ds-table-inline-scroll-offset', `${offset}px`);
    this.stickyHeaderTableEl.style.setProperty('--ds-table-inline-scroll-max-offset', `${maxOffset}px`);
  }

  private resetLoadRequest(): void {
    this.requestPending = false;
    this.requestedRowCount = this.loadedRows.length;
    this.disconnectIntersectionObserver();
  }

  private disconnectIntersectionObserver(): void {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.observedSentinel = null;
  }

  private connectIntersectionObserver(): void {
    if (
      !this.lazyLoading ||
      this.loadMoreMode !== 'auto' ||
      !this.hasMore ||
      !!this.loadMoreError?.trim() ||
      !this.intersectionSupported ||
      !this.viewportEl ||
      !this.sentinelEl
    ) {
      this.disconnectIntersectionObserver();
      return;
    }

    if (this.intersectionObserver && this.observedSentinel === this.sentinelEl) return;
    this.disconnectIntersectionObserver();

    const threshold = Number.isFinite(this.loadMoreThreshold)
      ? Math.max(0, this.loadMoreThreshold)
      : 0;
    this.intersectionObserver = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) this.requestLoadMore('auto');
      },
      {
        root: this.resolvedMaxHeight === undefined ? null : this.viewportEl,
        rootMargin: `0px 0px ${threshold}px 0px`,
      },
    );
    this.observedSentinel = this.sentinelEl;
    this.intersectionObserver.observe(this.sentinelEl);
  }

  private requestLoadMore(reason: TableLoadMoreReason): void {
    if (
      !this.lazyLoading ||
      !this.hasMore ||
      this.loadingMore ||
      (reason !== 'retry' && !!this.loadMoreError?.trim()) ||
      this.requestPending
    ) return;

    this.requestPending = true;
    this.requestedRowCount = this.loadedRows.length;
    this.announcement = this.loadingMoreLabel;
    this.dsLoadMore.emit({
      reason,
      loadIdentity: this.loadIdentity,
      loadedRowCount: this.requestedRowCount,
    });
  }

  private emitSort(column: TableColumn, sortKey = column.id): void {
    if (this.grouping?.columnId === column.id && sortKey === column.id) {
      this.dsGroupingChange.emit({ grouping: nextTableGroupOrder(this.grouping) });
      return;
    }
    if (!column.sortable) return;
    this.dsSortChange.emit({ sort: nextTableSortState(this.sort, sortKey) });
  }

  private sortButtonLabel(column: TableColumn, sortKey = column.id, label = column.header): string {
    if (this.grouping?.columnId === column.id && sortKey === column.id) {
      const next = this.grouping.direction === 'asc' ? 'descending' : 'ascending';
      return `Sort ${column.header} groups ${next}. Currently grouped ${this.grouping.direction === 'asc' ? 'ascending' : 'descending'}.`;
    }

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
    this.dsSelectionChange.emit({
      selectedRowIds: toggleAllLoadedTableRows(this.selectedRowIds, this.loadedRows),
      scope: 'all-loaded',
      selected: !this.selectionState.allSelected,
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
        class="ds-table__selection-control ds-interaction-fill__content"
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

  private renderColumnHeader(
    column: TableColumn,
    interactive = true,
    presentational = false,
  ) {
    const groupedColumn = this.grouping?.columnId === column.id;
    const headerSegments = column.headerSegments?.length
      ? column.headerSegments
      : [{ label: column.header, sortKey: column.id }];
    const activeMemberSegment = !groupedColumn
      ? headerSegments.find(segment => segment.sortKey === this.sort?.columnId)
      : undefined;
    const activeMemberSort = !!activeMemberSegment;
    const activeSort = groupedColumn || activeMemberSort;
    const align = column.align ?? 'start';
    const direction = groupedColumn
      ? this.grouping!.direction
      : activeMemberSort
        ? this.sort!.direction
        : undefined;
    const memberAriaSort = activeMemberSort
      ? (this.sort!.direction === 'asc' ? 'ascending' : 'descending')
      : undefined;

    const labelControl = (
      <span class="ds-table__header-labels">
        {headerSegments.map((segment, index) => {
          const segmentActive = groupedColumn
            ? headerSegments.length === 1
            : activeMemberSegment?.sortKey === segment.sortKey;
          const segmentInteractive = interactive && (
            !!column.sortable || (groupedColumn && segment.sortKey === column.id)
          );
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
              class="ds-table__header-label ds-table__header-label--interactive"
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
    const collapseHost = this.collapseAllHost;
    const isCollapseHost = collapseHost?.columnId === column.id;
    const actionCollapseHost = isCollapseHost && collapseHost?.mode === 'action';
    const blankActionCollapseHost = actionCollapseHost &&
      !column.header.trim() &&
      !column.headerSegments?.length;
    const collapseControl =
      interactive && isCollapseHost ? (
        <span class="ds-table__collapse-slot">
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
          'ds-table__header-cell--collapse-all': isCollapseHost,
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

  private renderColgroup() {
    return (
      <colgroup>
        {this.selectable && <col class="ds-table__selection-column" />}
        {this.columns.map(column => {
          const width = tableColumnSize(column);
          const flexible = column.id === this.flexibleColumnId;
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

  private renderHeader(interactive = true, presentational = false) {
    const selection = this.selectionState;
    return (
      <thead class={{
        'ds-table__head': true,
        'ds-table__head--semantic-copy': !interactive,
      }}>
        <tr class="ds-table__header-row">
          {this.selectable && (
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
            this.renderColumnHeader(column, interactive, presentational)
          ))}
        </tr>
      </thead>
    );
  }

  private renderCellValue(value: TableCellValue, column: TableColumn, row: TableRow) {
    if (isTableCellBlank(value)) return null;

    if (value == null || isTableCellEmpty(value)) {
      return (
        <ds-text
          class="ds-table__cell-track ds-table__cell-track--text"
          as="span"
          variant="text-body-medium"
          color="secondary"
        >
          <span aria-hidden="true">—</span>
          <span class="ds-visually-hidden">{this.emptyCellLabel}</span>
        </ds-text>
      );
    }

    if (isTableCellIcon(value)) {
      return (
        <ds-icon
          name={value.icon}
          size="md"
          color={value.color ?? 'secondary'}
          label={value.label}
        />
      );
    }

    if (isTableCellImage(value)) {
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

    if (isTableCellAction(value)) {
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

    if (isTableCellTag(value)) {
      const variant = value.variant ?? 'tag-only';
      const tag = (
        <ds-tag
          label={value.label}
          intent={value.intent ?? 'neutral'}
          contrast={value.contrast ?? 'faint'}
          size={variant === 'text-with-tag' ? 'sm' : 'md'}
          icon={value.icon ?? ''}
          rounded={value.rounded ?? false}
          isInset
          insetDepth="double"
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

    const primaryText = isTableCellPrimaryText(value);
    const text = isTableCellText(value) || primaryText
      ? value
      : { primary: value, fontFeature: typeof value === 'number' ? 'tabular-nums' as const : 'normal' as const };
    const wraps = text.wrap ?? column.wrap ?? false;

    return (
      <span class={{ 'ds-table__cell-copy': true, 'ds-table__cell-copy--wrap': wraps }}>
        <ds-text
          class="ds-table__cell-primary ds-table__cell-track ds-table__cell-track--text"
          as="span"
          variant="text-body-medium"
          color="primary"
          lineTruncation={wraps ? 'none' : 1}
          wrap={wraps ? 'wrap' : 'nowrap'}
          fontFeature={text.fontFeature ?? 'normal'}
        >
          {text.primary}
        </ds-text>
        {text.secondary !== undefined && text.secondary !== '' && (
          <ds-text
            class="ds-table__cell-secondary ds-table__cell-track ds-table__cell-track--text"
            as="span"
            variant={primaryText ? 'text-body-medium' : 'text-body-small'}
            color={primaryText ? 'primary' : 'secondary'}
            lineTruncation={wraps ? 'none' : 1}
            wrap={wraps ? 'wrap' : 'nowrap'}
          >
            {text.secondary}
          </ds-text>
        )}
      </span>
    );
  }

  private renderRow(row: TableRow) {
    const selected = this.selectedSet.has(row.id);
    const rowSelectable = row.selectable !== false && !row.disabled;
    return (
      <tr
        key={row.id}
        class={{
          'ds-table__row': true,
          'ds-table__row--selected': selected,
          'ds-table__row--disabled': !!row.disabled,
          'ds-table__row--interactive': !!row.interactive && !row.disabled,
        }}
        data-row-id={row.id}
        data-selected={selected ? 'true' : undefined}
        aria-disabled={row.disabled ? 'true' : undefined}
        tabIndex={row.interactive && !row.disabled ? 0 : undefined}
        onClick={event => this.emitRowActivation(row, event)}
        onKeyDown={event => this.handleRowKeydown(row, event)}
      >
        {this.selectable && (
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
          const value = row.cells[column.id];
          const tagCell = isTableCellTag(value);
          const iconCell = isTableCellIcon(value);
          const imageCell = isTableCellImage(value);
          const actionCell = isTableCellAction(value);
          const primaryTextCell = isTableCellPrimaryText(value);
          const emptyCell = value == null || isTableCellEmpty(value);
          const blankCell = isTableCellBlank(value);
          const textCell = primaryTextCell || (!tagCell && !iconCell && !imageCell && !actionCell && !emptyCell && !blankCell);
          const singleTextCell = textCell && !primaryTextCell && (!isTableCellText(value) || !value.secondary);
          const tagVariant = tagCell ? value.variant ?? 'tag-only' : undefined;
          const textVariant = textCell
            ? primaryTextCell
              ? 'primary-pair'
              : singleTextCell
                ? 'single'
                : 'multi'
            : undefined;
          const cellType = tagCell
            ? 'tag'
            : iconCell
              ? 'icon'
              : imageCell
                ? 'image'
                : actionCell
                  ? 'action'
                  : primaryTextCell
                    ? 'primary-text'
                    : emptyCell
                      ? 'empty'
                      : blankCell
                        ? 'blank'
                        : 'text';
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
                'ds-table__cell--action': actionCell,
                'ds-table__cell--primary-text': primaryTextCell,
                'ds-table__cell--text-single': singleTextCell,
                'ds-table__cell--text-multi': textCell && !singleTextCell,
                'ds-table__cell--empty': emptyCell,
                'ds-table__cell--blank': blankCell,
                'ds-table__cell--sticky-start': column.sticky === 'start',
                'ds-table__cell--sticky-end': column.sticky === 'end',
                'ds-interaction-fill': true,
                'ds-interaction-fill--grouped': true,
                'ds-interaction-fill--selected': selected,
              }}
              data-column-id={column.id}
              data-cell-type={cellType}
              data-cell-variant={tagVariant ?? textVariant}
            >
              <span class="ds-table__cell-content ds-interaction-fill__content">
                {this.renderCellValue(value, column, row)}
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

  private renderDataBodies() {
    if (!this.grouped) {
      return <tbody class="ds-table__body">{this.rows.map(row => this.renderRow(row))}</tbody>;
    }

    const collapsed = new Set(this.collapsedGroupIds);
    return this.groups.map(group => {
      const count = resolvedTableGroupCount(group);
      const countLabel = group.countLabel ?? `${count} ${count === 1 ? 'item' : 'items'}`;
      const isCollapsed = collapsed.has(group.id);
      const intentClass = tableGroupIntentClass(group.intent);
      const labelColor = tableGroupLabelColor(group.intent);
      const groupSelection = this.selectable
        ? deriveTableSelectionState(group.rows, this.selectedRowIds)
        : null;
      return (
        <tbody
          class="ds-table__body ds-table__group"
          data-group-id={group.id}
          data-group-intent={intentClass ? group.intent : undefined}
          data-collapsed={isCollapsed ? 'true' : undefined}
          key={group.id}
        >
          <tr class="ds-table__group-row">
            <th
              class={{
                'ds-table__group-cell': true,
                [intentClass ?? '']: !!intentClass,
              }}
              scope="rowgroup"
              colSpan={this.totalColumns}
            >
              <span class="ds-table__group-content">
                {groupSelection && (
                  <span class="ds-table__group-selection">
                    {this.renderSelectionControl(
                      groupSelection.allSelected
                        ? `Deselect ${group.label} group`
                        : `Select ${group.label} group`,
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
                  <ds-text as="span" variant="text-body-medium" color="secondary">
                    {countLabel}
                  </ds-text>
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
            </th>
          </tr>
          {!isCollapsed && group.rows.map(row => this.renderRow(row))}
        </tbody>
      );
    });
  }

  private renderSkeletonBody() {
    const count = Math.min(20, Math.max(1, Math.round(this.skeletonRows) || 1));
    return (
      <tbody class="ds-table__body ds-table__skeleton-body">
        {Array.from({ length: count }, (_, index) => (
          <tr class="ds-table__row ds-table__skeleton-row" key={`skeleton-${index}`}>
            {this.selectable && (
              <td class="ds-table__cell ds-table__selection-cell ds-table__cell--sticky-start">
                <ds-skeleton variant="icon" iconSize="md" />
                {this.renderStickyEdge('start')}
              </td>
            )}
            {this.columns.map(column => (
              <td
                class={{
                  'ds-table__cell': true,
                  'ds-table__cell--sticky-start': column.sticky === 'start',
                  'ds-table__cell--sticky-end': column.sticky === 'end',
                }}
                key={`skeleton-${index}:${column.id}`}
              >
                <span class="ds-table__cell-content">
                  <ds-skeleton variant="text" textVariant="text-body-medium" width="100%" />
                </span>
                {this.renderStickyEdge(column.sticky)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  private renderStateBody(kind: 'empty' | 'error') {
    const error = kind === 'error';
    return (
      <tbody class="ds-table__body ds-table__state-body">
        <tr class="ds-table__state-row">
          <td class="ds-table__state-cell" colSpan={this.totalColumns}>
            <ds-empty-state
              icon={error ? 'ErrorTriangle' : 'Inbox'}
              heading={error ? this.errorHeading : this.emptyHeading}
              body={error ? this.errorBody : this.emptyBody}
            />
          </td>
        </tr>
      </tbody>
    );
  }

  private renderLazyBody() {
    if (!this.lazyLoading || !this.hasData) return null;
    const error = this.loadMoreError?.trim();
    const manualFallback = this.loadMoreMode === 'manual' || !this.intersectionSupported;

    return (
      <tbody class="ds-table__body ds-table__load-body">
        <tr
          class="ds-table__load-row"
          ref={element => {
            this.sentinelEl = element ?? null;
          }}
        >
          <td class="ds-table__load-cell" colSpan={this.totalColumns}>
            {error ? (
              <span class="ds-table__load-content ds-table__load-content--error">
                <span class="ds-table__load-copy">
                  <ds-icon name="ErrorTriangle" size="md" color="secondary" aria-hidden="true" />
                  <ds-text as="span" variant="text-body-medium" color="secondary">{error}</ds-text>
                </span>
                <ds-button-unfilled
                  label={this.retryLabel}
                  size="md"
                  onDsClick={() => this.requestLoadMore('retry')}
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
                  onDsClick={() => this.requestLoadMore('manual')}
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
          </td>
        </tr>
      </tbody>
    );
  }

  private renderDocumentStickyHeader() {
    if (!this.documentStickyHeader) return null;
    return (
      <div
        class="ds-table__document-sticky-header"
      >
        <table
          class={{
            'ds-table__table': true,
            'ds-table__sticky-header-table': true,
            'ds-table__table--selectable': this.selectable,
            'ds-table__table--grouped': this.grouped,
          }}
          style={this.tableStyle}
          role="presentation"
          ref={element => {
            this.stickyHeaderTableEl = element ?? null;
          }}
        >
          {this.renderColgroup()}
          {this.renderHeader(true, true)}
        </table>
      </div>
    );
  }

  private get resultSummary(): string | null {
    return formatTableResultSummary(
      this.displayedCount,
      this.totalCount,
      this.resultSummaryLabel,
    );
  }

  private renderResultFooter() {
    const summary = this.resultSummary;
    if (!summary) return null;
    return (
      <ds-text
        class="ds-table__footer"
        as="div"
        variant="text-body-medium"
        color="secondary"
      >
        {summary}
      </ds-text>
    );
  }

  render() {
    const regionLabel = this.scrollLabel?.trim() || `${this.caption} scroll area`;
    const initialLoading = this.loading && !this.hasData;
    const initialError = !this.hasData && this.error;
    const viewportStyle = this.resolvedMaxHeight
      ? { '--ds-table-max-block-size': this.resolvedMaxHeight }
      : undefined;

    return (
      <Host class="table-host">
        <div class={{
          'ds-table': true,
          'ds-table--sticky-header': this.stickyHeader,
          'ds-table--document-sticky-header': this.documentStickyHeader,
          'ds-table--contained-sticky-header': this.stickyHeader && !this.documentStickyHeader,
        }}>
          <div
            class={{
              'ds-table__frame': true,
              'ds-table__frame--overflow-start': this.overflowStart,
              'ds-table__frame--overflow-end': this.overflowEnd,
            }}
          >
            {this.renderDocumentStickyHeader()}
            <div
              class="ds-table__viewport"
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
                  'ds-table__table--selectable': this.selectable,
                  'ds-table__table--grouped': this.grouped,
                }}
                style={this.tableStyle}
                aria-busy={initialLoading || this.loadingMore ? 'true' : undefined}
                ref={element => {
                  this.tableEl = element ?? null;
                }}
              >
                <caption
                  class={{
                    'ds-table__caption': true,
                    'ds-visually-hidden': this.captionVisibility === 'hidden',
                  }}
                >
                  <ds-text as="span" variant="text-title-small" emphasis={true} color="primary">
                    {this.caption}
                  </ds-text>
                </caption>
                {this.renderColgroup()}
                {this.renderHeader(!this.documentStickyHeader)}
                {initialLoading
                  ? this.renderSkeletonBody()
                  : initialError
                    ? this.renderStateBody('error')
                    : this.hasData
                      ? this.renderDataBodies()
                      : this.renderStateBody('empty')}
                {!initialLoading && !initialError && this.renderLazyBody()}
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

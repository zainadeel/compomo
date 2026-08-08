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
  clampTableColumnSize,
  deriveTableSelectionState,
  isTableCellText,
  nextTableGroupOrder,
  nextTableSortState,
  resolvedTableGroupCount,
  tableExplicitMinWidth,
  tableModelIssues,
  tableRows,
  tableRowSelectionLabel,
  toggleAllLoadedTableRows,
  toggleTableRowSelection,
} from './table-model';
import type {
  TableCaptionVisibility,
  TableCellValue,
  TableColumn,
  TableDensity,
  TableGroup,
  TableGroupingChangeDetail,
  TableGroupingState,
  TableLoadMoreDetail,
  TableLoadMoreMode,
  TableLoadMoreReason,
  TableRow,
  TableSelectionChangeDetail,
  TableSelectionMode,
  TableSortChangeDetail,
  TableSortState,
} from './table-types';

@Component({
  tag: 'ds-table',
  styleUrl: 'Table.css',
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

  /** Required accessible table name, rendered as a native caption. */
  @Prop() caption!: string;
  @Prop() captionVisibility: TableCaptionVisibility = 'hidden';
  @Prop() density: TableDensity = 'md';
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
  @Event() dsSelectionChange!: EventEmitter<TableSelectionChangeDetail>;
  @Event() dsLoadMore!: EventEmitter<TableLoadMoreDetail>;

  @State() private overflowStart = false;
  @State() private overflowEnd = false;
  @State() private scrollable = false;
  @State() private intersectionSupported = true;
  @State() private announcement = '';

  private viewportEl: HTMLElement | null = null;
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

  private get loadedRows(): TableRow[] {
    return tableRows(this.rows, this.groups, this.grouped);
  }

  private get hasData(): boolean {
    return this.loadedRows.length > 0;
  }

  private get totalColumns(): number {
    return this.columns.length + (this.selectable ? 1 : 0);
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
    return width == null ? undefined : { '--ds-table-explicit-min-inline-size': `${width}px` };
  }

  private warnModelIssues(): void {
    const issues = tableModelIssues(this.columns, this.rows, this.groups, this.grouped);
    if (!this.caption?.trim()) issues.unshift('A non-empty caption is required.');
    if (this.grouping && !this.columns.some(column => column.id === this.grouping!.columnId)) {
      issues.push(`Grouping references unknown column id: ${this.grouping.columnId}`);
    }
    if (this.sort && !this.columns.some(column => column.id === this.sort!.columnId)) {
      issues.push(`Sorting references unknown column id: ${this.sort.columnId}`);
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
    this.resizeObserver = new ResizeObserver(this.syncOverflow);
    this.resizeObserver.observe(this.viewportEl);
    if (this.tableEl) this.resizeObserver.observe(this.tableEl);
  }

  private syncOverflow = (): void => {
    const viewport = this.viewportEl;
    if (!viewport) return;
    const overflows = viewport.scrollWidth - viewport.clientWidth > 1;
    const scrollable = overflows || viewport.scrollHeight - viewport.clientHeight > 1;
    const nextStart = overflows && viewport.scrollLeft > 1;
    const nextEnd = overflows && viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1;
    if (nextStart !== this.overflowStart) this.overflowStart = nextStart;
    if (nextEnd !== this.overflowEnd) this.overflowEnd = nextEnd;
    if (scrollable !== this.scrollable) this.scrollable = scrollable;
  };

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
        root: this.viewportEl,
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

  private emitSort(column: TableColumn): void {
    if (this.grouping?.columnId === column.id) {
      this.dsGroupingChange.emit({ grouping: nextTableGroupOrder(this.grouping) });
      return;
    }
    if (!column.sortable) return;
    this.dsSortChange.emit({ sort: nextTableSortState(this.sort, column.id) });
  }

  private sortButtonLabel(column: TableColumn): string {
    if (this.grouping?.columnId === column.id) {
      const next = this.grouping.direction === 'asc' ? 'descending' : 'ascending';
      return `Sort ${column.header} groups ${next}. Currently grouped ${this.grouping.direction === 'asc' ? 'ascending' : 'descending'}.`;
    }

    if (this.sort?.columnId !== column.id) return `Sort ${column.header} ascending`;
    if (this.sort.direction === 'asc') return `Sort ${column.header} descending. Currently ascending.`;
    return `Clear ${column.header} sorting. Currently descending.`;
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

  private renderSelectionControl(
    label: string,
    checked: boolean,
    indeterminate: boolean,
    disabled: boolean,
    onActivate: () => void,
  ) {
    return (
      <button
        class="ds-table__selection-control"
        type="button"
        role="checkbox"
        aria-label={label}
        aria-checked={indeterminate ? 'mixed' : String(checked)}
        disabled={disabled}
        onClick={onActivate}
      >
        <ds-checkbox
          label=""
          size={this.density === 'sm' ? 'sm' : 'md'}
          checked={checked}
          indeterminate={indeterminate}
          presentation={true}
        />
      </button>
    );
  }

  private renderColumnHeader(column: TableColumn) {
    const groupedColumn = this.grouping?.columnId === column.id;
    const activeMemberSort = !groupedColumn && this.sort?.columnId === column.id;
    const interactive = groupedColumn || column.sortable;
    const align = column.align ?? 'start';
    const memberAriaSort = activeMemberSort
      ? (this.sort!.direction === 'asc' ? 'ascending' : 'descending')
      : undefined;

    const content = (
      <span class="ds-table__header-content">
        <ds-text as="span" variant="text-body-small" emphasis={true} color="secondary" lineTruncation={1}>
          {column.header}
        </ds-text>
        {interactive && (
          <span class="ds-table__sort-icons" aria-hidden="true">
            {groupedColumn && <ds-icon name="GroupBy" size="sm" color="inherit" />}
            <ds-icon
              name={
                groupedColumn
                  ? (this.grouping!.direction === 'asc' ? 'ArrowUp' : 'ArrowDown')
                  : activeMemberSort
                    ? (this.sort!.direction === 'asc' ? 'ArrowUp' : 'ArrowDown')
                    : 'ChevronUpDown'
              }
              size="sm"
              color="inherit"
            />
          </span>
        )}
      </span>
    );

    return (
      <th
        key={column.id}
        class={`ds-table__header-cell ds-table__cell--align-${align}`}
        scope="col"
        aria-sort={memberAriaSort}
        data-column-id={column.id}
        data-grouped={groupedColumn ? 'true' : undefined}
      >
        {interactive ? (
          <button
            class="ds-table__sort-trigger"
            type="button"
            aria-label={this.sortButtonLabel(column)}
            onClick={() => this.emitSort(column)}
          >
            {content}
          </button>
        ) : (
          <span class="ds-table__header-static">{content}</span>
        )}
      </th>
    );
  }

  private renderCellValue(value: TableCellValue, column: TableColumn) {
    if (value == null) {
      return (
        <ds-text as="span" variant="text-body-medium" color="secondary">
          <span aria-hidden="true">—</span>
          <span class="ds-visually-hidden">{this.emptyCellLabel}</span>
        </ds-text>
      );
    }

    const text = isTableCellText(value)
      ? value
      : { primary: value, fontFeature: typeof value === 'number' ? 'tabular-nums' as const : 'normal' as const };
    const wraps = text.wrap ?? column.wrap ?? false;

    return (
      <span class={{ 'ds-table__cell-copy': true, 'ds-table__cell-copy--wrap': wraps }}>
        <ds-text
          class="ds-table__cell-primary"
          as="span"
          variant="text-body-medium"
          color="primary"
          lineTruncation={wraps ? 'none' : 1}
          wrap={wraps ? 'wrap' : 'nowrap'}
          fontFeature={text.fontFeature ?? 'normal'}
        >
          {text.primary}
        </ds-text>
        {text.secondary && (
          <ds-text
            class="ds-table__cell-secondary"
            as="span"
            variant="text-body-small"
            color="secondary"
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
        }}
        data-row-id={row.id}
        data-selected={selected ? 'true' : undefined}
        aria-disabled={row.disabled ? 'true' : undefined}
      >
        {this.selectable && (
          <td class="ds-table__cell ds-table__selection-cell">
            {this.renderSelectionControl(
              `${selected ? 'Deselect' : 'Select'} ${tableRowSelectionLabel(row, this.columns)}`,
              selected,
              false,
              !rowSelectable,
              () => this.emitRowSelection(row),
            )}
          </td>
        )}
        {this.columns.map(column => {
          const align = column.align ?? 'start';
          return (
            <td
              key={`${row.id}:${column.id}`}
              class={`ds-table__cell ds-table__cell--align-${align}`}
              data-column-id={column.id}
            >
              <span class="ds-table__cell-content">
                {this.renderCellValue(row.cells[column.id], column)}
              </span>
            </td>
          );
        })}
      </tr>
    );
  }

  private renderDataBodies() {
    if (!this.grouped) {
      return <tbody class="ds-table__body">{this.rows.map(row => this.renderRow(row))}</tbody>;
    }

    return this.groups.map(group => {
      const count = resolvedTableGroupCount(group);
      const countLabel = group.countLabel ?? `${count} ${count === 1 ? 'item' : 'items'}`;
      return (
        <tbody class="ds-table__body ds-table__group" data-group-id={group.id} key={group.id}>
          <tr class="ds-table__group-row">
            <th class="ds-table__group-cell" scope="rowgroup" colSpan={this.totalColumns}>
              <span class="ds-table__group-content">
                <ds-icon name="GroupBy" size="sm" color="secondary" aria-hidden="true" />
                <ds-text as="span" variant="text-body-small" emphasis={true} color="primary">
                  {group.label}
                </ds-text>
                <ds-text as="span" variant="text-body-small" color="secondary">
                  {countLabel}
                </ds-text>
              </span>
            </th>
          </tr>
          {group.rows.map(row => this.renderRow(row))}
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
              <td class="ds-table__cell ds-table__selection-cell">
                <ds-skeleton variant="icon" iconSize={this.density === 'sm' ? 'sm' : 'md'} />
              </td>
            )}
            {this.columns.map(column => (
              <td class="ds-table__cell" key={`skeleton-${index}:${column.id}`}>
                <span class="ds-table__cell-content">
                  <ds-skeleton variant="text" textVariant="text-body-medium" width="100%" />
                </span>
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
                <ds-icon name="ErrorTriangle" size="sm" color="negative" aria-hidden="true" />
                <ds-text as="span" variant="text-body-small" color="secondary">{error}</ds-text>
                <ds-button-unfilled
                  label={this.retryLabel}
                  size="sm"
                  onDsClick={() => this.requestLoadMore('retry')}
                />
              </span>
            ) : this.loadingMore ? (
              <span class="ds-table__load-content">
                <ds-loader size="sm" color="secondary" />
                <ds-text as="span" variant="text-body-small" color="secondary">
                  {this.loadingMoreLabel}
                </ds-text>
              </span>
            ) : this.hasMore && manualFallback ? (
              <ds-button-unfilled
                label={this.loadMoreLabel}
                size="sm"
                onDsClick={() => this.requestLoadMore('manual')}
              />
            ) : this.hasMore ? (
              <span class="ds-table__auto-sentinel" aria-hidden="true" />
            ) : (
              <ds-text as="span" variant="text-body-small" color="secondary">
                {this.endOfResultsLabel}
              </ds-text>
            )}
          </td>
        </tr>
      </tbody>
    );
  }

  render() {
    const selection = this.selectionState;
    const regionLabel = this.scrollLabel?.trim() || `${this.caption} scroll area`;
    const initialLoading = this.loading && !this.hasData;
    const initialError = !this.hasData && this.error;
    const viewportStyle = this.resolvedMaxHeight
      ? { '--ds-table-max-block-size': this.resolvedMaxHeight }
      : undefined;

    return (
      <Host class={`table-host table-host--${this.density}`}>
        <div class={`ds-table ds-table--${this.density} ${this.stickyHeader ? 'ds-table--sticky-header' : ''}`}>
          <div
            class={{
              'ds-table__frame': true,
              'ds-table__frame--overflow-start': this.overflowStart,
              'ds-table__frame--overflow-end': this.overflowEnd,
            }}
          >
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
                <colgroup>
                  {this.selectable && <col class="ds-table__selection-column" />}
                  {this.columns.map(column => {
                    const width = clampTableColumnSize(column);
                    return <col key={column.id} style={width ? { width: `${width}px` } : undefined} />;
                  })}
                </colgroup>
                <thead class="ds-table__head">
                  <tr class="ds-table__header-row">
                    {this.selectable && (
                      <th class="ds-table__header-cell ds-table__selection-cell" scope="col">
                        {this.renderSelectionControl(
                          selection.allSelected ? 'Deselect all loaded rows' : 'Select all loaded rows',
                          selection.allSelected,
                          selection.indeterminate,
                          selection.selectableRowIds.length === 0,
                          () => this.emitAllSelection(),
                        )}
                      </th>
                    )}
                    {this.columns.map(column => this.renderColumnHeader(column))}
                  </tr>
                </thead>
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
          <div class="ds-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {this.announcement}
          </div>
        </div>
      </Host>
    );
  }
}

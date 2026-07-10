import { Component, Prop, State, Event, EventEmitter, h, Host } from '@stencil/core';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export interface TableColumn<T = unknown> {
  id: string;
  header: string;
  accessorKey?: string;
  accessor?: (row: T) => unknown;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
  minWidth?: string | number;
  hide?: boolean;
}

function getCellValue<T>(col: TableColumn<T>, row: T): unknown {
  if (col.accessorKey) return (row as Record<string, unknown>)[col.accessorKey];
  if (col.accessor) return col.accessor(row);
  return undefined;
}

function compareValues(a: unknown, b: unknown, dir: SortDirection): number {
  const m = dir === 'asc' ? 1 : -1;
  if (a == null && b == null) return 0;
  if (a == null) return m;
  if (b == null) return -m;
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * m;
  return String(a).localeCompare(String(b)) * m;
}

@Component({
  tag: 'ds-table',
  styleUrl: 'Table.css',
  scoped: true,
})
export class Table {
  @Prop() columns: TableColumn[] = [];
  @Prop() data: unknown[] = [];
  @Prop() sortState: SortState | undefined;
  @Prop() loading: boolean = false;
  @Prop() emptyMessage: string = 'No results found.';
  /** Comma-separated zero-based row indices that are selected. */
  @Prop() selectedRows: string = '';
  /** Page index (0-based). Enables built-in pagination when set alongside pageSize. */
  @Prop({ mutable: true }) pageIndex: number | undefined;
  @Prop() pageSize: number = 20;

  @State() private internalSort: SortState | undefined;

  @Event() dsSort!: EventEmitter<{ columnId: string }>;
  @Event() dsRowClick!: EventEmitter<{ row: unknown; rowIndex: number }>;
  @Event() dsPageChange!: EventEmitter<{ pageIndex: number }>;

  private get activeSort(): SortState | undefined {
    return this.sortState ?? this.internalSort;
  }

  private get visibleCols(): TableColumn[] {
    return this.columns.filter(c => !c.hide);
  }

  private get gridTemplate(): string {
    return this.visibleCols.map(col => {
      if (col.width) return typeof col.width === 'number' ? `${col.width}px` : col.width;
      return 'minmax(120px, 1fr)';
    }).join(' ');
  }

  private get sortedData(): unknown[] {
    const sort = this.activeSort;
    if (!sort) return this.data;
    const col = this.columns.find(c => c.id === sort.columnId);
    if (!col) return this.data;
    return [...this.data].sort((a, b) =>
      compareValues(getCellValue(col, a), getCellValue(col, b), sort.direction)
    );
  }

  private get pagedData(): unknown[] {
    if (this.pageIndex === undefined) return this.sortedData;
    const start = this.pageIndex * this.pageSize;
    return this.sortedData.slice(start, start + this.pageSize);
  }

  private get totalPages(): number {
    if (this.pageIndex === undefined) return 1;
    return Math.ceil(this.sortedData.length / this.pageSize);
  }

  private get selectedSet(): Set<number> {
    if (!this.selectedRows) return new Set();
    return new Set(this.selectedRows.split(',').map(Number).filter(n => !isNaN(n)));
  }

  private handleSort(columnId: string) {
    this.dsSort.emit({ columnId });
    // Toggle internal sort if consumer hasn't provided sortState
    if (!this.sortState) {
      const cur = this.internalSort;
      this.internalSort = cur?.columnId === columnId
        ? { columnId, direction: cur.direction === 'asc' ? 'desc' : 'asc' }
        : { columnId, direction: 'asc' };
    }
  }

  render() {
    const { visibleCols, pagedData, totalPages, loading } = this;
    const isEmpty = !loading && pagedData.length === 0;
    const selectedSet = this.selectedSet;
    const sort = this.activeSort;
    const hasPagination = this.pageIndex !== undefined && totalPages > 1;

    return (
      <Host>
        <div class="table-wrapper" aria-busy={loading || undefined}>
          <div class="table-scroll">
            <div class="table" style={{ gridTemplateColumns: this.gridTemplate }} role="table">

              {/* Header row */}
              <div class="header-row" role="row">
                {visibleCols.map(col => {
                  const isSorted = sort?.columnId === col.id;
                  const ariaSort = col.sortable
                    ? (isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none')
                    : undefined;
                  return (
                    <div
                      key={col.id}
                      class={{
                        'header-cell': true,
                        'header-cell--sortable': !!col.sortable,
                        'align-right': col.align === 'right',
                        'align-center': col.align === 'center',
                      }}
                      role="columnheader"
                      aria-sort={ariaSort}
                      tabIndex={col.sortable ? 0 : undefined}
                      onClick={() => col.sortable && this.handleSort(col.id)}
                      onKeyDown={(e: KeyboardEvent) => {
                        if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          this.handleSort(col.id);
                        }
                      }}
                      style={col.minWidth ? { minWidth: typeof col.minWidth === 'number' ? `${col.minWidth}px` : col.minWidth as string } : undefined}
                    >
                      <ds-text as="span" variant="text-body-small" emphasis color="secondary">
                        {col.header}
                      </ds-text>
                      {isSorted && (
                        <span class="sort-indicator" aria-hidden="true">
                          {sort.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Loading skeleton */}
              {loading && Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  class="row"
                  role={i === 0 ? 'status' : 'row'}
                  aria-label={i === 0 ? 'Loading' : undefined}
                >
                  {visibleCols.map(col => (
                    <div key={col.id} class="cell" role="cell">
                      <div class="skeleton" />
                    </div>
                  ))}
                </div>
              ))}

              {/* Empty state */}
              {isEmpty && (
                <div class="empty-row" style={{ gridColumn: '1 / -1' }}>
                  <ds-text as="p" variant="text-body-medium" color="secondary">
                    {this.emptyMessage}
                  </ds-text>
                </div>
              )}

              {/* Data rows */}
              {!loading && pagedData.map((row, rowIndex) => {
                const isSelected = selectedSet.has(rowIndex);
                return (
                  <div
                    key={rowIndex}
                    class={{
                      'row': true,
                      'row--selected': isSelected,
                      'row--clickable': true,
                    }}
                    role="row"
                    tabIndex={0}
                    aria-selected={this.selectedRows ? isSelected : undefined}
                    onClick={() => this.dsRowClick.emit({ row, rowIndex })}
                    onKeyDown={(e: KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.dsRowClick.emit({ row, rowIndex });
                      }
                    }}
                  >
                    {visibleCols.map(col => (
                      <div
                        key={col.id}
                        class={{
                          'cell': true,
                          'align-right': col.align === 'right',
                          'align-center': col.align === 'center',
                        }}
                        role="cell"
                      >
                        <span class="cell-value">
                          <ds-text as="span" variant="text-body-medium">
                            {String(getCellValue(col, row) ?? '')}
                          </ds-text>
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Built-in pagination */}
          {hasPagination && (
            <div class="table-pagination">
              <button
                type="button"
                class="page-button"
                disabled={this.pageIndex === 0}
                onClick={() => {
                  this.pageIndex = this.pageIndex! - 1;
                  this.dsPageChange.emit({ pageIndex: this.pageIndex });
                }}
              >
                <ds-text as="span" variant="text-body-small">Previous</ds-text>
              </button>
              <ds-text as="span" variant="text-body-small" color="secondary">
                Page {this.pageIndex! + 1} of {totalPages}
              </ds-text>
              <button
                type="button"
                class="page-button"
                disabled={this.pageIndex! >= totalPages - 1}
                onClick={() => {
                  this.pageIndex = this.pageIndex! + 1;
                  this.dsPageChange.emit({ pageIndex: this.pageIndex });
                }}
              >
                <ds-text as="span" variant="text-body-small">Next</ds-text>
              </button>
            </div>
          )}
        </div>
      </Host>
    );
  }
}

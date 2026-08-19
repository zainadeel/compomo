import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import { resolvePaginationState } from './pagination-model';
import type { PaginationChangeDetail } from './pagination-types';

let paginationId = 0;

@Component({
  tag: 'ds-pagination',
  styleUrl: 'Pagination.css',
  scoped: true,
})
export class Pagination {
  /** Controlled zero-based page index. */
  @Prop() pageIndex: number = 0;
  /** Controlled number of top-level items on a full page. */
  @Prop() pageSize: number = 25;
  /** Controlled total number of top-level items across every page. */
  @Prop() totalItems: number = 0;
  /** Available page sizes. Assign arrays through JavaScript. */
  @Prop() pageSizeOptions: number[] = [25, 50, 100, 200];
  /** Localized plural noun used by assistive range announcements. */
  @Prop() itemLabel: string = 'items';
  /** Visible page-size control label. */
  @Prop() pageSizeLabel: string = 'Items per page';
  /** Accessible name for the pagination navigation region. */
  @Prop() label: string = 'Pagination';
  /** Prevent interaction while the owner replaces the current data page. */
  @Prop() loading: boolean = false;

  /** Emits the complete next controlled state after a page or page-size request. */
  @Event() dsChange!: EventEmitter<PaginationChangeDetail>;

  private readonly pageSizeControlId = `ds-pagination-${++paginationId}-page-size`;

  private requestPage(pageIndex: number): void {
    const state = this.resolvedState;
    if (this.loading || pageIndex === state.pageIndex || pageIndex < 0 || pageIndex >= state.totalPages) {
      return;
    }
    this.dsChange.emit({
      pageIndex,
      pageSize: state.pageSize,
      totalItems: state.totalItems,
      pageSizeOptions: state.pageSizeOptions,
      itemLabel: this.itemLabel,
      pageSizeLabel: this.pageSizeLabel,
      ariaLabel: this.label,
      previousPageIndex: state.pageIndex,
      previousPageSize: state.pageSize,
      reason: 'page',
    });
  }

  private requestPageSize(value: string | string[]): void {
    if (this.loading || typeof value !== 'string') return;
    const pageSize = Number(value);
    const state = this.resolvedState;
    if (!Number.isFinite(pageSize) || pageSize <= 0 || pageSize === state.pageSize) return;
    this.dsChange.emit({
      pageIndex: 0,
      pageSize: Math.trunc(pageSize),
      totalItems: state.totalItems,
      pageSizeOptions: state.pageSizeOptions,
      itemLabel: this.itemLabel,
      pageSizeLabel: this.pageSizeLabel,
      ariaLabel: this.label,
      previousPageIndex: state.pageIndex,
      previousPageSize: state.pageSize,
      reason: 'page-size',
    });
  }

  private get resolvedState() {
    return resolvePaginationState({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      totalItems: this.totalItems,
      pageSizeOptions: this.pageSizeOptions,
    });
  }

  render() {
    const state = this.resolvedState;
    const atStart = state.pageIndex === 0;
    const atEnd = state.pageIndex === state.totalPages - 1;
    const range = `${state.firstItem}–${state.lastItem} of ${state.totalItems}`;
    const page = `Page ${state.pageIndex + 1} of ${state.totalPages}`;

    return (
      <Host>
        <nav class="pagination" aria-label={this.label} aria-busy={this.loading ? 'true' : undefined}>
          <div class="pagination__page-size">
            <ds-text
              id={`${this.pageSizeControlId}-label`}
              class="pagination__label"
              as="span"
              variant="text-body-medium"
              color="secondary"
            >
              {this.pageSizeLabel}
            </ds-text>
            <ds-select
              size="md"
              inputId={this.pageSizeControlId}
              ariaLabelledby={`${this.pageSizeControlId}-label`}
              options={state.pageSizeOptions.map(value => ({ label: String(value), value: String(value) }))}
              value={String(state.pageSize)}
              allowClear={false}
              activeFill={false}
              isInactive={this.loading}
              onDsChange={event => {
                event.stopPropagation();
                this.requestPageSize(event.detail);
              }}
            />
          </div>
          <ds-text
            class="pagination__range"
            as="span"
            variant="text-body-medium"
            color="secondary"
            fontFeature="tabular-nums"
          >
            {range}
          </ds-text>
          <div class="pagination__navigation">
            <ds-button-unfilled
              variant="icon"
              size="md"
              icon="ChevronLeftDouble"
              ariaLabel="First page"
              hasBorder={false}
              isInactive={this.loading || atStart}
              onDsClick={() => this.requestPage(0)}
            />
            <ds-button-unfilled
              variant="icon"
              size="md"
              icon="ChevronLeft"
              ariaLabel="Previous page"
              hasBorder={false}
              isInactive={this.loading || atStart}
              onDsClick={() => this.requestPage(state.pageIndex - 1)}
            />
            <ds-text
              class="pagination__page"
              as="span"
              variant="text-body-medium"
              color="secondary"
              fontFeature="tabular-nums"
            >
              {page}
            </ds-text>
            <ds-button-unfilled
              variant="icon"
              size="md"
              icon="ChevronRight"
              ariaLabel="Next page"
              hasBorder={false}
              isInactive={this.loading || atEnd}
              onDsClick={() => this.requestPage(state.pageIndex + 1)}
            />
            <ds-button-unfilled
              variant="icon"
              size="md"
              icon="ChevronRightDouble"
              ariaLabel="Last page"
              hasBorder={false}
              isInactive={this.loading || atEnd}
              onDsClick={() => this.requestPage(state.totalPages - 1)}
            />
          </div>
          <span class="ds-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {range} {this.itemLabel}. {page}.
          </span>
        </nav>
      </Host>
    );
  }
}

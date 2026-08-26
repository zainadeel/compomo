import { Component, Element, Event, EventEmitter, h, Host, Prop, State } from '@stencil/core';
import { observeTableCaptionCompact } from '../../utils/table-caption-compact';
import { resolvePaginationState } from './pagination-model';
import type {
  PaginationChangeDetail,
  PaginationPageSizeMode,
} from './pagination-types';

let paginationId = 0;

@Component({
  tag: 'ds-pagination',
  styleUrl: 'Pagination.css',
  scoped: true,
})
export class Pagination {
  @Element() el!: HTMLElement;

  /** Controlled zero-based page index. */
  @Prop() pageIndex: number = 0;
  /** Controlled number of top-level items on a full page. */
  @Prop() pageSize: number = 25;
  /** Whether pageSize is a fixed choice or a measured Fit snapshot. */
  @Prop() pageSizeMode: PaginationPageSizeMode = 'fixed';
  /** Controlled total number of top-level items across every page. */
  @Prop() totalItems: number = 0;
  /** Available page sizes. Assign arrays through JavaScript. */
  @Prop() pageSizeOptions: number[] = [25, 50, 100, 200];
  /** Include the Fit to page choice. */
  @Prop() fitToPage: boolean = false;
  /** Keep the Fit to page choice visible but unavailable. */
  @Prop() fitToPageInactive: boolean = false;
  /** Effective whole-item capacity to request when Fit is selected. */
  @Prop() fitPageSize: number | undefined;
  /** Full choice-list label for Fit. */
  @Prop() fitPageSizeLabel: string = 'Fit to page';
  /** Compact closed-trigger label while Fit is selected. */
  @Prop() fitPageSizeTriggerLabel: string = 'Fit';
  /** Localized plural noun used by assistive range announcements. */
  @Prop() itemLabel: string = 'items';
  /** Visible page-size control label. */
  @Prop() pageSizeLabel: string = 'Items';
  /** Accessible page-size control label. Defaults to “{pageSizeLabel} per page”. */
  @Prop() pageSizeAriaLabel: string | undefined;
  /** Accessible name for the pagination navigation region. */
  @Prop() label: string = 'Pagination';
  /** Include direct first-page and last-page controls. */
  @Prop() showFirstLastButtons: boolean = false;
  /** Prevent interaction while the owner replaces the current data page. */
  @Prop() loading: boolean = false;

  /** Emits the complete next controlled state after a page or page-size request. */
  @Event() dsChange!: EventEmitter<PaginationChangeDetail>;

  @State() private tableCompact = false;

  private readonly pageSizeControlId = `ds-pagination-${++paginationId}-page-size`;
  private tableCompactDisconnect: (() => void) | undefined;
  private hasLoaded = false;

  componentDidLoad(): void {
    this.hasLoaded = true;
    this.syncTableCompactObserver();
  }

  connectedCallback(): void {
    if (this.hasLoaded) this.syncTableCompactObserver();
  }

  disconnectedCallback(): void {
    this.tableCompactDisconnect?.();
    this.tableCompactDisconnect = undefined;
  }

  private syncTableCompactObserver(): void {
    this.tableCompactDisconnect?.();
    this.tableCompactDisconnect = observeTableCaptionCompact(this.el, compact => {
      if (this.tableCompact !== compact) this.tableCompact = compact;
    });
  }

  private requestPage(pageIndex: number): void {
    const state = this.resolvedState;
    if (this.loading || pageIndex === state.pageIndex || pageIndex < 0 || pageIndex >= state.totalPages) {
      return;
    }
    this.dsChange.emit({
      pageIndex,
      pageSize: state.pageSize,
      pageSizeMode: state.pageSizeMode,
      totalItems: state.totalItems,
      pageSizeOptions: state.pageSizeOptions,
      fitToPage: this.fitToPage,
      fitToPageInactive: this.fitToPageInactive,
      fitPageSize: this.resolvedFitPageSize,
      fitPageSizeLabel: this.fitPageSizeLabel,
      fitPageSizeTriggerLabel: this.fitPageSizeTriggerLabel,
      itemLabel: this.itemLabel,
      pageSizeLabel: this.pageSizeLabel,
      ariaLabel: this.label,
      showFirstLastButtons: this.showFirstLastButtons,
      previousPageIndex: state.pageIndex,
      previousPageSize: state.pageSize,
      previousPageSizeMode: state.pageSizeMode,
      reason: 'page',
    });
  }

  private requestPageSize(value: string | string[]): void {
    if (
      this.loading ||
      typeof value !== 'string' ||
      (value === 'fit' && this.fitToPageInactive)
    ) return;
    const state = this.resolvedState;
    const nextMode: PaginationPageSizeMode = value === 'fit' ? 'fit' : 'fixed';
    const pageSize = nextMode === 'fit' ? this.resolvedFitPageSize : Number(value);
    if (!pageSize || (pageSize === state.pageSize && nextMode === state.pageSizeMode)) return;
    this.dsChange.emit({
      pageIndex: 0,
      pageSize: Math.trunc(pageSize),
      pageSizeMode: nextMode,
      totalItems: state.totalItems,
      pageSizeOptions: state.pageSizeOptions,
      fitToPage: this.fitToPage,
      fitToPageInactive: this.fitToPageInactive,
      fitPageSize: this.resolvedFitPageSize,
      fitPageSizeLabel: this.fitPageSizeLabel,
      fitPageSizeTriggerLabel: this.fitPageSizeTriggerLabel,
      itemLabel: this.itemLabel,
      pageSizeLabel: this.pageSizeLabel,
      ariaLabel: this.label,
      showFirstLastButtons: this.showFirstLastButtons,
      previousPageIndex: state.pageIndex,
      previousPageSize: state.pageSize,
      previousPageSizeMode: state.pageSizeMode,
      reason: 'page-size',
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const fromChoiceControl = event.composedPath().some(node =>
      node instanceof HTMLElement &&
      (node.tagName === 'DS-SELECT' || ['INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName)),
    );
    if (fromChoiceControl || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    const state = this.resolvedState;
    const pageIndex = event.key === 'ArrowLeft' ? state.pageIndex - 1 : state.pageIndex + 1;
    if (this.loading || pageIndex < 0 || pageIndex >= state.totalPages) return;
    event.preventDefault();
    this.requestPage(pageIndex);
  }

  private get resolvedFitPageSize(): number | undefined {
    return Number.isFinite(this.fitPageSize) && Number(this.fitPageSize) > 0
      ? Math.trunc(Number(this.fitPageSize))
      : undefined;
  }

  private get resolvedState() {
    return resolvePaginationState({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      pageSizeMode: this.pageSizeMode,
      totalItems: this.totalItems,
      pageSizeOptions: this.pageSizeOptions,
    });
  }

  render() {
    const state = this.resolvedState;
    const atStart = state.pageIndex === 0;
    const atEnd = state.pageIndex === state.totalPages - 1;
    const visibleItems = state.totalItems === 0 ? 0 : state.lastItem - state.firstItem + 1;
    const total = `${visibleItems} of ${state.totalItems}`;
    const page = `${state.pageIndex + 1} of ${state.totalPages}`;
    const announcedRange = `${state.firstItem}–${state.lastItem} of ${state.totalItems}`;
    const announcedPage = `Page ${state.pageIndex + 1} of ${state.totalPages}`;
    const pageSizeAriaLabel = this.pageSizeAriaLabel ?? `${this.pageSizeLabel} per page`;
    const options: Array<{ label: string; value: string; isInactive?: boolean }> =
      state.pageSizeOptions.map(value => ({ label: String(value), value: String(value) }));
    if (this.fitToPage) {
      options.push({
        label: this.fitPageSizeLabel,
        value: 'fit',
        isInactive: this.fitToPageInactive || this.resolvedFitPageSize === undefined,
      });
    }

    return (
      <Host>
        <nav
          class={{
            pagination: true,
            'pagination--table-compact': this.tableCompact,
          }}
          aria-label={this.label}
          aria-busy={this.loading ? 'true' : undefined}
          onKeyDown={event => this.handleKeyDown(event)}
        >
          <div class="pagination__page-size">
            <ds-text
              class="pagination__label"
              as="span"
              variant="text-body-medium"
              color="secondary"
              aria-hidden="true"
            >
              {this.pageSizeLabel}:
            </ds-text>
            <span id={`${this.pageSizeControlId}-label`} class="ds-visually-hidden">
              {pageSizeAriaLabel}
            </span>
            <ds-select
              class="pagination__page-size-select"
              size="md"
              inputId={this.pageSizeControlId}
              ariaLabelledby={`${this.pageSizeControlId}-label`}
              options={options}
              value={state.pageSizeMode === 'fit' ? 'fit' : String(state.pageSize)}
              triggerLabel={state.pageSizeMode === 'fit' ? this.fitPageSizeTriggerLabel : undefined}
              indicator="up-down"
              allowClear={false}
              activeFill={false}
              hasBorder={false}
              isInactive={this.loading}
              onDsChange={event => {
                event.stopPropagation();
                this.requestPageSize(event.detail);
              }}
            />
            <ds-text
              class="pagination__total"
              as="span"
              variant="text-body-medium"
              color="secondary"
              fontFeature="tabular-nums"
            >
              {total}
            </ds-text>
          </div>
          <ds-divider
            class="pagination__divider"
            orientation="vertical"
            length="var(--dimension-size-250)"
          />
          <div class="pagination__navigation">
            {this.showFirstLastButtons ? (
              <ds-button-unfilled
                class="pagination__boundary"
                variant="icon"
                size="md"
                icon="ChevronLeftDouble"
                ariaLabel="First page"
                hasBorder={false}
                isInactive={this.loading || atStart}
                onDsClick={() => this.requestPage(0)}
              />
            ) : null}
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
            {this.showFirstLastButtons ? (
              <ds-button-unfilled
                class="pagination__boundary"
                variant="icon"
                size="md"
                icon="ChevronRightDouble"
                ariaLabel="Last page"
                hasBorder={false}
                isInactive={this.loading || atEnd}
                onDsClick={() => this.requestPage(state.totalPages - 1)}
              />
            ) : null}
          </div>
          <span class="ds-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {announcedRange} {this.itemLabel}. {announcedPage}.
          </span>
        </nav>
      </Host>
    );
  }
}

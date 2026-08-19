export type PaginationChangeReason = 'page' | 'page-size' | 'fit';
export type PaginationPageSizeMode = 'fixed' | 'fit';

/** Controlled pagination state shared by Pagination and pagination-aware consumers. */
export interface PaginationState {
  /** Zero-based page index. */
  pageIndex: number;
  /** Number of top-level items on a full page. */
  pageSize: number;
  /** Whether pageSize is a chosen fixed value or a measured Fit snapshot. */
  pageSizeMode?: PaginationPageSizeMode;
  /** Total number of top-level items across every page. */
  totalItems: number;
  /** Available page sizes. Defaults to 25, 50, 100, and 200. */
  pageSizeOptions?: number[];
  /** Include a Fit to page option. The owner supplies the effective fitted size. */
  fitToPage?: boolean;
  /** Effective page size proposed when Fit to page is selected. */
  fitPageSize?: number;
  /** Full option label for Fit in the open choice list. */
  fitPageSizeLabel?: string;
  /** Compact trigger label while Fit is selected. */
  fitPageSizeTriggerLabel?: string;
  /** Localized plural noun used by assistive range announcements. */
  itemLabel?: string;
  /** Visible label for the page-size selector. */
  pageSizeLabel?: string;
  /** Accessible name for the pagination navigation region. */
  ariaLabel?: string;
}

/** Complete next controlled state emitted for a page or page-size request. */
export interface PaginationChangeDetail extends PaginationState {
  previousPageIndex: number;
  previousPageSize: number;
  previousPageSizeMode: PaginationPageSizeMode;
  reason: PaginationChangeReason;
}

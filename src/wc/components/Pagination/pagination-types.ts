export type PaginationChangeReason = 'page' | 'page-size';

/** Controlled pagination state shared by Pagination and pagination-aware consumers. */
export interface PaginationState {
  /** Zero-based page index. */
  pageIndex: number;
  /** Number of top-level items on a full page. */
  pageSize: number;
  /** Total number of top-level items across every page. */
  totalItems: number;
  /** Available page sizes. Defaults to 25, 50, 100, and 200. */
  pageSizeOptions?: number[];
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
  reason: PaginationChangeReason;
}

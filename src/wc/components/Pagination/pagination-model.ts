import type { PaginationPageSizeMode, PaginationState } from './pagination-types';

export const DEFAULT_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export interface ResolvedPaginationState {
  pageIndex: number;
  pageSize: number;
  pageSizeMode: PaginationPageSizeMode;
  totalItems: number;
  totalPages: number;
  firstItem: number;
  lastItem: number;
  pageSizeOptions: number[];
}

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function positiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

export function resolvePaginationState(
  state: Pick<
    PaginationState,
    'pageIndex' | 'pageSize' | 'pageSizeMode' | 'totalItems' | 'pageSizeOptions'
  >,
): ResolvedPaginationState {
  const pageSize = positiveInteger(state.pageSize, DEFAULT_PAGE_SIZE_OPTIONS[0]);
  const pageSizeMode = state.pageSizeMode === 'fit' ? 'fit' : 'fixed';
  const totalItems = nonNegativeInteger(state.totalItems);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageIndex = Math.min(nonNegativeInteger(state.pageIndex), totalPages - 1);
  const options = (state.pageSizeOptions?.length
    ? state.pageSizeOptions
    : DEFAULT_PAGE_SIZE_OPTIONS
  )
    .map(value => positiveInteger(value, 0))
    .filter(value => value > 0);
  const pageSizeOptions = [
    ...new Set(pageSizeMode === 'fixed' ? [...options, pageSize] : options),
  ].sort((left, right) => left - right);
  const firstItem = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
  const lastItem = totalItems === 0 ? 0 : Math.min(totalItems, firstItem + pageSize - 1);

  return {
    pageIndex,
    pageSize,
    pageSizeMode,
    totalItems,
    totalPages,
    firstItem,
    lastItem,
    pageSizeOptions,
  };
}

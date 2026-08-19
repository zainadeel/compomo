import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePaginationState } from '../src/wc/components/Pagination/pagination-model';

test('resolves the first full page', () => {
  assert.deepEqual(resolvePaginationState({ pageIndex: 0, pageSize: 25, totalItems: 500 }), {
    pageIndex: 0,
    pageSize: 25,
    totalItems: 500,
    totalPages: 20,
    firstItem: 1,
    lastItem: 25,
    pageSizeOptions: [25, 50, 100, 200],
  });
});

test('caps a partial final page and clamps an out-of-range index', () => {
  const state = resolvePaginationState({ pageIndex: 20, pageSize: 25, totalItems: 63 });
  assert.equal(state.pageIndex, 2);
  assert.equal(state.firstItem, 51);
  assert.equal(state.lastItem, 63);
  assert.equal(state.totalPages, 3);
});

test('renders a stable zero-results page', () => {
  const state = resolvePaginationState({ pageIndex: 8, pageSize: 25, totalItems: 0 });
  assert.equal(state.pageIndex, 0);
  assert.equal(state.totalPages, 1);
  assert.equal(state.firstItem, 0);
  assert.equal(state.lastItem, 0);
});

test('normalizes page sizes and retains a controlled custom size', () => {
  const state = resolvePaginationState({
    pageIndex: 0,
    pageSize: 75,
    totalItems: 500,
    pageSizeOptions: [100, 25, 25, -1],
  });
  assert.deepEqual(state.pageSizeOptions, [25, 75, 100]);
});

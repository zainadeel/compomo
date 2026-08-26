import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveTableFitPageSize } from '../src/wc/components/Table/table-pagination-fit';

test('counts only complete top-level items below the table header', () => {
  assert.equal(
    resolveTableFitPageSize({
      viewportBlockSize: 640,
      headerBlockSize: 48,
      itemBlockSize: 64,
    }),
    9
  );
});

test('keeps one item for a positive viewport smaller than a row', () => {
  assert.equal(
    resolveTableFitPageSize({
      viewportBlockSize: 80,
      headerBlockSize: 48,
      itemBlockSize: 64,
    }),
    1
  );
});

test('rejects unresolved geometry', () => {
  assert.equal(
    resolveTableFitPageSize({
      viewportBlockSize: 0,
      headerBlockSize: 48,
      itemBlockSize: 64,
    }),
    undefined
  );
});

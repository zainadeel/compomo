import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveTableViewportFitMetrics } from '../src/wc/components/Table/table-viewport-fit-controller';

test('reserves compact-state height while exposing only the currently visible height', () => {
  assert.deepEqual(
    resolveTableViewportFitMetrics({
      scrollportBlockStart: 48,
      scrollportBlockSize: 672,
      hostBlockStart: 200,
      insetBlockStart: 80,
      insetBlockEnd: 32,
    }),
    {
      reservedBlockSize: 560,
      currentBlockSize: 488,
      settled: false,
    },
  );
});

test('fills the reserved height after surrounding page chrome has compacted', () => {
  assert.deepEqual(
    resolveTableViewportFitMetrics({
      scrollportBlockStart: 48,
      scrollportBlockSize: 672,
      hostBlockStart: 128,
      insetBlockStart: 80,
      insetBlockEnd: 32,
    }),
    {
      reservedBlockSize: 560,
      currentBlockSize: 560,
      settled: true,
    },
  );
});

test('clamps impossible inset geometry without producing negative sizes', () => {
  assert.deepEqual(
    resolveTableViewportFitMetrics({
      scrollportBlockStart: 0,
      scrollportBlockSize: 120,
      hostBlockStart: 200,
      insetBlockStart: 80,
      insetBlockEnd: 80,
    }),
    {
      reservedBlockSize: 0,
      currentBlockSize: 0,
      settled: false,
    },
  );
});

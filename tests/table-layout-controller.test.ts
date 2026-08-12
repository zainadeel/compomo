import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveTableLayoutMetrics } from '../src/wc/components/Table/table-layout-controller';

test('resolves viewport, sticky, and floating-control geometry in one snapshot', () => {
  assert.deepEqual(
    resolveTableLayoutMetrics({
      viewportInlineSize: 360,
      viewportBlockSize: 220,
      scrollInlineSize: 800,
      scrollBlockSize: 500,
      scrollInlineOffset: 120,
      tableInlineSize: 800,
      collapseHeadBlockStart: 72,
      collapseFrameBlockStart: 40,
    }),
    {
      visibleInlineSize: 360,
      overflow: { start: true, end: true, scrollable: true },
      inlineOffset: 120,
      maxInlineOffset: 440,
      collapseBlockOffset: 32,
    },
  );
});

test('does not report edge overflow or unmeasured overlay geometry', () => {
  assert.deepEqual(
    resolveTableLayoutMetrics({
      viewportInlineSize: 480,
      viewportBlockSize: 320,
      scrollInlineSize: 480,
      scrollBlockSize: 240,
      scrollInlineOffset: 0,
      tableInlineSize: 320,
    }),
    {
      visibleInlineSize: 320,
      overflow: { start: false, end: false, scrollable: false },
      inlineOffset: 0,
      maxInlineOffset: 0,
      collapseBlockOffset: null,
    },
  );
});

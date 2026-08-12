import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveTableLayoutMetrics,
  TableLayoutController,
  type TableOverflowState,
} from '../src/wc/components/Table/table-layout-controller';

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

test('resolves first-paint geometry synchronously when layout elements connect', () => {
  const properties = new Map<string, string>();
  const viewport = {
    clientWidth: 432,
    clientHeight: 240,
    scrollWidth: 1232,
    scrollHeight: 240,
    scrollLeft: 0,
    style: {
      getPropertyValue: (property: string) => properties.get(property) ?? '',
      setProperty: (property: string, value: string) => properties.set(property, value),
    },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as HTMLElement;
  const table = {
    getBoundingClientRect: () => ({ width: 1232 }),
  } as unknown as HTMLTableElement;
  let overflow: TableOverflowState | undefined;
  const controller = new TableLayoutController({
    elements: () => ({
      viewport,
      table,
      stickyHeaderTable: null,
      collapseAllOverlay: null,
      frame: null,
      interactiveHead: null,
    }),
    mode: () => ({ documentStickyHeader: false, floatingCollapseAll: false }),
    overflowChanged: state => { overflow = state; },
  });

  controller.connect();

  assert.equal(properties.get('--ds-table-visible-inline-size'), '432px');
  assert.deepEqual(overflow, { start: false, end: true, scrollable: true });
  controller.disconnect();
});

test('resolves intrinsic table-size changes synchronously after a render refresh', () => {
  const properties = new Map<string, string>();
  let tableWidth = 320;
  const viewport = {
    clientWidth: 432,
    clientHeight: 240,
    scrollWidth: 432,
    scrollHeight: 240,
    scrollLeft: 0,
    style: {
      getPropertyValue: (property: string) => properties.get(property) ?? '',
      setProperty: (property: string, value: string) => properties.set(property, value),
    },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as HTMLElement;
  const table = {
    getBoundingClientRect: () => ({ width: tableWidth }),
  } as unknown as HTMLTableElement;
  const controller = new TableLayoutController({
    elements: () => ({
      viewport,
      table,
      stickyHeaderTable: null,
      collapseAllOverlay: null,
      frame: null,
      interactiveHead: null,
    }),
    mode: () => ({ documentStickyHeader: false, floatingCollapseAll: false }),
    overflowChanged: () => undefined,
  });

  controller.connect();
  assert.equal(properties.get('--ds-table-visible-inline-size'), '320px');

  tableWidth = 1232;
  Object.defineProperty(viewport, 'scrollWidth', { value: 1232 });
  controller.refresh();

  assert.equal(properties.get('--ds-table-visible-inline-size'), '432px');
  controller.disconnect();
});

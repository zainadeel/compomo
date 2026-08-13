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
    }),
    {
      visibleInlineSize: 480,
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
  let overflow: TableOverflowState | undefined;
  const controller = new TableLayoutController({
    elements: () => ({
      viewport,
      stickyHeaderTable: null,
      collapseAllOverlay: null,
      frame: null,
      interactiveHead: null,
    }),
    mode: () => ({
      documentStickyHeader: false,
      floatingCollapseAll: false,
      clampVerticalOverscroll: false,
    }),
    overflowChanged: state => { overflow = state; },
  });

  controller.connect();

  assert.equal(properties.get('--ds-table-visible-inline-size'), '432px');
  assert.deepEqual(overflow, { start: false, end: true, scrollable: true });
  controller.disconnect();
});

test('resolves viewport-size changes synchronously after a render refresh', () => {
  const properties = new Map<string, string>();
  let viewportWidth = 320;
  const viewport = {
    get clientWidth() { return viewportWidth; },
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
  const controller = new TableLayoutController({
    elements: () => ({
      viewport,
      stickyHeaderTable: null,
      collapseAllOverlay: null,
      frame: null,
      interactiveHead: null,
    }),
    mode: () => ({
      documentStickyHeader: false,
      floatingCollapseAll: false,
      clampVerticalOverscroll: false,
    }),
    overflowChanged: () => undefined,
  });

  controller.connect();
  assert.equal(properties.get('--ds-table-visible-inline-size'), '320px');

  viewportWidth = 432;
  Object.defineProperty(viewport, 'scrollWidth', { value: 1232 });
  controller.refresh();

  assert.equal(properties.get('--ds-table-visible-inline-size'), '432px');
  controller.disconnect();
});

test('contains vertical wheel deltas at fitted viewport edges and transfers them outward', () => {
  const listeners = new Map<string, EventListener>();
  const viewport = {
    clientWidth: 432,
    clientHeight: 240,
    scrollWidth: 432,
    scrollHeight: 640,
    scrollLeft: 0,
    scrollTop: 0,
    style: {
      getPropertyValue: () => '',
      setProperty: () => undefined,
    },
    addEventListener: (type: string, listener: EventListener) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
  } as unknown as HTMLElement;
  const deltas: number[] = [];
  const controller = new TableLayoutController({
    elements: () => ({
      viewport,
      stickyHeaderTable: null,
      collapseAllOverlay: null,
      frame: null,
      interactiveHead: null,
    }),
    mode: () => ({
      documentStickyHeader: false,
      floatingCollapseAll: false,
      clampVerticalOverscroll: true,
    }),
    verticalEdgeWheel: delta => {
      deltas.push(delta);
      return true;
    },
    overflowChanged: () => undefined,
  });
  controller.connect();

  let prevented = false;
  listeners.get('wheel')?.({
    deltaX: 0,
    deltaY: -24,
    preventDefault: () => { prevented = true; },
  } as unknown as Event);
  assert.equal(prevented, true);
  assert.deepEqual(deltas, [-24]);

  viewport.scrollTop = 120;
  prevented = false;
  listeners.get('wheel')?.({
    deltaX: 0,
    deltaY: 24,
    preventDefault: () => { prevented = true; },
  } as unknown as Event);
  assert.equal(prevented, false);
  assert.deepEqual(deltas, [-24]);

  viewport.scrollTop = 400;
  listeners.get('wheel')?.({
    deltaX: 0,
    deltaY: 24,
    preventDefault: () => { prevented = true; },
  } as unknown as Event);
  assert.equal(prevented, true);
  assert.deepEqual(deltas, [-24, 24]);
  controller.disconnect();
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { TableVirtualController } from '../src/wc/components/Table/table-virtual-controller';
import { flattenTableVirtualItems } from '../src/wc/components/Table/table-virtual-model';
import type { TableColumn, TableRow } from '../src/wc/components/Table/table-types';

const columns: TableColumn[] = [{ id: 'name', header: 'Name', size: 160 }];
const rows: TableRow[] = Array.from({ length: 40 }, (_, index) => ({
  id: `r${index}`,
  cells: { name: `Row ${index}` },
}));

function createViewport(height = 200) {
  const listeners = new Map<string, EventListener>();
  const viewport = {
    clientHeight: height,
    scrollTop: 0,
    addEventListener: (type: string, listener: EventListener) => {
      listeners.set(type, listener);
    },
    removeEventListener: (type: string) => {
      listeners.delete(type);
    },
    dispatch(type: string) {
      listeners.get(type)?.(new Event(type));
    },
  };
  return viewport as typeof viewport & HTMLElement;
}

test('emits a window on connect and only again when the index range changes', () => {
  const viewport = createViewport();
  const items = flattenTableVirtualItems({
    grouped: false,
    rows,
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  let frames: FrameRequestCallback[] = [];
  let emissions = 0;
  const controller = new TableVirtualController({
    state: () => ({
      enabled: true,
      items,
      pinnedRowIds: new Set(),
      viewport,
      viewportSize: viewport.clientHeight,
    }),
    windowChanged: () => {
      emissions += 1;
    },
    requestAnimationFrame: callback => {
      frames.push(callback);
      return frames.length;
    },
    cancelAnimationFrame: () => {
      frames = [];
    },
  });

  controller.connect();
  assert.equal(emissions, 1);
  const first = controller.currentPlan();
  assert.ok(first);
  assert.ok(first.mountedIds.size < items.length);

  viewport.dispatch('scroll');
  assert.equal(emissions, 1);
  assert.equal(frames.length, 1);
  viewport.scrollTop = 0;
  frames.splice(0).forEach(callback => callback(0));
  assert.equal(emissions, 1);

  viewport.scrollTop = 800;
  viewport.dispatch('scroll');
  frames.splice(0).forEach(callback => callback(0));
  assert.equal(emissions, 2);
  const second = controller.currentPlan();
  assert.ok(second);
  assert.notEqual(second.start, first.start);
});

test('corrects scrollTop when a measured row is taller than its estimate', () => {
  const viewport = createViewport();
  viewport.scrollTop = 400;
  const items = flattenTableVirtualItems({
    grouped: false,
    rows,
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  const controller = new TableVirtualController({
    state: () => ({
      enabled: true,
      items,
      pinnedRowIds: new Set(),
      viewport,
      viewportSize: viewport.clientHeight,
    }),
    windowChanged: () => undefined,
    requestAnimationFrame: callback => {
      callback(0);
      return 1;
    },
    cancelAnimationFrame: () => undefined,
  });
  controller.connect();
  const plan = controller.currentPlan();
  assert.ok(plan);
  const overscanId = items[plan.start]?.id;
  assert.ok(overscanId);

  const root = {
    querySelectorAll: () => [
      {
        getAttribute: () => overscanId,
        getBoundingClientRect: () => ({ height: 80 }),
      },
    ],
  } as unknown as ParentNode;

  controller.collectMeasurements(root);
  assert.equal(controller.sizeFor(items[plan.start]!), 80);
  assert.equal(viewport.scrollTop, 440);
});

test('resetToTop clears measures and returns the window to the start', () => {
  const viewport = createViewport();
  viewport.scrollTop = 900;
  const items = flattenTableVirtualItems({
    grouped: false,
    rows,
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  const controller = new TableVirtualController({
    state: () => ({
      enabled: true,
      items,
      pinnedRowIds: new Set(),
      viewport,
      viewportSize: viewport.clientHeight,
    }),
    windowChanged: () => undefined,
    requestAnimationFrame: callback => {
      callback(0);
      return 1;
    },
    cancelAnimationFrame: () => undefined,
  });
  controller.connect();
  controller.resetToTop();
  assert.equal(viewport.scrollTop, 0);
  assert.equal(controller.currentPlan()?.start, 0);
});

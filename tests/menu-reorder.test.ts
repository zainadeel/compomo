import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createMenuReorderDetail,
  locateMenuItem,
  menuReorderableRange,
  moveReorderableMenuItemBefore,
  moveReorderableMenuItemBy,
} from '../src/wc/components/Menu/menu-reorder';
import type { MenuItemData, MenuSection } from '../src/wc/components/Menu/menu-types';

const items: MenuItemData[] = [
  { label: 'Driver', value: 'driver', reorderable: true },
  { label: 'Status', value: 'status', reorderable: true },
  { label: 'Vehicle', value: 'vehicle', reorderable: true },
  { label: 'Action', value: 'action', isInactive: true },
];

test('finds the contiguous reorderable run and ignores locked rows', () => {
  assert.deepEqual(menuReorderableRange(items, 1), { start: 0, end: 2 });
  assert.equal(menuReorderableRange(items, 3), null);
  assert.equal(menuReorderableRange([{ label: 'Locked', isInactive: true }], 0), null);
});

test('moves a reorderable row before a clamped insert index', () => {
  assert.deepEqual(
    moveReorderableMenuItemBefore(items, 2, 0)?.map(item => item.value),
    ['vehicle', 'driver', 'status', 'action'],
  );
  assert.deepEqual(
    moveReorderableMenuItemBefore(items, 0, 3)?.map(item => item.value),
    ['status', 'vehicle', 'driver', 'action'],
  );
  assert.equal(moveReorderableMenuItemBefore(items, 1, 1), null);
  assert.equal(moveReorderableMenuItemBefore(items, 1, 2), null);
  assert.equal(moveReorderableMenuItemBefore(items, 3, 0), null);
});

test('clamps drops to the reorderable run so locked rows stay last', () => {
  assert.deepEqual(
    moveReorderableMenuItemBefore(items, 0, 8)?.map(item => item.value),
    ['status', 'vehicle', 'driver', 'action'],
  );
  assert.deepEqual(
    moveReorderableMenuItemBefore(items, 2, -4)?.map(item => item.value),
    ['vehicle', 'driver', 'status', 'action'],
  );
});

test('keyboard offset moves one slot and no-ops at the range edge', () => {
  assert.deepEqual(
    moveReorderableMenuItemBy(items, 1, -1)?.map(item => item.value),
    ['status', 'driver', 'vehicle', 'action'],
  );
  assert.deepEqual(
    moveReorderableMenuItemBy(items, 1, 1)?.map(item => item.value),
    ['driver', 'vehicle', 'status', 'action'],
  );
  assert.equal(moveReorderableMenuItemBy(items, 0, -1), null);
  assert.equal(moveReorderableMenuItemBy(items, 2, 1), null);
  assert.equal(moveReorderableMenuItemBy(items, 1, 0), null);
});

test('locates a flat index across item sections and skips picker sections', () => {
  const sections: MenuSection[] = [
    {
      header: 'Theme',
      variant: 'swatch-picker',
      value: 'neutral',
      options: [],
    },
    { header: 'Columns', items },
  ];
  assert.deepEqual(locateMenuItem(sections, 1), {
    sectionIndex: 1,
    itemIndex: 1,
    items,
  });
  assert.equal(locateMenuItem(sections, 8), null);
});

test('creates reorder detail from the moved item identity or value', () => {
  const next = moveReorderableMenuItemBy(items, 1, -1)!;
  assert.deepEqual(createMenuReorderDetail(items, 1, next, 0), {
    item: items[1],
    fromIndex: 1,
    toIndex: 0,
    sectionIndex: 0,
    items: next,
  });

  const cloned = next.map(item => ({ ...item }));
  assert.equal(createMenuReorderDetail(items, 1, cloned, 0)?.toIndex, 0);
});

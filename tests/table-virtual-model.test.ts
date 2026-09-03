import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTableVirtualIndex,
  estimateTableRowBlockSize,
  findTableVirtualIndexAtOffset,
  flattenTableVirtualItems,
  resolveTableVirtualPlan,
  resolveTableVirtualPlanFromIndex,
  sameTableVirtualPlan,
  TABLE_VIRTUAL_GROUP_HEADER_SIZE,
  TABLE_VIRTUAL_MIN_OVERSCAN_ROWS,
  TABLE_VIRTUAL_ROW_TRACK_SIZE,
  tableVirtualRowTrackSize,
  tableVirtualOverscanPx,
  type TableVirtualItem,
} from '../src/wc/components/Table/table-virtual-model';
import type { TableColumn, TableGroup, TableRow } from '../src/wc/components/Table/table-types';

const columns: TableColumn[] = [
  { id: 'name', header: 'Name', size: 160 },
  { id: 'score', header: 'Score', size: 80 },
];

function row(id: string, extra?: Partial<TableRow>): TableRow {
  return {
    id,
    cells: { name: id, score: 1 },
    ...extra,
  };
}

function sizes(items: TableVirtualItem[]): number[] {
  return items.map(item => item.estimatedSize);
}

test('estimates named track stacks including unlimited wrap', () => {
  assert.equal(estimateTableRowBlockSize(row('single'), columns), TABLE_VIRTUAL_ROW_TRACK_SIZE[1]);
  assert.equal(
    estimateTableRowBlockSize(
      { id: 'multi', cells: { name: { primary: 'A', secondary: 'B' }, score: 1 } },
      columns
    ),
    TABLE_VIRTUAL_ROW_TRACK_SIZE[2]
  );
  assert.equal(
    estimateTableRowBlockSize(
      { id: 'wrap', cells: { name: { primary: 'A', wrap: true }, score: 1 } },
      columns
    ),
    TABLE_VIRTUAL_ROW_TRACK_SIZE[3]
  );
  assert.equal(
    estimateTableRowBlockSize(
      {
        id: 'wrap-secondary',
        cells: { name: { primary: 'A', secondary: 'B', wrap: true }, score: 1 },
      },
      columns
    ),
    TABLE_VIRTUAL_ROW_TRACK_SIZE[4]
  );
  assert.equal(
    estimateTableRowBlockSize(
      {
        id: 'five-tag-tracks',
        cells: {
          name: { kind: 'tags', tracks: 5, items: [{ label: 'One' }, { label: 'Two' }] },
          score: 1,
        },
      },
      columns
    ),
    136
  );
  assert.equal(tableVirtualRowTrackSize(5), 136);
});

test('flattens ungrouped rows and collapsed grouped sections', () => {
  const rows = [row('a'), row('b')];
  const ungrouped = flattenTableVirtualItems({
    grouped: false,
    rows,
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  assert.deepEqual(
    ungrouped.map(item => item.id),
    ['row:a', 'row:b']
  );
  assert.equal(
    ungrouped.every(item => !item.variableSize),
    true
  );

  const wrapping = flattenTableVirtualItems({
    grouped: false,
    rows: [{ id: 'wrap', cells: { name: { primary: 'Wrapping copy', wrap: true }, score: 1 } }],
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  assert.equal(wrapping[0]?.variableSize, true);

  const wrappingTags = flattenTableVirtualItems({
    grouped: false,
    rows: [
      {
        id: 'tags',
        cells: { name: { kind: 'tags', tracks: 3, items: [{ label: 'One' }] }, score: 1 },
      },
    ],
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  assert.equal(wrappingTags[0]?.variableSize, true);

  const clamped = flattenTableVirtualItems({
    grouped: false,
    rows: [
      {
        id: 'clamped',
        cells: { name: { primary: 'Clamped copy', wrap: true, maxLines: 2 }, score: 1 },
      },
    ],
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  assert.equal(clamped[0]?.variableSize, false);

  const groups: TableGroup[] = [
    { id: 'critical', label: 'Critical', rows: [row('a'), row('b')] },
    { id: 'high', label: 'High', rows: [row('c')] },
  ];
  const expanded = flattenTableVirtualItems({
    grouped: true,
    rows: [],
    groups,
    collapsedGroupIds: [],
    columns,
  });
  assert.deepEqual(
    expanded.map(item => item.id),
    ['group:critical', 'row:a', 'row:b', 'group:high', 'row:c']
  );
  assert.equal(expanded[0]?.estimatedSize, TABLE_VIRTUAL_GROUP_HEADER_SIZE);

  const accessoryHeader = flattenTableVirtualItems({
    grouped: true,
    rows: [],
    groups: [
      {
        id: 'critical',
        label: 'Critical',
        rows: [row('a')],
        accessories: [{ text: 'ID: 54321' }, { text: '2 groups' }],
      },
    ],
    collapsedGroupIds: [],
    columns,
  });
  assert.equal(accessoryHeader[0]?.estimatedSize, TABLE_VIRTUAL_ROW_TRACK_SIZE[2]);

  const heroHeader = flattenTableVirtualItems({
    grouped: true,
    rows: [],
    groups: [
      {
        id: 'assigned',
        label: 'Assigned',
        rows: [row('a')],
        hero: { kind: 'score', value: 87 },
      },
    ],
    collapsedGroupIds: [],
    columns,
  });
  assert.equal(heroHeader[0]?.estimatedSize, TABLE_VIRTUAL_GROUP_HEADER_SIZE);

  const collapsed = flattenTableVirtualItems({
    grouped: true,
    rows: [],
    groups,
    collapsedGroupIds: ['critical'],
    columns,
  });
  assert.deepEqual(
    collapsed.map(item => item.id),
    ['group:critical', 'group:high', 'row:c']
  );
});

test('prefix-sum lookup and overscan follow the locked window contract', () => {
  const prefix = [0, 40, 80, 120, 160];
  assert.equal(findTableVirtualIndexAtOffset(prefix, 0), 0);
  assert.equal(findTableVirtualIndexAtOffset(prefix, 40), 1);
  assert.equal(findTableVirtualIndexAtOffset(prefix, 79), 1);
  assert.equal(findTableVirtualIndexAtOffset(prefix, 200), 3);
  assert.equal(
    tableVirtualOverscanPx(100),
    TABLE_VIRTUAL_MIN_OVERSCAN_ROWS * TABLE_VIRTUAL_ROW_TRACK_SIZE[1]
  );
  assert.equal(tableVirtualOverscanPx(400), 320);
  assert.equal(tableVirtualOverscanPx(800), 400);
});

test('windows an ungrouped list with spacers instead of every row', () => {
  const items = flattenTableVirtualItems({
    grouped: false,
    rows: Array.from({ length: 40 }, (_, index) => row(`r${index}`)),
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  const plan = resolveTableVirtualPlan({
    items,
    sizes: sizes(items),
    scrollOffset: 400,
    viewportSize: 200,
  });

  const mountedRows = plan.nodes.filter(node => node.kind === 'row');
  assert.ok(mountedRows.length < items.length);
  assert.ok(mountedRows.length >= 5);
  assert.equal(plan.nodes[0]?.kind, 'spacer');
  assert.equal(plan.nodes[plan.nodes.length - 1]?.kind, 'spacer');
  const first = mountedRows[0];
  const last = mountedRows[mountedRows.length - 1];
  assert.ok(first && first.kind === 'row');
  assert.ok(last && last.kind === 'row');
  assert.ok(first.index > 0);
  assert.ok(last.index < items.length - 1);
});

test('keeps more overscan ahead of the active scroll direction', () => {
  const items = flattenTableVirtualItems({
    grouped: false,
    rows: Array.from({ length: 40 }, (_, index) => row(`direction-${index}`)),
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  const index = createTableVirtualIndex(
    items,
    items.map(item => item.estimatedSize)
  );
  const forward = resolveTableVirtualPlanFromIndex(index, {
    scrollOffset: 800,
    viewportSize: 200,
    scrollDirection: 'forward',
  });
  const backward = resolveTableVirtualPlanFromIndex(index, {
    scrollOffset: 800,
    viewportSize: 200,
    scrollDirection: 'backward',
  });

  assert.ok(forward.start > backward.start);
  assert.ok(forward.end > backward.end);
});

test('keeps intersecting group headers and the next header for sticky push-off', () => {
  const groups: TableGroup[] = [
    {
      id: 'a',
      label: 'A',
      rows: Array.from({ length: 20 }, (_, index) => row(`a${index}`)),
    },
    {
      id: 'b',
      label: 'B',
      rows: Array.from({ length: 20 }, (_, index) => row(`b${index}`)),
    },
  ];
  const items = flattenTableVirtualItems({
    grouped: true,
    rows: [],
    groups,
    collapsedGroupIds: [],
    columns,
  });
  const plan = resolveTableVirtualPlan({
    items,
    sizes: sizes(items),
    scrollOffset: 40 + 10 * 40,
    viewportSize: 120,
  });

  const groupNodes = plan.nodes.filter(node => node.kind === 'group');
  assert.ok(groupNodes.length >= 1);
  assert.equal(groupNodes[0] && groupNodes[0].kind === 'group' && groupNodes[0].groupId, 'a');
  assert.ok(plan.mountedIds.has('group:a'));
  assert.ok(plan.mountedIds.has('group:b'));
  const groupA = groupNodes[0];
  assert.ok(groupA && groupA.kind === 'group');
  const memberRows = groupA.nodes.filter(node => node.kind === 'row');
  assert.ok(memberRows.length < 20);
  assert.ok(groupA.nodes.some(node => node.kind === 'spacer'));
});

test('pins a focused row that would otherwise leave the window', () => {
  const items = flattenTableVirtualItems({
    grouped: false,
    rows: Array.from({ length: 50 }, (_, index) => row(`r${index}`)),
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  const plan = resolveTableVirtualPlan({
    items,
    sizes: sizes(items),
    scrollOffset: 1600,
    viewportSize: 200,
    pinnedRowIds: new Set(['r0']),
  });
  assert.ok(plan.mountedIds.has('row:r0'));
  assert.ok(plan.nodes.some(node => node.kind === 'row' && node.item.rowId === 'r0'));
});

test('treats equal plans as unchanged so scroll can skip a render', () => {
  const items = flattenTableVirtualItems({
    grouped: false,
    rows: [row('a'), row('b'), row('c')],
    groups: [],
    collapsedGroupIds: [],
    columns,
  });
  const input = {
    items,
    sizes: sizes(items),
    scrollOffset: 0,
    viewportSize: 400,
  };
  const left = resolveTableVirtualPlan(input);
  const right = resolveTableVirtualPlan(input);
  assert.equal(sameTableVirtualPlan(left, right), true);
  assert.equal(sameTableVirtualPlan(left, { ...right, start: right.start + 1 }), false);
});

test('treats same-length row reorders and replacements as changed plans', () => {
  const createPlan = (ids: string[]) => {
    const items = flattenTableVirtualItems({
      grouped: false,
      rows: ids.map(id => row(id)),
      groups: [],
      collapsedGroupIds: [],
      columns,
    });
    return resolveTableVirtualPlan({
      items,
      sizes: sizes(items),
      scrollOffset: 0,
      viewportSize: 400,
    });
  };

  const original = createPlan(['a', 'b', 'c']);
  assert.equal(sameTableVirtualPlan(original, createPlan(['c', 'b', 'a'])), false);
  assert.equal(sameTableVirtualPlan(original, createPlan(['x', 'y', 'z'])), false);
});

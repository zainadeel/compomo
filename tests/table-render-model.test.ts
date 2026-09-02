import assert from 'node:assert/strict';
import test from 'node:test';
import { createTableRenderModel } from '../src/wc/components/Table/table-render-model';
import type { TableColumn, TableGroup, TableRow } from '../src/wc/components/Table/table-types';

const columns: TableColumn[] = [
  { id: 'name', header: 'Name', size: 160 },
  { id: 'action', header: '', headerLabel: 'Actions', kind: 'action', sticky: 'end' },
];
const rows: TableRow[] = [
  { id: 'a', cells: { name: 'A', action: { kind: 'blank' } } },
  { id: 'b', cells: { name: 'B', action: { kind: 'blank' } } },
];

test('creates one complete derived snapshot for an ungrouped render', () => {
  const model = createTableRenderModel({
    columns,
    rows,
    groups: [],
    grouped: false,
    selectionMode: 'multiple',
    selectedRowIds: ['b', 'outside-window'],
    collapsedGroupIds: [],
  });

  assert.equal(model.loadedRows, rows);
  assert.equal(model.hasData, true);
  assert.equal(model.selectedRowIds.has('b'), true);
  assert.equal(model.selection.selectedLoadedCount, 1);
  assert.equal(model.totalColumns, 4);
  assert.equal(model.collapseAllHost, undefined);
  assert.equal(model.elasticSpacerIndex, 1);
  assert.deepEqual(model.tableStyle, {
    '--_table-grid-template-columns':
      'var(--_table-selection-column-inline-size) 160px minmax(0, 1fr) var(--dimension-size-500)',
    '--ds-table-explicit-min-inline-size': 'calc(160px + var(--dimension-size-500))',
  });
});

test('leaves intentionally unsized columns flexible without adding a spacer', () => {
  const model = createTableRenderModel({
    columns: [
      { id: 'name', header: 'Name', size: 160 },
      { id: 'notes', header: 'Notes' },
    ],
    rows,
    groups: [],
    grouped: false,
    selectionMode: 'none',
    selectedRowIds: [],
    collapsedGroupIds: [],
  });

  assert.equal(model.totalColumns, 2);
  assert.equal(model.elasticSpacerIndex, undefined);
  assert.deepEqual(model.tableStyle, {
    '--_table-grid-template-columns': '160px minmax(0, 1fr)',
    '--ds-table-explicit-min-inline-size': '160px',
  });
});

test('normalizes group presentation and selection without mutating inputs', () => {
  const groups: TableGroup[] = [
    {
      id: 'critical',
      label: 'Critical',
      intent: 'negative',
      totalCount: 3,
      countLabel: '3 events',
      rows,
    },
    {
      id: 'invalid',
      label: 'Invalid',
      intent: 'unsupported' as TableGroup['intent'],
      rows: [],
    },
  ];
  const model = createTableRenderModel({
    columns,
    rows: [],
    groups,
    grouped: true,
    selectionMode: 'multiple',
    selectedRowIds: ['a'],
    collapsedGroupIds: ['invalid'],
  });

  assert.equal(model.loadedRows.length, 2);
  assert.equal(model.groups[0].count, 3);
  assert.equal(model.groups[0].loadedCount, 2);
  assert.equal(model.groups[0].visibleCountText, '2 of 3');
  assert.equal(model.groups[0].countLabel, '2 of 3 events loaded');
  assert.equal(model.groups[0].selection?.indeterminate, true);
  assert.equal(model.groups[1].intent, undefined);
  assert.equal(model.groups[1].intentClass, undefined);
  assert.equal(model.groups[1].labelColor, 'primary');
  assert.equal(model.groups[1].loadedCount, 0);
  assert.equal(model.groups[1].visibleCountText, '0');
  assert.equal(model.groups[1].countLabel, '0 items');
  assert.equal(model.groups[1].collapsed, true);
  assert.deepEqual(model.collapseAllHost, { columnId: 'action', mode: 'action' });
  assert.equal(model.allGroupsCollapsed, false);
  assert.deepEqual(
    groups.map(group => group.id),
    ['critical', 'invalid']
  );
});

test('uses supplied member totals without loaded-window phrasing', () => {
  const groups: TableGroup[] = [
    {
      id: 'critical',
      label: 'Critical',
      totalCount: 166,
      countLabel: '166 events',
      rows,
    },
  ];
  const model = createTableRenderModel({
    columns,
    rows: [],
    groups,
    grouped: true,
    selectionMode: 'none',
    selectedRowIds: [],
    collapsedGroupIds: [],
    groupCountPresentation: 'total',
  });

  assert.equal(model.groups[0].count, 166);
  assert.equal(model.groups[0].visibleCountText, '166');
  assert.equal(model.groups[0].countLabel, '166 events');
});

test('shows totals only when a collapsed section has no supplied members', () => {
  const groups: TableGroup[] = [
    {
      id: 'critical',
      label: 'Critical',
      totalCount: 200,
      countLabel: '200 events',
      rows: [],
    },
    {
      id: 'high',
      label: 'High',
      totalCount: 80,
      countLabel: '80 events',
      rows: [],
    },
    {
      id: 'medium',
      label: 'Medium',
      totalCount: 3,
      countLabel: '3 events',
      rows,
    },
    {
      id: 'empty',
      label: 'Empty',
      rows: [],
    },
  ];
  const model = createTableRenderModel({
    columns,
    rows: [],
    groups,
    grouped: true,
    selectionMode: 'none',
    selectedRowIds: [],
    collapsedGroupIds: ['critical', 'medium', 'empty'],
  });

  assert.equal(model.groups[0].collapsed, true);
  assert.equal(model.groups[0].loadedCount, 0);
  assert.equal(model.groups[0].visibleCountText, '200');
  assert.equal(model.groups[0].countLabel, '200 events');
  assert.equal(model.groups[1].collapsed, false);
  assert.equal(model.groups[1].visibleCountText, '0 of 80');
  assert.equal(model.groups[1].countLabel, '0 of 80 events loaded');
  assert.equal(model.groups[2].collapsed, true);
  assert.equal(model.groups[2].visibleCountText, '2 of 3');
  assert.equal(model.groups[2].countLabel, '2 of 3 events loaded');
  assert.equal(model.groups[3].collapsed, true);
  assert.equal(model.groups[3].visibleCountText, '0');
  assert.equal(model.groups[3].countLabel, '0 items');
});

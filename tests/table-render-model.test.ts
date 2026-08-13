import assert from 'node:assert/strict';
import test from 'node:test';
import { createTableRenderModel } from '../src/wc/components/Table/table-render-model';
import type {
  TableColumn,
  TableGroup,
  TableRow,
} from '../src/wc/components/Table/table-types';

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
  assert.equal(model.totalColumns, 3);
  assert.equal(model.collapseAllHost, undefined);
  assert.equal(model.flexibleColumnId, 'name');
  assert.deepEqual(model.tableStyle, {
    '--_table-grid-template-columns': 'var(--_table-selection-column-inline-size) minmax(160px, 1fr) var(--dimension-size-500)',
    '--ds-table-explicit-min-inline-size': 'calc(160px + var(--dimension-size-500))',
  });
});

test('normalizes group presentation and selection without mutating inputs', () => {
  const groups: TableGroup[] = [
    {
      id: 'critical',
      label: 'Critical',
      intent: 'negative',
      totalCount: 3,
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
  assert.equal(model.groups[0].countLabel, '3 items');
  assert.equal(model.groups[0].countIntent, 'negative');
  assert.equal(model.groups[0].selection?.indeterminate, true);
  assert.equal(model.groups[1].intent, undefined);
  assert.equal(model.groups[1].intentClass, undefined);
  assert.equal(model.groups[1].labelColor, 'primary');
  assert.equal(model.groups[1].countIntent, 'neutral');
  assert.equal(model.groups[1].collapsed, true);
  assert.deepEqual(model.collapseAllHost, { columnId: 'action', mode: 'action' });
  assert.equal(model.allGroupsCollapsed, false);
  assert.deepEqual(groups.map(group => group.id), ['critical', 'invalid']);
});

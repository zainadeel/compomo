import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampTableColumnSize,
  deriveTableSelectionState,
  nextTableGroupOrder,
  nextTableSortState,
  resolvedTableGroupCount,
  tableExplicitMinWidth,
  tableModelIssues,
  tableRowSelectionLabel,
  toggleAllLoadedTableRows,
  toggleTableRowSelection,
} from '../src/wc/components/Table/table-model';
import type { TableColumn, TableRow } from '../src/wc/components/Table/table-types';

const columns: TableColumn[] = [
  { id: 'name', header: 'Name', size: 160, minSize: 120, maxSize: 200 },
  { id: 'score', header: 'Score', size: 80, align: 'end', sortable: true },
];

const rows: TableRow[] = [
  { id: 'a', cells: { name: { primary: 'Avery', secondary: 'Driver' }, score: 98 } },
  { id: 'b', cells: { name: 'Blair', score: 92 }, selectable: false },
  { id: 'c', cells: { name: 'Casey', score: 87 }, disabled: true },
  { id: 'd', cells: { name: 'Devon', score: 84 } },
];

test('cycles controlled member sorting and keeps group order binary', () => {
  assert.deepEqual(nextTableSortState(null, 'score'), { columnId: 'score', direction: 'asc' });
  assert.deepEqual(
    nextTableSortState({ columnId: 'score', direction: 'asc' }, 'score'),
    { columnId: 'score', direction: 'desc' },
  );
  assert.equal(nextTableSortState({ columnId: 'score', direction: 'desc' }, 'score'), null);
  assert.deepEqual(
    nextTableSortState({ columnId: 'name', direction: 'desc' }, 'score'),
    { columnId: 'score', direction: 'asc' },
  );
  assert.deepEqual(
    nextTableGroupOrder({ columnId: 'status', direction: 'asc' }),
    { columnId: 'status', direction: 'desc' },
  );
});

test('derives loaded selection while excluding non-selectable and disabled rows', () => {
  assert.deepEqual(deriveTableSelectionState(rows, ['a', 'not-loaded']), {
    selectableRowIds: ['a', 'd'],
    selectedLoadedCount: 1,
    allSelected: false,
    indeterminate: true,
  });

  assert.deepEqual(toggleTableRowSelection(['a'], rows[1]), ['a']);
  assert.deepEqual(toggleTableRowSelection(['a'], rows[3]).sort(), ['a', 'd']);
});

test('select-all preserves identities outside the loaded window', () => {
  const selected = toggleAllLoadedTableRows(['a', 'not-loaded'], rows);
  assert.deepEqual(new Set(selected), new Set(['a', 'd', 'not-loaded']));

  const cleared = toggleAllLoadedTableRows(selected, rows);
  assert.deepEqual(cleared, ['not-loaded']);
});

test('resolves labels, column constraints, and server group totals defensively', () => {
  assert.equal(tableRowSelectionLabel(rows[0], columns), 'Avery');
  assert.equal(
    tableRowSelectionLabel({ id: 'fallback', selectionLabel: ' Explicit ', cells: {} }, columns),
    'Explicit',
  );
  assert.equal(clampTableColumnSize({ ...columns[0], size: 80 }), 120);
  assert.equal(clampTableColumnSize({ ...columns[0], size: 240 }), 200);
  assert.equal(tableExplicitMinWidth(columns), 240);
  assert.equal(resolvedTableGroupCount({ id: 'g', label: 'Group', totalCount: 8, rows }), 8);
  assert.equal(resolvedTableGroupCount({ id: 'g', label: 'Group', totalCount: 1, rows }), 4);
});

test('reports unstable model identities and impossible group counts', () => {
  const issues = tableModelIssues(
    [columns[0], { ...columns[0] }],
    [],
    [
      { id: 'same', label: 'First', rows: [rows[0]] },
      { id: 'same', label: 'Second', totalCount: 0, rows: [rows[0]] },
    ],
    true,
  );

  assert.ok(issues.includes('Duplicate column id: name'));
  assert.ok(issues.includes('Duplicate group id: same'));
  assert.ok(issues.includes('Duplicate row id: a'));
  assert.ok(issues.includes('Group same totalCount is smaller than its loaded row count.'));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { TableColumn } from '../src/wc/components/Table/table-types';
import {
  nextTableSortStateFromMenuItem,
  TABLE_SORT_DIRECTION_ASC,
  TABLE_SORT_DIRECTION_DESC,
  tableSortFields,
  tableSortMenuSections,
  tableSortStatesEqual,
} from '../src/wc/components/TableSort/table-sort-menu';

const columns: TableColumn[] = [
  { id: 'preview', header: 'Preview' },
  {
    id: 'behaviorDetails',
    header: 'Behavior / Severity',
    headerSegments: [
      { label: 'Behavior', sortKey: 'behavior', separator: '/' },
      { label: 'Severity', sortKey: 'severity' },
    ],
    sortable: true,
  },
  { id: 'status', header: 'Status', sortable: true },
  { id: 'action', kind: 'action', header: '', headerLabel: 'Action' },
];

test('lists sortable columns and compound header segments, skipping action columns', () => {
  assert.deepEqual(tableSortFields(columns), [
    { id: 'behavior', label: 'Behavior' },
    { id: 'severity', label: 'Severity' },
    { id: 'status', label: 'Status' },
  ]);
});

test('builds Data and Direction menu sections from the controlled sort', () => {
  const sections = tableSortMenuSections(columns, { columnId: 'severity', direction: 'desc' });
  assert.deepEqual(
    sections.map(section => section.header),
    ['Data', 'Direction']
  );
  assert.equal(
    sections[0]?.items.find(item => item.label === 'Severity')?.isSelected,
    true
  );
  assert.equal(
    sections[1]?.items.find(item => item.value === TABLE_SORT_DIRECTION_DESC)?.isSelected,
    true
  );
});

test('changes field while keeping direction and does not toggle the active field', () => {
  const current = { columnId: 'behavior', direction: 'desc' as const };
  const sections = tableSortMenuSections(columns, current);
  const status = sections[0]?.items.find(item => item.label === 'Status');
  const behavior = sections[0]?.items.find(item => item.label === 'Behavior');
  assert.ok(status);
  assert.ok(behavior);
  assert.deepEqual(
    nextTableSortStateFromMenuItem(columns, current, status),
    { columnId: 'status', direction: 'desc' }
  );
  assert.deepEqual(
    nextTableSortStateFromMenuItem(columns, current, behavior),
    current
  );
  assert.deepEqual(
    nextTableSortStateFromMenuItem(columns, null, status),
    { columnId: 'status', direction: 'asc' }
  );
});

test('applies direction to the current field or the first sortable field', () => {
  const current = { columnId: 'status', direction: 'asc' as const };
  assert.deepEqual(
    nextTableSortStateFromMenuItem(columns, current, {
      label: 'Descending',
      value: TABLE_SORT_DIRECTION_DESC,
    }),
    { columnId: 'status', direction: 'desc' }
  );
  assert.deepEqual(
    nextTableSortStateFromMenuItem(columns, null, {
      label: 'Ascending',
      value: TABLE_SORT_DIRECTION_ASC,
    }),
    { columnId: 'behavior', direction: 'asc' }
  );
  assert.deepEqual(
    nextTableSortStateFromMenuItem(columns, { columnId: 'removed', direction: 'asc' }, {
      label: 'Descending',
      value: TABLE_SORT_DIRECTION_DESC,
    }),
    { columnId: 'behavior', direction: 'desc' }
  );
});

test('keeps application column ids separate from direction command values', () => {
  const collidingColumns: TableColumn[] = [
    { id: TABLE_SORT_DIRECTION_DESC, header: 'Direction data', sortable: true },
  ];
  const fieldItem = tableSortMenuSections(collidingColumns, null)[0]?.items[0];
  assert.ok(fieldItem);
  assert.notEqual(fieldItem.value, TABLE_SORT_DIRECTION_DESC);
  assert.deepEqual(nextTableSortStateFromMenuItem(collidingColumns, null, fieldItem), {
    columnId: TABLE_SORT_DIRECTION_DESC,
    direction: 'asc',
  });
});

test('compares sort states by column and direction', () => {
  assert.equal(
    tableSortStatesEqual({ columnId: 'status', direction: 'asc' }, { columnId: 'status', direction: 'asc' }),
    true
  );
  assert.equal(
    tableSortStatesEqual({ columnId: 'status', direction: 'asc' }, { columnId: 'status', direction: 'desc' }),
    false
  );
  assert.equal(tableSortStatesEqual(null, null), true);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { TableColumn } from '../src/wc/components/Table/table-types';
import {
  nextDataSortStateFromMenuItem,
  TABLE_SORT_DIRECTION_ASC,
  TABLE_SORT_DIRECTION_DESC,
  dataSortFields,
  dataSortMenuSections,
  dataSortStatesEqual,
} from '../src/wc/components/DataSort/data-sort-menu';

const columns: TableColumn[] = [
  { id: 'preview', label: 'Preview' },
  {
    id: 'behaviorDetails',
    label: 'Behavior / Severity',
    segments: [
      { label: 'Behavior', sortKey: 'behavior', separator: '/' },
      { label: 'Level', dataLabel: 'Severity', sortKey: 'severity' },
    ],
    sortable: true,
  },
  { id: 'status', label: 'State', dataLabel: 'Status', sortable: true },
  { id: 'action', kind: 'action', label: '', accessibleLabel: 'Action' },
];

test('lists sortable columns and compound header segments, skipping action columns', () => {
  assert.deepEqual(dataSortFields(columns), [
    { id: 'behavior', label: 'Behavior' },
    { id: 'severity', label: 'Severity' },
    { id: 'status', label: 'Status' },
  ]);
});

test('builds Data and Order menu sections from the controlled sort', () => {
  const sections = dataSortMenuSections(columns, { fieldId: 'severity', direction: 'desc' });
  assert.deepEqual(
    sections.map(section => section.header),
    ['Data', 'Order']
  );
  assert.equal(sections[0]?.items.find(item => item.label === 'Severity')?.isSelected, true);
  assert.equal(
    sections[1]?.items.find(item => item.value === TABLE_SORT_DIRECTION_DESC)?.isSelected,
    true
  );
});

test('changes field while keeping direction and does not toggle the active field', () => {
  const current = { fieldId: 'behavior', direction: 'desc' as const };
  const sections = dataSortMenuSections(columns, current);
  const status = sections[0]?.items.find(item => item.label === 'Status');
  const behavior = sections[0]?.items.find(item => item.label === 'Behavior');
  assert.ok(status);
  assert.ok(behavior);
  assert.deepEqual(nextDataSortStateFromMenuItem(columns, current, status), {
    fieldId: 'status',
    direction: 'desc',
  });
  assert.deepEqual(nextDataSortStateFromMenuItem(columns, current, behavior), current);
  assert.deepEqual(nextDataSortStateFromMenuItem(columns, null, status), {
    fieldId: 'status',
    direction: 'asc',
  });
});

test('applies direction to the current field or the first sortable field', () => {
  const current = { fieldId: 'status', direction: 'asc' as const };
  assert.deepEqual(
    nextDataSortStateFromMenuItem(columns, current, {
      label: 'Descending',
      value: TABLE_SORT_DIRECTION_DESC,
    }),
    { fieldId: 'status', direction: 'desc' }
  );
  assert.deepEqual(
    nextDataSortStateFromMenuItem(columns, null, {
      label: 'Ascending',
      value: TABLE_SORT_DIRECTION_ASC,
    }),
    { fieldId: 'behavior', direction: 'asc' }
  );
  assert.deepEqual(
    nextDataSortStateFromMenuItem(
      columns,
      { fieldId: 'removed', direction: 'asc' },
      {
        label: 'Descending',
        value: TABLE_SORT_DIRECTION_DESC,
      }
    ),
    { fieldId: 'behavior', direction: 'desc' }
  );
});

test('keeps application column ids separate from direction command values', () => {
  const collidingColumns: TableColumn[] = [
    { id: TABLE_SORT_DIRECTION_DESC, label: 'Direction data', sortable: true },
  ];
  const fieldItem = dataSortMenuSections(collidingColumns, null)[0]?.items[0];
  assert.ok(fieldItem);
  assert.notEqual(fieldItem.value, TABLE_SORT_DIRECTION_DESC);
  assert.deepEqual(nextDataSortStateFromMenuItem(collidingColumns, null, fieldItem), {
    fieldId: TABLE_SORT_DIRECTION_DESC,
    direction: 'asc',
  });
});

test('compares sort states by column and direction', () => {
  assert.equal(
    dataSortStatesEqual(
      { fieldId: 'status', direction: 'asc' },
      { fieldId: 'status', direction: 'asc' }
    ),
    true
  );
  assert.equal(
    dataSortStatesEqual(
      { fieldId: 'status', direction: 'asc' },
      { fieldId: 'status', direction: 'desc' }
    ),
    false
  );
  assert.equal(dataSortStatesEqual(null, null), true);
});

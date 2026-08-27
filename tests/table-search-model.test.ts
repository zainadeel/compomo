import assert from 'node:assert/strict';
import test from 'node:test';
import {
  availableTableSearchFields,
  filterTableSearchFields,
  nextTableSearchActiveIndex,
  selectedTableSearchFields,
  tableSearchFields,
} from '../src/wc/components/TableSearch/table-search-model';

const columns = [
  {
    id: 'driverDetails',
    header: 'Driver name / ID',
    headerSegments: [
      { label: 'Driver name', dataLabel: 'Driver name', sortKey: 'driverName', separator: '/' },
      { label: 'ID', dataLabel: 'Driver ID', sortKey: 'driverId' },
    ],
  },
  { id: 'location', header: 'Place', dataLabel: 'Location' },
  { id: 'preview', header: 'Preview', searchable: false },
  { id: 'actions', kind: 'action' as const, header: '', headerLabel: 'Actions' },
];
const fields = tableSearchFields(columns);

test('derives complete data-point labels and skips non-searchable and action columns', () => {
  assert.deepEqual(fields, [
    { id: 'driverName', label: 'Driver name' },
    { id: 'driverId', label: 'Driver ID' },
    { id: 'location', label: 'Location' },
  ]);
});

test('resolves controlled selections in selected order and removes them from the menu', () => {
  assert.deepEqual(selectedTableSearchFields(fields, ['driverId', 'unknown', 'driverName']), [
    { id: 'driverId', label: 'Driver ID' },
    { id: 'driverName', label: 'Driver name' },
  ]);
  assert.deepEqual(availableTableSearchFields(fields, ['driverId', 'driverName']), [
    { id: 'location', label: 'Location' },
  ]);
});

test('wraps active field traversal in either direction', () => {
  assert.equal(nextTableSearchActiveIndex(0, 3, 1), 1);
  assert.equal(nextTableSearchActiveIndex(2, 3, 1), 0);
  assert.equal(nextTableSearchActiveIndex(0, 3, -1), 2);
  assert.equal(nextTableSearchActiveIndex(4, 3, 1), 1);
  assert.equal(nextTableSearchActiveIndex(0, 0, 1), -1);
});

test('filters field-picker choices by complete label or canonical identity', () => {
  assert.deepEqual(filterTableSearchFields(fields, 'driver'), [
    { id: 'driverName', label: 'Driver name' },
    { id: 'driverId', label: 'Driver ID' },
  ]);
  assert.deepEqual(filterTableSearchFields(fields, 'Name'), [
    { id: 'driverName', label: 'Driver name' },
  ]);
  assert.deepEqual(filterTableSearchFields(fields, 'location'), [
    { id: 'location', label: 'Location' },
  ]);
  assert.deepEqual(filterTableSearchFields(fields, 'missing'), []);
  assert.deepEqual(filterTableSearchFields(fields, '  '), fields);
});

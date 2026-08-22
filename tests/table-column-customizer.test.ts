import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canToggleTableColumnHidden,
  isTableActionColumn,
  moveTableColumnInOrder,
  moveTableColumnOrder,
  resolveTableColumnOrder,
  resolveTableHiddenColumnIds,
  resolveTableVisibleColumns,
  tableColumnCustomizerItems,
  tableColumnCustomizerLabel,
  tableColumnCustomizerMenuItems,
  toggleTableColumnHidden,
} from '../src/wc/components/Table/table-column-customizer';
import type { TableColumn } from '../src/wc/components/Table/table-types';

const columns: TableColumn[] = [
  { id: 'driver', header: 'Driver' },
  { id: 'status', header: 'Status' },
  { id: 'vehicle', header: 'Vehicle' },
  { id: 'action', kind: 'action', header: '', headerLabel: 'Action' },
];

test('labels prefer a visible header, then headerLabel, then id', () => {
  assert.equal(tableColumnCustomizerLabel(columns[0]), 'Driver');
  assert.equal(tableColumnCustomizerLabel(columns[3]), 'Action');
  assert.equal(tableColumnCustomizerLabel({ id: 'notes', header: '  ' }), 'notes');
});

test('treats kind action as a non-data column', () => {
  assert.equal(isTableActionColumn(columns[0]), false);
  assert.equal(isTableActionColumn(columns[3]), true);
});

test('resolves data-column order and ignores action, unknown, and duplicate ids', () => {
  assert.deepEqual(
    resolveTableColumnOrder(columns, ['vehicle', 'action', 'missing', 'vehicle', 'driver']),
    ['vehicle', 'driver', 'status']
  );
  assert.deepEqual(resolveTableColumnOrder(columns, undefined), ['driver', 'status', 'vehicle']);
});

test('strips action ids from hidden state and keeps one data column visible', () => {
  assert.deepEqual(
    resolveTableHiddenColumnIds(columns, ['status', 'action', 'missing', 'status']),
    ['status']
  );
  assert.deepEqual(
    resolveTableHiddenColumnIds(columns, ['driver', 'status', 'vehicle', 'action']),
    ['status', 'vehicle']
  );
});

test('passes columns through until the customizer is opted in', () => {
  assert.deepEqual(
    resolveTableVisibleColumns(columns, {
      hiddenColumnIds: ['status'],
      columnOrder: ['vehicle', 'driver'],
    }).map(column => column.id),
    ['driver', 'status', 'vehicle', 'action']
  );
});

test('renders data columns in order minus hidden, then locked action columns', () => {
  assert.deepEqual(
    resolveTableVisibleColumns(columns, {
      columnCustomizer: true,
      hiddenColumnIds: ['status'],
      columnOrder: ['vehicle', 'driver'],
    }).map(column => column.id),
    ['vehicle', 'driver', 'action']
  );
});

test('refuses to hide action columns or the last visible data column', () => {
  assert.equal(canToggleTableColumnHidden(columns, [], 'action'), false);
  assert.equal(canToggleTableColumnHidden(columns, ['driver', 'status'], 'vehicle'), false);
  assert.equal(canToggleTableColumnHidden(columns, ['driver', 'status'], 'driver'), true);
  assert.deepEqual(toggleTableColumnHidden(columns, [], 'action'), []);
  assert.deepEqual(toggleTableColumnHidden(columns, ['driver', 'status'], 'vehicle'), [
    'driver',
    'status',
  ]);
  assert.deepEqual(toggleTableColumnHidden(columns, [], 'status'), ['status']);
  assert.deepEqual(toggleTableColumnHidden(columns, ['status'], 'status'), []);
});

test('reorders data columns without moving unknown ids', () => {
  assert.deepEqual(moveTableColumnOrder(['driver', 'status', 'vehicle'], 'vehicle', 'driver'), [
    'vehicle',
    'driver',
    'status',
  ]);
  assert.deepEqual(moveTableColumnInOrder(['driver', 'status', 'vehicle'], 'status', -1), [
    'status',
    'driver',
    'vehicle',
  ]);
  assert.deepEqual(moveTableColumnInOrder(['driver', 'status', 'vehicle'], 'driver', -1), [
    'driver',
    'status',
    'vehicle',
  ]);
});

test('lists only data columns for the customizer', () => {
  const items = tableColumnCustomizerItems(columns, ['status'], ['vehicle', 'driver']);
  assert.deepEqual(
    items.map(item => ({
      id: item.column.id,
      visible: item.visible,
      hideable: item.hideable,
      reorderable: item.reorderable,
      label: item.label,
    })),
    [
      { id: 'vehicle', visible: true, hideable: true, reorderable: true, label: 'Vehicle' },
      { id: 'driver', visible: true, hideable: true, reorderable: true, label: 'Driver' },
      { id: 'status', visible: false, hideable: true, reorderable: true, label: 'Status' },
    ]
  );
});

test('maps customizer rows to menu switch items', () => {
  assert.deepEqual(tableColumnCustomizerMenuItems(columns, ['status'], ['vehicle', 'driver']), [
    {
      label: 'Vehicle',
      value: 'vehicle',
      showSwitch: true,
      switchValue: true,
      isInactive: false,
      reorderable: true,
    },
    {
      label: 'Driver',
      value: 'driver',
      showSwitch: true,
      switchValue: true,
      isInactive: false,
      reorderable: true,
    },
    {
      label: 'Status',
      value: 'status',
      showSwitch: true,
      switchValue: false,
      isInactive: false,
      reorderable: true,
    },
  ]);
});

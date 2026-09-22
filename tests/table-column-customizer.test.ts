import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canToggleTableColumnHidden,
  isTableActionColumn,
  moveTableColumnInOrder,
  moveTableColumnOrder,
  reorderTableColumnPartition,
  resolveTableConfiguredColumnOrder,
  resolveTableColumnOrder,
  resolveTableFieldsConfiguration,
  resolveTableHiddenColumnIds,
  resolveTablePinnedFieldIds,
  resolveTableVisibleColumns,
  tableColumnCustomizerItems,
  tableColumnCustomizerLabel,
  tableColumnCustomizerMenuItems,
  tableColumnCustomizerSections,
  toggleTableColumnHidden,
  toggleTableColumnPinned,
} from '../src/wc/components/Table/table-column-customizer';
import type { TableColumn } from '../src/wc/components/Table/table-types';

const columns: TableColumn[] = [
  { id: 'driver', label: 'Driver', size: 'sm' },
  { id: 'status', label: 'Status', size: 'sm' },
  { id: 'vehicle', label: 'Vehicle', size: 'sm' },
  { id: 'action', kind: 'action', label: '', accessibleLabel: 'Action' },
];

test('labels prefer a visible label, then accessibleLabel, then id', () => {
  assert.equal(tableColumnCustomizerLabel(columns[0]), 'Driver');
  assert.equal(tableColumnCustomizerLabel(columns[3]), 'Action');
  assert.equal(tableColumnCustomizerLabel({ id: 'notes', label: '  ' }), 'notes');
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
      hiddenFieldIds: ['status'],
      fieldOrder: ['vehicle', 'driver'],
    }).map(column => column.id),
    ['driver', 'status', 'vehicle', 'action']
  );
});

test('renders data columns in order minus hidden, then locked action columns', () => {
  assert.deepEqual(
    resolveTableVisibleColumns(columns, {
      columnCustomizer: true,
      hiddenFieldIds: ['status'],
      fieldOrder: ['vehicle', 'driver'],
    }).map(column => column.id),
    ['vehicle', 'driver', 'action']
  );
});

test('forces user-pinned columns left and preserves pin state while hidden', () => {
  const visible = resolveTableVisibleColumns(columns, {
    columnCustomizer: true,
    hiddenFieldIds: ['status'],
    fieldOrder: ['vehicle', 'driver', 'status'],
    pinnedFieldIds: ['status', 'driver'],
  });
  assert.deepEqual(
    visible.map(column => [column.id, column.sticky]),
    [
      ['driver', 'start'],
      ['vehicle', undefined],
      ['action', undefined],
    ]
  );
  assert.deepEqual(resolveTablePinnedFieldIds(columns, ['status', 'driver'], []), [
    'driver',
    'status',
  ]);
});

test('pins at the end of the pinned block and unpins at the start of unpinned columns', () => {
  const pinned = toggleTableColumnPinned(
    columns,
    [],
    ['driver', 'status', 'vehicle'],
    ['driver'],
    'vehicle'
  );
  assert.deepEqual(pinned, {
    hiddenFieldIds: [],
    fieldOrder: ['driver', 'vehicle', 'status'],
    pinnedFieldIds: ['driver', 'vehicle'],
  });

  const unpinned = toggleTableColumnPinned(
    columns,
    pinned.hiddenFieldIds,
    pinned.fieldOrder,
    pinned.pinnedFieldIds,
    'driver'
  );
  assert.deepEqual(unpinned, {
    hiddenFieldIds: [],
    fieldOrder: ['vehicle', 'driver', 'status'],
    pinnedFieldIds: ['vehicle'],
  });
});

test('normalizes pin membership and reorders only within one pin partition', () => {
  assert.deepEqual(
    resolveTableConfiguredColumnOrder(columns, ['vehicle', 'driver', 'status'], ['status']),
    ['status', 'vehicle', 'driver']
  );
  assert.deepEqual(
    resolveTableFieldsConfiguration(
      columns,
      ['missing'],
      ['vehicle', 'driver', 'status'],
      ['missing', 'status']
    ),
    {
      hiddenFieldIds: [],
      fieldOrder: ['status', 'vehicle', 'driver'],
      pinnedFieldIds: ['status'],
    }
  );

  assert.deepEqual(
    reorderTableColumnPartition(
      columns,
      [],
      ['driver', 'status', 'vehicle'],
      ['driver', 'status'],
      ['status', 'driver']
    ),
    {
      hiddenFieldIds: [],
      fieldOrder: ['status', 'driver', 'vehicle'],
      pinnedFieldIds: ['status', 'driver'],
    }
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
      pinned: item.pinned,
      pinnable: item.pinnable,
      label: item.label,
    })),
    [
      {
        id: 'vehicle',
        visible: true,
        hideable: true,
        reorderable: true,
        pinned: false,
        pinnable: true,
        label: 'Vehicle',
      },
      {
        id: 'driver',
        visible: true,
        hideable: true,
        reorderable: true,
        pinned: false,
        pinnable: true,
        label: 'Driver',
      },
      {
        id: 'status',
        visible: false,
        hideable: true,
        reorderable: true,
        pinned: false,
        pinnable: true,
        label: 'Status',
      },
    ]
  );
});

test('maps customizer rows to independent visibility and pin actions', () => {
  assert.deepEqual(tableColumnCustomizerMenuItems(columns, ['status'], ['vehicle', 'driver']), [
    {
      label: 'Vehicle',
      value: 'vehicle',
      reorderable: true,
      reorderHandleInactive: false,
      trailingActions: [
        { id: 'visibility', icon: 'EyeStrikethrough', label: 'Hide Vehicle', isInactive: false },
        { id: 'pin', icon: 'Pin', label: 'Pin Vehicle' },
      ],
    },
    {
      label: 'Driver',
      value: 'driver',
      reorderable: true,
      reorderHandleInactive: false,
      trailingActions: [
        { id: 'visibility', icon: 'EyeStrikethrough', label: 'Hide Driver', isInactive: false },
        { id: 'pin', icon: 'Pin', label: 'Pin Driver' },
      ],
    },
    {
      label: 'Status',
      value: 'status',
      reorderable: true,
      reorderHandleInactive: false,
      trailingActions: [
        {
          id: 'visibility',
          icon: 'Eye',
          label: 'Show Status',
          isInactive: false,
        },
        { id: 'pin', icon: 'Pin', label: 'Pin Status' },
      ],
    },
  ]);
});

test('separates pinned and unpinned menu sections and disables a lone pinned drag handle', () => {
  const sections = tableColumnCustomizerSections(columns, [], [], ['status']);
  assert.deepEqual(
    sections.map(section => ({
      header: section.header,
      subheader: section.subheader,
      insetDividerBefore: section.insetDividerBefore,
      ids: section.items.map(item => item.value),
      reorderable: section.items.map(item => item.reorderable),
      reorderHandleInactive: section.items.map(item => item.reorderHandleInactive),
    })),
    [
      {
        header: 'Columns',
        subheader: 'Pinned columns',
        insetDividerBefore: undefined,
        ids: ['status'],
        reorderable: [false],
        reorderHandleInactive: [true],
      },
      {
        header: undefined,
        subheader: 'Other columns',
        insetDividerBefore: true,
        ids: ['driver', 'vehicle'],
        reorderable: [true, true],
        reorderHandleInactive: [false, false],
      },
    ]
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  tablePinnedColumns,
  tableHeaderBands,
  tableSpanModel,
} from '../src/wc/components/Table/table-structure';
import {
  tableGridModel,
  tableRangeBounds,
  tablePasteChanges,
  tableEditValue,
  tableNextEditable,
} from '../src/wc/components/Table/table-grid-model';
import type { TableColumn, TableRow } from '../src/wc/components/Table/table-types';

const columns: TableColumn[] = [
  { id: 'a', label: 'A', size: 100, sticky: 'start', group: { id: 'identity', label: 'Identity' } },
  { id: 'b', label: 'B', size: 120, sticky: 'start', group: { id: 'identity', label: 'Identity' } },
  { id: 'c', label: 'C', size: 140, editor: { type: 'number', min: 0, max: 100 } },
  { id: 'd', label: 'D', size: 80, sticky: 'end', editor: { type: 'text', required: true } },
  { id: 'e', label: 'E', size: 40, sticky: 'end' },
];
const rows: TableRow[] = [
  { id: 'r1', cells: { a: 'A', b: 'B', c: 10, d: 'One', e: '' } },
  { id: 'r2', cells: { a: 'A', b: 'B', c: 20, d: 'Two', e: '' } },
];
test('shared cell editors validate canonical scalar values and constrained choices', () => {
  const value = (text: string, editor: TableColumn['editor']) =>
    tableEditValue(text, { id: 'x', label: 'X', editor });
  assert.equal(
    value('In transit', { type: 'select', options: [{ value: 'In transit', label: 'On route' }] }),
    'In transit'
  );
  assert.equal(value('missing', { type: 'select', options: [] }), undefined);
  assert.equal(
    value('blocked', {
      type: 'select',
      options: [{ value: 'blocked', label: 'Blocked', isInactive: true }],
    }),
    undefined
  );
  assert.equal(value('2026-09-21', { type: 'date', min: '2026-09-20' }), '2026-09-21');
  assert.equal(value('2026-02-30', { type: 'date' }), undefined);
  assert.equal(value('2026-09-19', { type: 'date', min: '2026-09-20' }), undefined);
  assert.equal(value('2:30 PM', { type: 'time', step: 900 }), '14:30');
  assert.equal(value('14:31', { type: 'time', step: 900 }), undefined);
  assert.equal(value('line one\nline two', { type: 'textarea' }), 'line one\nline two');
  assert.equal(value('too long', { type: 'textarea', maxLength: 3 }), undefined);
  assert.equal(value('12', { type: 'number', min: 10, step: 5 }), undefined);
  assert.equal(value('15', { type: 'number', min: 10, step: 5 }), 15);
});
test('pinned offsets include selection and accumulate in visible order at both edges', () => {
  const pins = tablePinnedColumns(columns, true);
  assert.equal(
    pins.get('a')?.style['--_table-pin-offset'],
    'calc(var(--_table-selection-column-inline-size))'
  );
  assert.equal(
    pins.get('b')?.style['--_table-pin-offset'],
    'calc(var(--_table-selection-column-inline-size) + 100px)'
  );
  assert.equal(pins.get('a')?.edge, undefined);
  assert.equal(pins.get('b')?.edge, 'start');
  assert.equal(pins.get('d')?.style['--_table-pin-offset'], 'calc(40px)');
  assert.equal(pins.get('e')?.edge, undefined);
  assert.equal(
    tablePinnedColumns([columns[1]], false).get('b')?.style['--_table-pin-offset'],
    '0px'
  );
  assert.equal(tablePinnedColumns([{ id: 'x', label: 'X', sticky: 'start' }], false).size, 0);
});
test('superheaders split around spacer, missing members and reordered unrelated columns', () => {
  const bands = tableHeaderBands(columns, true, 3);
  assert.equal(bands[1].span, 2);
  assert.equal(
    bands.reduce((n, band) => n + band.span, 0),
    7
  );
  assert.deepEqual(
    tableHeaderBands([columns[0], columns[2], columns[1]], false).map(band => band.span),
    [1, 1, 1]
  );
  assert.equal(tableHeaderBands([columns[1]], false)[0].span, 1);
});
const options = { windowed: false, grouped: false, grid: false, selectable: true };
test('merges use row and field identities without changing values or merging the selection lane', () => {
  const result = tableSpanModel(
    [{ rowIds: ['r1', 'r2'], columnIds: ['a', 'b'] }],
    rows,
    columns,
    options
  );
  assert.deepEqual(result.issues, []);
  assert.equal(result.hasRowSpans, true);
  assert.deepEqual(result.cells.get('r1')?.get('a'), {
    rowSpan: 2,
    colSpan: 2,
    columnStart: 2,
    columnIds: ['a', 'b'],
  });
  assert.equal(result.cells.get('r2')?.get('b'), 'covered');
  assert.equal(rows[1].cells.b, 'B');
});
test('invalid and overlapping merges preserve uncovered data', () => {
  for (const bad of [
    { rowIds: ['r2', 'r1'], columnIds: ['a'] },
    { rowIds: ['missing'], columnIds: ['a'] },
    { rowIds: ['r1'], columnIds: ['b', 'c'] },
    { rowIds: ['r1'], columnIds: ['a', 'a'] },
    { rowIds: [], columnIds: ['a'] },
  ])
    assert.equal(tableSpanModel([bad], rows, columns, options).cells.size, 0);
  const span = { rowIds: ['r1', 'r2'], columnIds: ['a'] };
  assert.equal(tableSpanModel([span], rows, columns, { ...options, windowed: true }).cells.size, 0);
  assert.equal(tableSpanModel([span], rows, columns, { ...options, grid: true }).cells.size, 0);
  assert.equal(tableSpanModel([span], rows, columns, { ...options, grouped: true }).cells.size, 0);
  assert.equal(tableSpanModel([span, span], rows, columns, options).issues.length, 1);
  assert.equal(
    tableSpanModel(
      [{ rowIds: ['r1'], columnIds: ['a', 'b'] }],
      rows,
      columns.map(column => (column.id === 'b' ? { ...column, size: undefined } : column)),
      options
    ).cells.size,
    0
  );
});
test('grid ranges follow stable identities and paste is bounded, typed, validated and atomic', () => {
  const model = tableGridModel(rows, columns);
  assert.deepEqual(
    tableRangeBounds(model, {
      anchor: { rowId: 'r2', columnId: 'd' },
      focus: { rowId: 'r1', columnId: 'c' },
    }),
    { firstRow: 0, lastRow: 1, firstColumn: 2, lastColumn: 3 }
  );
  const address = { rowId: 'r1', columnId: 'c' };
  assert.equal(tablePasteChanges(model, address, '30\tUpdated\r\n40\tOther\r\n')?.length, 4);
  for (const text of ['101\tNo', 'x\tNo', '3\tYes\n4', '3\t', '3\tYes\textra'])
    assert.equal(tablePasteChanges(model, address, text), null);
  assert.equal(tableEditValue('', columns[2]), null);
  assert.equal(tableEditValue('3.5', columns[2]), 3.5);
  assert.equal(
    tablePasteChanges(tableGridModel([{ ...rows[0], disabled: true }], columns), address, '30'),
    null
  );
  assert.equal(rows[0].cells.c, 10);
});

test('worksheet navigation skips read-only columns and disabled rows without wrapping arrows', () => {
  const model = tableGridModel(
    [rows[0], { ...rows[1], disabled: true }, { ...rows[1], id: 'r3' }],
    columns
  );
  assert.deepEqual(model.firstEditable, { rowId: 'r1', columnId: 'c' });
  assert.equal(tableNextEditable(model, { rowId: 'r1', columnId: 'c' }, 'ArrowLeft'), null);
  assert.deepEqual(tableNextEditable(model, { rowId: 'r1', columnId: 'c' }, 'ArrowDown'), {
    rowId: 'r3',
    columnId: 'c',
  });
  assert.deepEqual(tableNextEditable(model, { rowId: 'r1', columnId: 'c' }, 'End'), {
    rowId: 'r1',
    columnId: 'd',
  });
  assert.deepEqual(tableNextEditable(model, { rowId: 'r1', columnId: 'd' }, 'Home'), {
    rowId: 'r1',
    columnId: 'c',
  });
  assert.deepEqual(tableNextEditable(model, { rowId: 'r1', columnId: 'd' }, 'Tab'), {
    rowId: 'r3',
    columnId: 'c',
  });
  assert.deepEqual(tableNextEditable(model, { rowId: 'r3', columnId: 'c' }, 'Tab', true), {
    rowId: 'r1',
    columnId: 'd',
  });
  assert.equal(tableNextEditable(model, { rowId: 'r3', columnId: 'd' }, 'Tab'), null);
  assert.equal(
    tableGridModel(
      rows,
      columns.filter(column => !column.editor)
    ).firstEditable,
    null
  );
});

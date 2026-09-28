import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTableEditingController,
  type TableEditingState,
} from '../src/wc/components/Table/table-editing-controller';
import type { TableCellRange, TableColumn, TableRow } from '../src/wc/components/Table/table-types';

function fixture() {
  const columns: TableColumn[] = [
    { id: 'id', label: 'Record' },
    { id: 'name', label: 'Name', editor: { type: 'text' } },
    { id: 'count', label: 'Count', editor: { type: 'number' } },
  ];
  const rows: TableRow[] = [
    { id: 'one', cells: { id: '1', name: 'First', count: 1 } },
    { id: 'two', cells: { id: '2', name: 'Second', count: 2 }, disabled: true },
    { id: 'three', cells: { id: '3', name: 'Third', count: 3 } },
  ];
  const state = {
    columns,
    rows,
    mode: 'grid' as 'table' | 'edit' | 'grid',
    loading: false,
    cellRange: null as TableCellRange | null,
  };
  let interaction: TableEditingState = { activeCell: null, editingCell: null };
  const ranges: TableCellRange[] = [];
  const controller = createTableEditingController({
    host: () => ({ isConnected: true }) as HTMLElement,
    state: () => state,
    interaction: () => interaction,
    change: patch => {
      interaction = { ...interaction, ...patch };
    },
    rangeChange: range => ranges.push(range),
    cellsChange: () => assert.fail('Range selection must not propose cell edits'),
    announce: () => {},
    focusRow: () => {},
    revealRow: async () => true,
    findRow: () => null,
  });
  const select = (row: TableRow, column: TableColumn) => {
    const target = { focus() {} };
    const onClick = controller.cellAttributes(row, column).onClick as (event: MouseEvent) => void;
    onClick({
      target,
      currentTarget: target,
      shiftKey: true,
      stopPropagation() {},
    } as unknown as MouseEvent);
  };
  return { controller, state, rows, columns, ranges, select };
}

test('grid range intent stays controlled and excludes read-only and disabled cells', () => {
  const { controller, state, rows, columns, ranges, select } = fixture();
  select(rows[0], columns[1]);
  assert.equal(state.cellRange, null);
  assert.equal(controller.cellAttributes(rows[0], columns[1])['aria-selected'], 'false');
  state.cellRange = ranges[0];
  select(rows[2], columns[2]);
  assert.deepEqual(ranges[1], {
    anchor: { rowId: 'one', columnId: 'name' },
    focus: { rowId: 'three', columnId: 'count' },
  });
  state.cellRange = ranges[1];
  assert.equal(controller.cellAttributes(rows[2], columns[2])['aria-selected'], 'true');
  for (const [row, column] of [
    [rows[1], columns[1]],
    [rows[0], columns[0]],
  ]) {
    select(row as TableRow, column as TableColumn);
    const attrs = controller.cellAttributes(row as TableRow, column as TableColumn);
    assert.equal(attrs['aria-selected'], 'false');
    assert.equal(attrs['aria-readonly'], 'true');
    assert.equal(attrs.tabIndex, undefined);
  }
  assert.equal(ranges.length, 2);
});

test('grid focus adapts to the current column order, removed columns and loading state', () => {
  const { controller, state, rows, columns, select } = fixture();
  assert.equal(controller.cellAttributes(rows[0], columns[1]).tabIndex, 0);
  select(rows[2], columns[2]);
  assert.equal(controller.cellAttributes(rows[2], columns[2]).tabIndex, 0);
  state.columns = [columns[0], columns[1]];
  assert.equal(controller.cellAttributes(rows[0], columns[1]).tabIndex, 0);
  state.loading = true;
  assert.equal(controller.cellAttributes(rows[0], columns[1]).tabIndex, undefined);
  assert.equal(controller.cellAttributes(rows[0], columns[1])['data-cell-editable'], 'false');
  state.loading = false;
  state.mode = 'edit';
  assert.equal(controller.enabled, true);
  assert.equal(controller.gridEnabled, false);
  assert.equal(controller.cellAttributes(rows[0], columns[1]).role, undefined);
  state.mode = 'table';
  assert.equal(controller.enabled, false);
});

import type {
  TableCellAddress,
  TableCellRange,
  TableCellsChangeDetail,
  TableColumn,
  TableRow,
} from './table-types';
import { parseLooseCalendarDate } from '../../utils/date-filter-value';
import { parseLooseClockTime, isClockTimeStepAligned } from '../../utils/clock-time';

/** Snapshot-local index; arrow navigation and visible-cell range checks are constant time. */
export function tableGridModel(rows: TableRow[], columns: TableColumn[]) {
  let firstEditable: TableCellAddress | null = null;
  for (const row of rows) {
    const column = columns.find(column => tableEditable(row, column));
    if (column) {
      firstEditable = { rowId: row.id, columnId: column.id };
      break;
    }
  }
  return {
    firstEditable,
    rows,
    columns,
    rowIndices: new Map(rows.map((row, index) => [row.id, index])),
    columnIndices: new Map(columns.map((column, index) => [column.id, index])),
  };
}
export type TableGridModel = ReturnType<typeof tableGridModel>;

/** Scan only on navigation, not render/scroll; read-only cells are never focus stops. */
export function tableNextEditable(
  model: TableGridModel,
  address: TableCellAddress,
  key: string,
  backwards = false
): TableCellAddress | null {
  let ri = model.rowIndices.get(address.rowId),
    ci = model.columnIndices.get(address.columnId);
  if (ri == null || ci == null) return null;
  let dr = 0,
    dc = 0;
  if (key === 'ArrowDown') dr = 1;
  else if (key === 'ArrowUp') dr = -1;
  else if (key === 'ArrowRight') dc = 1;
  else if (key === 'ArrowLeft') dc = -1;
  else if (key === 'Home') {
    ci = -1;
    dc = 1;
  } else if (key === 'End') {
    ci = model.columns.length;
    dc = -1;
  } else if (key === 'Tab') dc = backwards ? -1 : 1;
  else return null;
  while (true) {
    ri += dr;
    ci += dc;
    if (key === 'Tab') {
      if (ci < 0) {
        ri--;
        ci = model.columns.length - 1;
      } else if (ci >= model.columns.length) {
        ri++;
        ci = 0;
      }
    }
    const row = model.rows[ri],
      column = model.columns[ci];
    if (!row || !column) return null;
    if (tableEditable(row, column)) return { rowId: row.id, columnId: column.id };
  }
}

export function tableRangeBounds(model: TableGridModel, range: TableCellRange | null) {
  if (!range) return null;
  const r1 = model.rowIndices.get(range.anchor.rowId),
    r2 = model.rowIndices.get(range.focus.rowId);
  const c1 = model.columnIndices.get(range.anchor.columnId),
    c2 = model.columnIndices.get(range.focus.columnId);
  if (r1 == null || r2 == null || c1 == null || c2 == null) return null;
  return {
    firstRow: Math.min(r1, r2),
    lastRow: Math.max(r1, r2),
    firstColumn: Math.min(c1, c2),
    lastColumn: Math.max(c1, c2),
  };
}

export function tableEditable(row: TableRow, column: TableColumn): boolean {
  const value = row.cells[column.id];
  return (
    !!column.editor &&
    column.kind !== 'action' &&
    !row.disabled &&
    (value == null || typeof value === 'string' || typeof value === 'number')
  );
}

export function tableEditValue(
  text: string,
  column: TableColumn
): string | number | null | undefined {
  const editor = column.editor;
  if (!editor || (editor.required && !text.trim())) return undefined;
  if (editor.type === 'text' || editor.type === 'textarea')
    return (editor.minLength == null || !text || text.length >= editor.minLength) &&
      (editor.maxLength == null || text.length <= editor.maxLength)
      ? text
      : undefined;
  if (editor.type === 'select')
    return !text || editor.options.some(option => option.value === text && !option.isInactive)
      ? text
      : undefined;
  if (editor.type === 'date' || editor.type === 'time') {
    if (!text.trim()) return '';
    const value = editor.type === 'date' ? parseLooseCalendarDate(text) : parseLooseClockTime(text);
    return value &&
      (!editor.min || value >= editor.min) &&
      (!editor.max || value <= editor.max) &&
      (editor.type !== 'time' || isClockTimeStepAligned(value, editor.step ?? 60, editor.min))
      ? value
      : undefined;
  }
  if (editor.type !== 'number') return undefined;
  if (!text.trim()) return null;
  const value = Number(text);
  return Number.isFinite(value) &&
    (editor.min == null || value >= editor.min) &&
    (editor.max == null || value <= editor.max) &&
    (editor.step == null ||
      editor.step <= 0 ||
      Math.abs(
        (value - (editor.min ?? 0)) / editor.step -
          Math.round((value - (editor.min ?? 0)) / editor.step)
      ) < 1e-8)
    ? value
    : undefined;
}

/** Plain TSV only, bounded and atomic: never partially apply invalid or read-only rectangles. */
export function tablePasteChanges(
  model: TableGridModel,
  address: TableCellAddress,
  text: string
): TableCellsChangeDetail['changes'] | null {
  if (text.length > 1_000_000) return null;
  const row = model.rowIndices.get(address.rowId),
    column = model.columnIndices.get(address.columnId);
  if (row == null || column == null) return null;
  const records = text
    .replace(/\r\n?/g, '\n')
    .replace(/\n$/, '')
    .split('\n')
    .map(line => line.split('\t'));
  const width = records[0].length;
  if (records.length * width > 10000 || records.some(record => record.length !== width))
    return null;
  const changes: TableCellsChangeDetail['changes'] = [];
  for (const [ri, record] of records.entries()) {
    for (const [ci, textValue] of record.entries()) {
      const targetRow = model.rows[row + ri],
        targetColumn = model.columns[column + ci];
      if (!targetRow || !targetColumn || !tableEditable(targetRow, targetColumn)) return null;
      const value = tableEditValue(textValue, targetColumn);
      if (value === undefined) return null;
      changes.push({ rowId: targetRow.id, columnId: targetColumn.id, value });
    }
  }
  return changes;
}

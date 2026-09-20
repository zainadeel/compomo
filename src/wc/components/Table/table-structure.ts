import { tableColumnSize } from './table-model';
import type { TableCellSpan, TableColumn, TableRow } from './table-types';

export interface TableColumnLayout {
  style: Record<string, string>;
  edge?: 'start' | 'end';
}

/** Column-only work. Never measure cells or scan rows while scrolling. */
export function tablePinnedColumns(columns: TableColumn[], selectable: boolean) {
  const result = new Map<string, TableColumnLayout>();
  for (const edge of ['start', 'end'] as const) {
    const pinned = columns.filter(column => column.sticky === edge && tableColumnSize(column));
    const ordered = edge === 'start' ? pinned : [...pinned].reverse();
    const sizes =
      edge === 'start' && selectable ? ['var(--_table-selection-column-inline-size)'] : [];
    for (const [index, column] of ordered.entries()) {
      result.set(column.id, {
        style: { '--_table-pin-offset': sizes.length ? `calc(${sizes.join(' + ')})` : '0px' },
        edge: index === ordered.length - 1 ? edge : undefined,
      });
      sizes.push(tableColumnSize(column)!);
    }
  }
  return result;
}

export interface TableHeaderBand {
  key: string;
  label?: string;
  start: number;
  span: number;
  firstColumnId?: string;
  lastColumnId?: string;
  sticky?: 'start' | 'end';
}

/** Split at visibility, reorder, selection, spacer and pin boundaries. Never span an unrelated column. */
export function tableHeaderBands(
  columns: TableColumn[],
  selectable: boolean,
  spacer?: number
): TableHeaderBand[] {
  if (!columns.some(column => column.group)) return [];
  const lanes: Array<TableColumn | undefined> = [...columns];
  if (spacer != null) lanes.splice(spacer, 0, undefined);
  if (selectable) lanes.unshift(undefined);
  const bands: TableHeaderBand[] = [];
  let previous: TableColumn | undefined;
  for (const [index, column] of lanes.entries()) {
    const group = column?.group;
    const last = bands[bands.length - 1];
    if (group && previous?.group?.id === group.id && previous.sticky === column?.sticky && last) {
      last.span++;
      last.lastColumnId = column?.id;
    } else {
      bands.push({
        key: `band-${index}`,
        label: group?.label,
        start: index + 1,
        span: 1,
        firstColumnId: column?.id,
        lastColumnId: column?.id,
        sticky: column?.sticky,
      });
    }
    previous = column;
  }
  return bands;
}

export type TableSpanCell =
  | { rowSpan: number; colSpan: number; columnStart: number; columnIds: string[] }
  | 'covered';
export interface TableSpanModel {
  cells: Map<string, Map<string, TableSpanCell>>;
  issues: string[];
  hasRowSpans: boolean;
}

/** Validate the complete rectangle before covering any cells. Invalid spans leave all data visible. */
export function tableSpanModel(
  spans: TableCellSpan[],
  rows: TableRow[],
  columns: TableColumn[],
  options: {
    windowed: boolean;
    grouped: boolean;
    grid: boolean;
    selectable: boolean;
    spacer?: number;
  }
): TableSpanModel {
  const result: TableSpanModel = { cells: new Map(), issues: [], hasRowSpans: false };
  if (!spans.length) return result;
  const rowIndex = new Map(rows.map((row, index) => [row.id, index]));
  const columnIndex = new Map(columns.map((column, index) => [column.id, index]));
  const contiguous = (ids: string[], indices: Map<string, number>) =>
    ids.length > 0 &&
    ids.every((id, index) => indices.get(id) === (indices.get(ids[0]) ?? -100000) + index);
  for (const [index, span] of spans.entries()) {
    if (
      !span ||
      !Array.isArray(span.rowIds) ||
      !Array.isArray(span.columnIds) ||
      !span.rowIds.every(id => typeof id === 'string') ||
      !span.columnIds.every(id => typeof id === 'string')
    ) {
      result.issues.push(
        `Merge ${index + 1} ignored: rowIds and columnIds must be identity arrays.`
      );
      continue;
    }
    const start = columnIndex.get(span.columnIds[0]) ?? -1;
    const end = start + span.columnIds.length;
    const sticky = columns[start]?.sticky;
    const invalid =
      options.grouped ||
      options.grid ||
      span.rowIds.length * span.columnIds.length > 10000 ||
      (options.windowed && span.rowIds.length > 1) ||
      !contiguous(span.rowIds, rowIndex) ||
      !contiguous(span.columnIds, columnIndex) ||
      (options.spacer != null && start < options.spacer && end > options.spacer) ||
      span.columnIds.some(id => columns[columnIndex.get(id)!]?.sticky !== sticky) ||
      (!!sticky && span.columnIds.some(id => !tableColumnSize(columns[columnIndex.get(id)!]))) ||
      span.rowIds.some(rowId => span.columnIds.some(id => result.cells.get(rowId)?.has(id)));
    if (invalid) {
      result.issues.push(
        `Merge ${index + 1} ignored: requires a non-overlapping contiguous rectangle, no pin/spacer crossing, no grouping/grid, and no virtual row span.`
      );
      continue;
    }
    result.hasRowSpans ||= span.rowIds.length > 1;
    for (const [ri, rowId] of span.rowIds.entries()) {
      const cells = result.cells.get(rowId) ?? new Map<string, TableSpanCell>();
      for (const [ci, id] of span.columnIds.entries()) {
        cells.set(
          id,
          ri === 0 && ci === 0
            ? {
                rowSpan: span.rowIds.length,
                colSpan: span.columnIds.length,
                columnStart:
                  start +
                  1 +
                  Number(options.selectable) +
                  Number(options.spacer != null && start >= options.spacer),
                columnIds: span.columnIds,
              }
            : 'covered'
        );
      }
      result.cells.set(rowId, cells);
    }
  }
  return result;
}

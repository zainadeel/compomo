import { resolveTableCellPresentation } from './table-cell-model';
import type { TableColumn, TableGroup, TableRow } from './table-types';

/**
 * Token-aligned body-row track contracts: 40 / 62 / 84, plus wrapping-secondary
 * 106. Estimates only; measured heights replace these after paint.
 */
export const TABLE_VIRTUAL_ROW_TRACK_SIZE = {
  1: 40,
  2: 62,
  3: 84,
  4: 106,
} as const;

export const TABLE_VIRTUAL_GROUP_HEADER_SIZE = TABLE_VIRTUAL_ROW_TRACK_SIZE[1];
export const TABLE_VIRTUAL_MIN_OVERSCAN_ROWS = 8;

export const TABLE_VIRTUAL_VIEWPORT_REQUIRED_HEADING = 'Bounded height required';
export const TABLE_VIRTUAL_VIEWPORT_REQUIRED_BODY =
  'Virtual mode requires height, maxHeight, or fitViewport.';

export const TABLE_VIRTUAL_TOTAL_SUMMARY_LABEL = '{total} items';

export type TableVirtualItemKind = 'group' | 'row';

export interface TableVirtualItem {
  kind: TableVirtualItemKind;
  id: string;
  groupId?: string;
  rowId?: string;
  estimatedSize: number;
  variableSize: boolean;
}

export type TableVirtualNode =
  | { kind: 'spacer'; size: number; key: string }
  | { kind: 'row'; index: number; item: TableVirtualItem }
  | {
      kind: 'group';
      groupId: string;
      headerIndex: number;
      nodes: Array<Extract<TableVirtualNode, { kind: 'spacer' | 'row' }>>;
    };

export interface TableVirtualPlan {
  totalSize: number;
  itemCount: number;
  start: number;
  end: number;
  nodes: TableVirtualNode[];
  mountedIds: ReadonlySet<string>;
  mountedIndexes: ReadonlySet<number>;
}

export interface FlattenTableVirtualItemsInput {
  grouped: boolean;
  rows: TableRow[];
  groups: TableGroup[];
  collapsedGroupIds: ReadonlySet<string> | readonly string[];
  columns: TableColumn[];
}

export interface ResolveTableVirtualPlanInput {
  items: readonly TableVirtualItem[];
  sizes: readonly number[];
  scrollOffset: number;
  viewportSize: number;
  pinnedRowIds?: ReadonlySet<string>;
}

export interface TableVirtualIndex {
  items: readonly TableVirtualItem[];
  sizes: readonly number[];
  prefix: readonly number[];
  itemCount: number;
  totalSize: number;
  grouped: boolean;
  groupHeaderIndexes: readonly number[];
  headerIndexByGroup: ReadonlyMap<string, number>;
  groupEndByHeader: ReadonlyMap<number, number>;
  rowIndexById: ReadonlyMap<string, number>;
  itemIndexById: ReadonlyMap<string, number>;
}

export interface ResolveTableVirtualIndexedPlanInput {
  scrollOffset: number;
  viewportSize: number;
  scrollDirection?: 'backward' | 'forward' | 'none';
  pinnedRowIds?: ReadonlySet<string>;
}

/** Map a cell recipe onto the named track stack used for first-paint estimates. */
export function estimateTableCellTrackCount(
  value: TableRow['cells'][string],
  column: TableColumn,
): number {
  return tableCellTrackCount(resolveTableCellPresentation(value, column));
}

function tableCellTrackCount(
  presentation: ReturnType<typeof resolveTableCellPresentation>,
): number {
  if (presentation.kind === 'image') {
    return presentation.variant === 'triple' ? 3 : presentation.variant === 'multi' ? 2 : 1;
  }
  if (presentation.kind === 'tag') {
    return presentation.variant === 'text-with-tag' ? 2 : 1;
  }
  if (presentation.kind !== 'text' && presentation.kind !== 'icon-text') return 1;

  const variantTracks = presentation.variant === 'triple'
    ? 3
    : presentation.variant === 'multi' || presentation.variant === 'primary-pair'
      ? 2
      : 1;
  if (!presentation.wraps) return variantTracks;
  if (presentation.lineClamp === 'none') {
    return presentation.kind === 'text' && !presentation.singleLine ? 4 : 3;
  }
  if (presentation.lineClamp === 3 && variantTracks >= 2) return 4;
  return Math.max(variantTracks, presentation.lineClamp);
}

/** Tallest named track stack across the row's visible cells. */
export function estimateTableRowBlockSize(row: TableRow, columns: readonly TableColumn[]): number {
  return tableVirtualRowMetrics(row, columns).estimatedSize;
}

function tableVirtualRowMetrics(
  row: TableRow,
  columns: readonly TableColumn[],
): Pick<TableVirtualItem, 'estimatedSize' | 'variableSize'> {
  let tracks: 1 | 2 | 3 | 4 = 1;
  let variableSize = false;
  for (const column of columns) {
    const value = row.cells[column.id];
    const presentation = resolveTableCellPresentation(value, column);
    if (
      (presentation.kind === 'text' || presentation.kind === 'icon-text') &&
      presentation.wraps &&
      presentation.lineClamp === 'none'
    ) {
      variableSize = true;
    }
    const count = tableCellTrackCount(presentation);
    if (count === 4) {
      tracks = 4;
    } else if (count > tracks) tracks = count as 1 | 2 | 3;
  }
  return { estimatedSize: TABLE_VIRTUAL_ROW_TRACK_SIZE[tracks], variableSize };
}

export function flattenTableVirtualItems(input: FlattenTableVirtualItemsInput): TableVirtualItem[] {
  const collapsed = input.collapsedGroupIds instanceof Set
    ? input.collapsedGroupIds
    : new Set(input.collapsedGroupIds);
  if (!input.grouped) {
    return input.rows.map(row => {
      const metrics = tableVirtualRowMetrics(row, input.columns);
      return {
        kind: 'row' as const,
        id: `row:${row.id}`,
        rowId: row.id,
        ...metrics,
      };
    });
  }

  const items: TableVirtualItem[] = [];
  for (const group of input.groups) {
    items.push({
      kind: 'group',
      id: `group:${group.id}`,
      groupId: group.id,
      estimatedSize: TABLE_VIRTUAL_GROUP_HEADER_SIZE,
      variableSize: false,
    });
    if (collapsed.has(group.id)) continue;
    for (const row of group.rows) {
      const metrics = tableVirtualRowMetrics(row, input.columns);
      items.push({
        kind: 'row',
        id: `row:${row.id}`,
        rowId: row.id,
        groupId: group.id,
        ...metrics,
      });
    }
  }
  return items;
}

export function tableVirtualOverscanPx(viewportSize: number): number {
  const min = TABLE_VIRTUAL_MIN_OVERSCAN_ROWS * TABLE_VIRTUAL_ROW_TRACK_SIZE[1];
  return Math.max(0, viewportSize / 2, min);
}

export function buildTableVirtualPrefixSums(sizes: readonly number[]): number[] {
  const prefix = new Array<number>(sizes.length + 1);
  prefix[0] = 0;
  for (let index = 0; index < sizes.length; index += 1) {
    prefix[index + 1] = prefix[index] + Math.max(0, sizes[index] ?? 0);
  }
  return prefix;
}

/** Largest item index whose start offset is <= `offset`. */
export function findTableVirtualIndexAtOffset(prefix: readonly number[], offset: number): number {
  const lastIndex = prefix.length - 2;
  if (lastIndex < 0) return 0;
  const target = Math.max(0, offset);
  let low = 0;
  let high = lastIndex;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if ((prefix[mid] ?? 0) <= target) low = mid;
    else high = mid - 1;
  }
  return low;
}

export function tableVirtualItemSizes(
  items: readonly TableVirtualItem[],
  measures: ReadonlyMap<string, number>,
): number[] {
  return items.map(item => measures.get(item.id) ?? item.estimatedSize);
}

export function sameTableVirtualPlan(
  left: TableVirtualPlan | null | undefined,
  right: TableVirtualPlan | null | undefined,
): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  if (
    left.start !== right.start ||
    left.end !== right.end ||
    left.totalSize !== right.totalSize ||
    left.itemCount !== right.itemCount ||
    left.mountedIndexes.size !== right.mountedIndexes.size
  ) {
    return false;
  }
  for (const index of left.mountedIndexes) {
    if (!right.mountedIndexes.has(index)) return false;
  }
  return sameVirtualNodes(left.nodes, right.nodes);
}

function sameVirtualNodes(left: readonly TableVirtualNode[], right: readonly TableVirtualNode[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (!a || !b || a.kind !== b.kind) return false;
    if (a.kind === 'spacer' && b.kind === 'spacer') {
      if (a.size !== b.size || a.key !== b.key) return false;
      continue;
    }
    if (a.kind === 'row' && b.kind === 'row') {
      if (a.index !== b.index || a.item.id !== b.item.id) return false;
      continue;
    }
    if (a.kind === 'group' && b.kind === 'group') {
      if (a.groupId !== b.groupId || a.headerIndex !== b.headerIndex) return false;
      if (!sameVirtualNodes(a.nodes, b.nodes)) return false;
    }
  }
  return true;
}

/** Precompute dataset-wide lookup state. Rebuild only when items or their sizes change. */
export function createTableVirtualIndex(
  items: readonly TableVirtualItem[],
  sizes: readonly number[],
): TableVirtualIndex {
  const prefix = buildTableVirtualPrefixSums(sizes);
  const itemCount = items.length;
  const groupHeaderIndexes: number[] = [];
  const headerIndexByGroup = new Map<string, number>();
  const groupEndByHeader = new Map<number, number>();
  const rowIndexById = new Map<string, number>();
  const itemIndexById = new Map<string, number>();
  let activeHeaderIndex: number | null = null;

  for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
    const item = items[itemIndex];
    if (item) itemIndexById.set(item.id, itemIndex);
    if (item?.kind === 'group' && item.groupId) {
      if (activeHeaderIndex != null) groupEndByHeader.set(activeHeaderIndex, itemIndex);
      activeHeaderIndex = itemIndex;
      groupHeaderIndexes.push(itemIndex);
      headerIndexByGroup.set(item.groupId, itemIndex);
    } else if (item?.kind === 'row' && item.rowId) {
      rowIndexById.set(item.rowId, itemIndex);
    }
  }
  if (activeHeaderIndex != null) groupEndByHeader.set(activeHeaderIndex, itemCount);

  return {
    items,
    sizes,
    prefix,
    itemCount,
    totalSize: prefix[itemCount] ?? 0,
    grouped: groupHeaderIndexes.length > 0,
    groupHeaderIndexes,
    headerIndexByGroup,
    groupEndByHeader,
    rowIndexById,
    itemIndexById,
  };
}

/** Resolve the mounted slice from cached dataset-wide lookup state. */
export function resolveTableVirtualPlanFromIndex(
  index: TableVirtualIndex,
  input: ResolveTableVirtualIndexedPlanInput,
): TableVirtualPlan {
  const { items, prefix, itemCount, totalSize } = index;
  const empty: TableVirtualPlan = {
    totalSize,
    itemCount,
    start: 0,
    end: 0,
    nodes: totalSize > 0 ? [{ kind: 'spacer', size: totalSize, key: 'pad-empty' }] : [],
    mountedIds: new Set(),
    mountedIndexes: new Set(),
  };
  if (itemCount === 0) return empty;

  const viewportSize = Math.max(0, input.viewportSize);
  const overscan = tableVirtualOverscanPx(viewportSize);
  const trailingOverscan = TABLE_VIRTUAL_MIN_OVERSCAN_ROWS *
    TABLE_VIRTUAL_ROW_TRACK_SIZE[1] / 4;
  const before = input.scrollDirection === 'forward' ? trailingOverscan : overscan;
  const after = input.scrollDirection === 'backward' ? trailingOverscan : overscan;
  const scrollOffset = Math.max(0, Math.min(input.scrollOffset, Math.max(0, totalSize)));
  const rangeStart = Math.max(0, scrollOffset - before);
  const rangeEnd = scrollOffset + viewportSize + after;
  const start = findTableVirtualIndexAtOffset(prefix, rangeStart);
  let end = start;
  while (end < itemCount && (prefix[end] ?? 0) < rangeEnd) end += 1;
  if (end === start) end = Math.min(itemCount, start + 1);

  const mounted = new Set<number>();
  for (let itemIndex = start; itemIndex < end; itemIndex += 1) mounted.add(itemIndex);

  const pinHeader = (groupId: string | undefined) => {
    if (!groupId) return;
    const headerIndex = index.headerIndexByGroup.get(groupId);
    if (headerIndex != null) mounted.add(headerIndex);
  };
  for (const mountedIndex of [...mounted]) pinHeader(items[mountedIndex]?.groupId);

  const nextHeader = firstTableVirtualIndexAfter(index.groupHeaderIndexes, end - 1);
  if (nextHeader != null) mounted.add(nextHeader);

  if (input.pinnedRowIds) {
    for (const rowId of input.pinnedRowIds) {
      const rowIndex = index.rowIndexById.get(rowId);
      if (rowIndex == null) continue;
      mounted.add(rowIndex);
      pinHeader(items[rowIndex]?.groupId);
    }
  }

  const mountedSorted = [...mounted].sort((left, right) => left - right);
  const nodes = index.grouped
    ? buildGroupedVirtualNodes(index, mounted, mountedSorted)
    : buildFlatVirtualNodes(index, mountedSorted);
  const mountedIds = new Set<string>();
  for (const mountedIndex of mounted) {
    const id = items[mountedIndex]?.id;
    if (id) mountedIds.add(id);
  }

  return {
    totalSize,
    itemCount,
    start: mountedSorted[0] ?? start,
    end: mountedSorted.length > 0 ? mountedSorted[mountedSorted.length - 1]! + 1 : end,
    nodes,
    mountedIds,
    mountedIndexes: mounted,
  };
}

/** Resolve a one-off plan. Controllers retain and reuse a prepared index. */
export function resolveTableVirtualPlan(input: ResolveTableVirtualPlanInput): TableVirtualPlan {
  return resolveTableVirtualPlanFromIndex(createTableVirtualIndex(input.items, input.sizes), input);
}

function firstTableVirtualIndexAfter(indexes: readonly number[], target: number): number | undefined {
  let low = 0;
  let high = indexes.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((indexes[middle] ?? 0) <= target) low = middle + 1;
    else high = middle;
  }
  return indexes[low];
}

function buildFlatVirtualNodes(
  index: TableVirtualIndex,
  mounted: readonly number[],
): TableVirtualNode[] {
  const { items, prefix, itemCount } = index;
  const nodes: TableVirtualNode[] = [];
  let cursor = 0;
  for (const mountedIndex of mounted) {
    const item = items[mountedIndex];
    if (!item) continue;
    const spacerSize = (prefix[mountedIndex] ?? 0) - (prefix[cursor] ?? 0);
    if (spacerSize > 0) {
      nodes.push({ kind: 'spacer', size: spacerSize, key: `pad-${cursor}-${mountedIndex}` });
    }
    nodes.push({ kind: 'row', index: mountedIndex, item });
    cursor = mountedIndex + 1;
  }
  const trailingSize = (prefix[itemCount] ?? 0) - (prefix[cursor] ?? 0);
  if (trailingSize > 0) {
    nodes.push({ kind: 'spacer', size: trailingSize, key: `pad-${cursor}-${itemCount}` });
  }
  return nodes;
}

function buildGroupedVirtualNodes(
  index: TableVirtualIndex,
  mounted: ReadonlySet<number>,
  mountedSorted: readonly number[],
): TableVirtualNode[] {
  const { items, prefix, itemCount } = index;
  const nodes: TableVirtualNode[] = [];
  const selectedHeaders = new Set<number>();
  for (const mountedIndex of mountedSorted) {
    const item = items[mountedIndex];
    const headerIndex = item?.kind === 'group'
      ? mountedIndex
      : item?.groupId
        ? index.headerIndexByGroup.get(item.groupId)
        : undefined;
    if (headerIndex != null) selectedHeaders.add(headerIndex);
  }

  let cursor = 0;
  for (const headerIndex of [...selectedHeaders].sort((left, right) => left - right)) {
    const header = items[headerIndex];
    if (header?.kind !== 'group' || !header.groupId) continue;
    const groupId = header.groupId;
    const groupEnd = index.groupEndByHeader.get(headerIndex) ?? headerIndex + 1;
    const leadingSize = (prefix[headerIndex] ?? 0) - (prefix[cursor] ?? 0);
    if (leadingSize > 0) {
      nodes.push({ kind: 'spacer', size: leadingSize, key: `pad-${cursor}-${headerIndex}` });
    }

    const groupNodes: Array<Extract<TableVirtualNode, { kind: 'spacer' | 'row' }>> = [];
    const mountedMembers = mountedSorted.filter(
      mountedIndex => mountedIndex > headerIndex && mountedIndex < groupEnd,
    );
    let memberCursor = headerIndex + 1;
    for (const memberIndex of mountedMembers) {
      const item = items[memberIndex];
      const spacerSize = (prefix[memberIndex] ?? 0) - (prefix[memberCursor] ?? 0);
      if (spacerSize > 0) {
        groupNodes.push({
          kind: 'spacer',
          size: spacerSize,
          key: `group-${groupId}-pad-${memberCursor}-${memberIndex}`,
        });
      }
      if (item?.kind === 'row' && mounted.has(memberIndex)) {
        groupNodes.push({ kind: 'row', index: memberIndex, item });
      }
      memberCursor = memberIndex + 1;
    }
    const trailingSize = (prefix[groupEnd] ?? 0) - (prefix[memberCursor] ?? 0);
    if (trailingSize > 0) {
      groupNodes.push({
        kind: 'spacer',
        size: trailingSize,
        key: `group-${groupId}-pad-${memberCursor}-${groupEnd}`,
      });
    }

    nodes.push({ kind: 'group', groupId, headerIndex, nodes: groupNodes });
    cursor = groupEnd;
  }

  const trailingSize = (prefix[itemCount] ?? 0) - (prefix[cursor] ?? 0);
  if (trailingSize > 0) {
    nodes.push({ kind: 'spacer', size: trailingSize, key: `pad-${cursor}-${itemCount}` });
  }
  return nodes;
}

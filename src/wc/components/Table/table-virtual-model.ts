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

/** Map a cell recipe onto the named track stack used for first-paint estimates. */
export function estimateTableCellTrackCount(
  value: TableRow['cells'][string],
  column: TableColumn,
): number {
  const presentation = resolveTableCellPresentation(value, column);
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
  let tracks: 1 | 2 | 3 | 4 = 1;
  for (const column of columns) {
    const count = estimateTableCellTrackCount(row.cells[column.id], column);
    if (count === 4) {
      tracks = 4;
      break;
    }
    if (count > tracks) tracks = count as 1 | 2 | 3;
  }
  return TABLE_VIRTUAL_ROW_TRACK_SIZE[tracks];
}

export function flattenTableVirtualItems(input: FlattenTableVirtualItemsInput): TableVirtualItem[] {
  const collapsed = input.collapsedGroupIds instanceof Set
    ? input.collapsedGroupIds
    : new Set(input.collapsedGroupIds);
  if (!input.grouped) {
    return input.rows.map(row => ({
      kind: 'row' as const,
      id: `row:${row.id}`,
      rowId: row.id,
      estimatedSize: estimateTableRowBlockSize(row, input.columns),
    }));
  }

  const items: TableVirtualItem[] = [];
  for (const group of input.groups) {
    items.push({
      kind: 'group',
      id: `group:${group.id}`,
      groupId: group.id,
      estimatedSize: TABLE_VIRTUAL_GROUP_HEADER_SIZE,
    });
    if (collapsed.has(group.id)) continue;
    for (const row of group.rows) {
      items.push({
        kind: 'row',
        id: `row:${row.id}`,
        rowId: row.id,
        groupId: group.id,
        estimatedSize: estimateTableRowBlockSize(row, input.columns),
      });
    }
  }
  return items;
}

export function tableVirtualOverscanPx(viewportSize: number): number {
  const min = TABLE_VIRTUAL_MIN_OVERSCAN_ROWS * TABLE_VIRTUAL_ROW_TRACK_SIZE[1];
  return Math.max(0, viewportSize, min);
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
      if (a.index !== b.index) return false;
      continue;
    }
    if (a.kind === 'group' && b.kind === 'group') {
      if (a.groupId !== b.groupId || a.headerIndex !== b.headerIndex) return false;
      if (!sameVirtualNodes(a.nodes, b.nodes)) return false;
    }
  }
  return true;
}

/** Resolve the mounted slice, sticky headers, and in-flow spacers for one scroll offset. */
export function resolveTableVirtualPlan(input: ResolveTableVirtualPlanInput): TableVirtualPlan {
  const { items, sizes } = input;
  const prefix = buildTableVirtualPrefixSums(sizes);
  const itemCount = items.length;
  const totalSize = prefix[itemCount] ?? 0;
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
  const scrollOffset = Math.max(0, Math.min(input.scrollOffset, Math.max(0, totalSize)));
  const rangeStart = Math.max(0, scrollOffset - overscan);
  const rangeEnd = scrollOffset + viewportSize + overscan;
  const start = findTableVirtualIndexAtOffset(prefix, rangeStart);
  let end = start;
  while (end < itemCount && (prefix[end] ?? 0) < rangeEnd) end += 1;
  if (end === start) end = Math.min(itemCount, start + 1);

  const mounted = new Set<number>();
  for (let index = start; index < end; index += 1) mounted.add(index);

  const headerIndexByGroup = new Map<string, number>();
  for (let index = 0; index < itemCount; index += 1) {
    const item = items[index];
    if (item?.kind === 'group' && item.groupId) headerIndexByGroup.set(item.groupId, index);
  }

  const pinHeader = (groupId: string | undefined) => {
    if (!groupId) return;
    const headerIndex = headerIndexByGroup.get(groupId);
    if (headerIndex != null) mounted.add(headerIndex);
  };

  for (const index of [...mounted]) {
    pinHeader(items[index]?.groupId);
  }

  const last = end - 1;
  if (last >= 0) {
    for (let index = last + 1; index < itemCount; index += 1) {
      if (items[index]?.kind === 'group') {
        mounted.add(index);
        break;
      }
    }
  }

  const pinnedRowIds = input.pinnedRowIds;
  if (pinnedRowIds && pinnedRowIds.size > 0) {
    for (let index = 0; index < itemCount; index += 1) {
      const item = items[index];
      if (item?.kind === 'row' && item.rowId && pinnedRowIds.has(item.rowId)) {
        mounted.add(index);
        pinHeader(item.groupId);
      }
    }
  }

  const grouped = items.some(item => item.kind === 'group');
  const nodes = grouped
    ? buildGroupedVirtualNodes(items, sizes, mounted)
    : buildFlatVirtualNodes(items, sizes, mounted);

  const mountedIds = new Set<string>();
  for (const index of mounted) {
    const id = items[index]?.id;
    if (id) mountedIds.add(id);
  }

  let planStart = itemCount;
  let planEnd = 0;
  for (const index of mounted) {
    if (index < planStart) planStart = index;
    if (index + 1 > planEnd) planEnd = index + 1;
  }
  if (planStart === itemCount) {
    planStart = start;
    planEnd = end;
  }

  return {
    totalSize,
    itemCount,
    start: planStart,
    end: planEnd,
    nodes,
    mountedIds,
    mountedIndexes: mounted,
  };
}

function buildFlatVirtualNodes(
  items: readonly TableVirtualItem[],
  sizes: readonly number[],
  mounted: ReadonlySet<number>,
): TableVirtualNode[] {
  const nodes: TableVirtualNode[] = [];
  let spacer = 0;
  let spacerFrom = 0;
  const flush = (until: number) => {
    if (spacer <= 0) return;
    nodes.push({ kind: 'spacer', size: spacer, key: `pad-${spacerFrom}-${until}` });
    spacer = 0;
  };

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item) continue;
    if (mounted.has(index)) {
      flush(index);
      nodes.push({ kind: 'row', index, item });
      continue;
    }
    if (spacer === 0) spacerFrom = index;
    spacer += sizes[index] ?? 0;
  }
  flush(items.length);
  return nodes;
}

function buildGroupedVirtualNodes(
  items: readonly TableVirtualItem[],
  sizes: readonly number[],
  mounted: ReadonlySet<number>,
): TableVirtualNode[] {
  const nodes: TableVirtualNode[] = [];
  let leading = 0;
  let leadingFrom = 0;
  const flushLeading = (key: string) => {
    if (leading <= 0) return;
    nodes.push({ kind: 'spacer', size: leading, key });
    leading = 0;
  };

  let index = 0;
  while (index < items.length) {
    const header = items[index];
    if (header?.kind !== 'group' || !header.groupId) {
      if (leading === 0) leadingFrom = index;
      leading += sizes[index] ?? 0;
      index += 1;
      continue;
    }

    const groupId = header.groupId;
    const headerIndex = index;
    const memberIndexes: number[] = [];
    index += 1;
    while (index < items.length && items[index]?.kind === 'row' && items[index]?.groupId === groupId) {
      memberIndexes.push(index);
      index += 1;
    }

    const headerMounted = mounted.has(headerIndex);
    const mountedMembers = memberIndexes.filter(memberIndex => mounted.has(memberIndex));
    if (!headerMounted && mountedMembers.length === 0) {
      if (leading === 0) leadingFrom = headerIndex;
      leading += sizes[headerIndex] ?? 0;
      for (const memberIndex of memberIndexes) leading += sizes[memberIndex] ?? 0;
      continue;
    }

    flushLeading(`pad-${leadingFrom}-${headerIndex}`);
    const groupNodes: Array<Extract<TableVirtualNode, { kind: 'spacer' | 'row' }>> = [];
    if (mountedMembers.length > 0) {
      let memberSpacer = 0;
      let memberFrom = 0;
      const flushMember = (until: number) => {
        if (memberSpacer <= 0) return;
        groupNodes.push({
          kind: 'spacer',
          size: memberSpacer,
          key: `group-${groupId}-pad-${memberFrom}-${until}`,
        });
        memberSpacer = 0;
      };
      for (const memberIndex of memberIndexes) {
        const item = items[memberIndex];
        if (item && mounted.has(memberIndex)) {
          flushMember(memberIndex);
          groupNodes.push({ kind: 'row', index: memberIndex, item });
          continue;
        }
        if (memberSpacer === 0) memberFrom = memberIndex;
        memberSpacer += sizes[memberIndex] ?? 0;
      }
      flushMember(memberIndexes[memberIndexes.length - 1]! + 1);
    }

    nodes.push({
      kind: 'group',
      groupId,
      headerIndex,
      nodes: groupNodes,
    });
  }

  flushLeading(`pad-${leadingFrom}-end`);
  return nodes;
}

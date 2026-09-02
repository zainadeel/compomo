import type {
  TableCellBlank,
  TableCellAction,
  TableCellEmpty,
  TableCellIcon,
  TableCellIconText,
  TableCellScoreText,
  TableCellImage,
  TableCellPrimaryText,
  TableCellText,
  TableCellTag,
  TableCellTags,
  TableCellValue,
  TableColumn,
  TableGroup,
  TableGroupAccessory,
  TableGroupHero,
  TableRow,
  TableSortState,
} from './table-types';
import { isSafetyScoreLevel } from '../Score/score-model';

export interface TableSelectionState {
  selectableRowIds: string[];
  selectedLoadedCount: number;
  allSelected: boolean;
  indeterminate: boolean;
}

const TABLE_COLUMN_WIDTH_TOKENS = {
  xs: '--dimension-table-column-width-xs',
  sm: '--dimension-table-column-width-sm',
  md: '--dimension-table-column-width-md',
  lg: '--dimension-table-column-width-lg',
  xl: '--dimension-table-column-width-xl',
} as const;

const TABLE_IMAGE_COLUMN_WIDTH_VARIABLES = {
  1: '--_table-image-column-inline-size',
  2: '--_table-image-column-inline-size-multi',
  3: '--_table-image-column-inline-size-triple',
} as const;

export function isTableCellText(value: TableCellValue): value is TableCellText {
  return typeof value === 'object' && value !== null && 'primary' in value && !('kind' in value);
}

export function isTableCellPrimaryText(value: TableCellValue): value is TableCellPrimaryText {
  return (
    typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'primary-text'
  );
}

export function isTableCellTag(value: TableCellValue): value is TableCellTag {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'tag';
}

export function isTableCellTags(value: TableCellValue): value is TableCellTags {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'tags';
}

export function isTableCellIcon(value: TableCellValue): value is TableCellIcon {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'icon';
}

export function isTableCellIconText(value: TableCellValue): value is TableCellIconText {
  return (
    typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'icon-text'
  );
}

export function isTableCellScoreText(value: TableCellValue): value is TableCellScoreText {
  return (
    typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'score-text'
  );
}

export function isTableCellImage(value: TableCellValue): value is TableCellImage {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'image';
}

export function isTableCellAction(value: TableCellValue): value is TableCellAction {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'action';
}

export function isTableCellEmpty(value: TableCellValue): value is TableCellEmpty {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'empty';
}

export function isTableCellBlank(value: TableCellValue): value is TableCellBlank {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'blank';
}

export function tableCellPrimary(value: TableCellValue): string | number | null {
  if (value == null) return null;
  if (isTableCellTag(value)) return value.label;
  if (isTableCellTags(value)) return value.items.map(item => item.label).join(', ');
  if (isTableCellIcon(value)) return null;
  if (isTableCellIconText(value)) return value.primary;
  if (isTableCellScoreText(value)) return value.primary;
  if (isTableCellImage(value)) return value.alt;
  if (isTableCellAction(value)) return value.label ?? value.ariaLabel;
  if (isTableCellPrimaryText(value)) return value.primary;
  if (isTableCellEmpty(value) || isTableCellBlank(value)) return null;
  return isTableCellText(value) ? value.primary : value;
}

export function tableRowSelectionLabel(row: TableRow, columns: TableColumn[]): string {
  const explicit = row.selectionLabel?.trim();
  if (explicit) return explicit;

  for (const column of columns) {
    const primary = tableCellPrimary(row.cells[column.id]);
    if (primary != null && String(primary).trim()) return String(primary);
  }

  return row.id;
}

export function nextTableSortState(
  current: TableSortState | null | undefined,
  columnId: string
): TableSortState {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
  if (current.direction === 'asc') return { columnId, direction: 'desc' };
  return { columnId, direction: 'asc' };
}

export function toggleTableGroupCollapsed(collapsedGroupIds: string[], groupId: string): string[] {
  const next = new Set(collapsedGroupIds);
  if (next.has(groupId)) next.delete(groupId);
  else next.add(groupId);
  return [...next];
}

export function nextTableGroupsCollapsed(
  collapsedGroupIds: string[],
  groupIds: string[]
): string[] {
  if (groupIds.length === 0) return [];
  const collapsed = new Set(collapsedGroupIds);
  const allCollapsed = groupIds.every(id => collapsed.has(id));
  return allCollapsed ? [] : [...groupIds];
}

/** Host for grouped collapse-all: the trailing action lane or a scrollport-owned overlay. */
export type TableCollapseAllHost = { columnId: string; mode: 'action' } | { mode: 'floating' };

export function tableCollapseAllHost(columns: TableColumn[]): TableCollapseAllHost | undefined {
  if (columns.length === 0) return undefined;
  for (let index = columns.length - 1; index >= 0; index -= 1) {
    const column = columns[index]!;
    if (column.kind === 'action') return { columnId: column.id, mode: 'action' };
  }
  return { mode: 'floating' };
}

export function clampTableColumnSize(column: TableColumn): number | undefined {
  if (typeof column.size !== 'number' || !Number.isFinite(column.size) || column.size <= 0) {
    return undefined;
  }

  const minimum =
    Number.isFinite(column.minSize) && (column.minSize ?? 0) > 0 ? column.minSize! : 0;
  const maximum =
    Number.isFinite(column.maxSize) && (column.maxSize ?? 0) > 0
      ? Math.max(column.maxSize!, minimum)
      : Number.POSITIVE_INFINITY;

  return Math.min(Math.max(column.size!, minimum), maximum);
}

export function tableColumnSize(column: TableColumn): string | undefined {
  if (typeof column.size === 'string') {
    return `var(${TABLE_COLUMN_WIDTH_TOKENS[column.size]})`;
  }
  const width = clampTableColumnSize(column);
  if (width != null) return `${width}px`;
  if (column.imageTracks) {
    return `var(${TABLE_IMAGE_COLUMN_WIDTH_VARIABLES[column.imageTracks]})`;
  }
  return column.kind === 'action' ? 'var(--dimension-size-500)' : undefined;
}

/**
 * Fully sized tables add one internal lane that absorbs spare inline space and
 * collapses to zero at the explicit overflow width. Keep trailing action and
 * sticky-end lanes after it so those controls remain at the visible edge.
 */
export function tableElasticSpacerIndex(columns: TableColumn[]): number | undefined {
  if (columns.length === 0 || columns.some(column => !tableColumnSize(column))) return undefined;
  let index = columns.length;
  while (index > 0) {
    const column = columns[index - 1]!;
    if (column.kind !== 'action' && column.sticky !== 'end') break;
    index -= 1;
  }
  return index;
}

export function tableExplicitMinWidth(columns: TableColumn[]): string | undefined {
  const widths = columns.map(tableColumnSize).filter((width): width is string => !!width);
  if (widths.length === 0) return undefined;
  return widths.length === 1 ? widths[0] : `calc(${widths.join(' + ')})`;
}

export function tableRows(rows: TableRow[], groups: TableGroup[], grouped: boolean): TableRow[] {
  return grouped ? groups.flatMap(group => group.rows) : rows;
}

function canSelectRow(row: TableRow): boolean {
  return row.selectable !== false && !row.disabled;
}

export function deriveTableSelectionState(
  rows: TableRow[],
  selectedRowIds: readonly string[]
): TableSelectionState {
  const selected = new Set(selectedRowIds);
  const selectableRowIds = rows.filter(canSelectRow).map(row => row.id);
  const selectedLoadedCount = selectableRowIds.reduce(
    (count, id) => count + (selected.has(id) ? 1 : 0),
    0
  );

  return {
    selectableRowIds,
    selectedLoadedCount,
    allSelected: selectableRowIds.length > 0 && selectedLoadedCount === selectableRowIds.length,
    indeterminate: selectedLoadedCount > 0 && selectedLoadedCount < selectableRowIds.length,
  };
}

export function toggleTableRowSelection(
  selectedRowIds: readonly string[],
  row: TableRow
): string[] {
  if (!canSelectRow(row)) return [...selectedRowIds];
  const selected = new Set(selectedRowIds);
  if (selected.has(row.id)) selected.delete(row.id);
  else selected.add(row.id);
  return [...selected];
}

export function toggleAllLoadedTableRows(
  selectedRowIds: readonly string[],
  loadedRows: TableRow[]
): string[] {
  const selected = new Set(selectedRowIds);
  const state = deriveTableSelectionState(loadedRows, selectedRowIds);

  for (const id of state.selectableRowIds) {
    if (state.allSelected) selected.delete(id);
    else selected.add(id);
  }

  return [...selected];
}

/** Toggle every selectable loaded row that belongs to a group. */
export function toggleTableGroupSelection(
  selectedRowIds: readonly string[],
  groupRows: TableRow[]
): string[] {
  return toggleAllLoadedTableRows(selectedRowIds, groupRows);
}

export function resolvedTableGroupCount(group: TableGroup): number {
  const total = Number.isFinite(group.totalCount) ? Math.max(0, group.totalCount!) : 0;
  return Math.max(total, group.rows.length);
}

/** Accessory items shown on a group header's second track. */
export const TABLE_GROUP_ACCESSORY_LIMIT = 4;

/** Trim, drop empty copy, and cap accessories at the second-track limit. */
export function tableGroupAccessories(group: TableGroup): TableGroupAccessory[] {
  const resolved: TableGroupAccessory[] = [];
  for (const item of group.accessories ?? []) {
    const text = item?.text?.trim() ?? '';
    if (!text) continue;
    const help = item.help?.trim();
    resolved.push(help ? { text, help } : { text });
    if (resolved.length === TABLE_GROUP_ACCESSORY_LIMIT) break;
  }
  return resolved;
}

/** Group-header score fill. Same sm density on one- and two-track headers. */
export const TABLE_GROUP_HERO_SCORE_SIZE = 'sm' as const;

/** Resolve a supported group-header hero, or undefined when none is supplied. */
export function tableGroupHero(group: TableGroup): TableGroupHero | undefined {
  const hero = group.hero;
  if (!hero || hero.kind !== 'score') return undefined;
  const label = hero.label?.trim();
  return {
    kind: 'score',
    value: hero.value,
    ...(isSafetyScoreLevel(hero.level) ? { level: hero.level } : {}),
    ...(label ? { label } : {}),
    ...(hero.isLoading ? { isLoading: true } : {}),
  };
}

export const TABLE_GROUP_INTENTS = [
  'brand',
  'neutral',
  'negative',
  'warning',
  'caution',
  'positive',
] as const;

export function isTableGroupIntent(value: unknown): value is (typeof TABLE_GROUP_INTENTS)[number] {
  return typeof value === 'string' && (TABLE_GROUP_INTENTS as readonly string[]).includes(value);
}

export function tableGroupIntentClass(
  intent: (typeof TABLE_GROUP_INTENTS)[number] | undefined
): string | undefined {
  return isTableGroupIntent(intent) ? `ds-table__group-cell--intent-${intent}` : undefined;
}

/** Title color for an intentful group label; defaults to primary when unset. */
export function tableGroupLabelColor(
  intent: (typeof TABLE_GROUP_INTENTS)[number] | undefined
): 'primary' | 'brand' | 'negative' | 'warning' | 'caution' | 'positive' | `var(--${string})` {
  if (!isTableGroupIntent(intent)) return 'primary';
  if (intent === 'neutral') return 'var(--color-foreground-bold-neutral)';
  return intent;
}

/** Formats the optional table result footer. Returns null when either count is missing. */
export function formatTableResultSummary(
  displayed: number | null | undefined,
  total: number | null | undefined,
  label = 'Displaying {displayed} of {total}',
  locale?: string
): string | null {
  if (!Number.isFinite(displayed) || !Number.isFinite(total)) return null;
  const normalizedTotal = Math.max(0, Math.trunc(total as number));
  const normalizedDisplayed = Math.min(
    normalizedTotal,
    Math.max(0, Math.trunc(displayed as number))
  );
  const formatter = new Intl.NumberFormat(locale);
  return label
    .replace('{displayed}', formatter.format(normalizedDisplayed))
    .replace('{total}', formatter.format(normalizedTotal));
}

/** Formats the virtual-mode total-only result footer. */
export function formatTableTotalSummary(
  total: number | null | undefined,
  label = '{total} items',
  locale?: string
): string | null {
  if (!Number.isFinite(total)) return null;
  const normalizedTotal = Math.max(0, Math.trunc(total as number));
  return label.replace('{total}', new Intl.NumberFormat(locale).format(normalizedTotal));
}

/**
 * True when a footer slot belongs to the table itself: a light-DOM child of the
 * host, or a top-level node Stencil relocated into this table's footer. A
 * slotted ancestor marks a nested component boundary, so dialog action slots
 * inside footer-leading/footer-trailing content cannot replace the table copy.
 */
export function isOwnedTableFooterSlot(node: Element, host: Element): boolean {
  if (node.parentElement === host) return true;
  let insideTableFooter = false;
  for (
    let ancestor = node.parentElement;
    ancestor && ancestor !== host;
    ancestor = ancestor.parentElement
  ) {
    if (ancestor.hasAttribute('slot')) return false;
    if (ancestor.classList.contains('ds-table__footer')) insideTableFooter = true;
  }
  return insideTableFooter;
}

export function hasOwnedTableFooterSlot(host: Element, slotName: string): boolean {
  return [...host.querySelectorAll(`[slot="${slotName}"]`)].some(node =>
    isOwnedTableFooterSlot(node, host)
  );
}

export function tableModelIssues(
  columns: TableColumn[],
  rows: TableRow[],
  groups: TableGroup[],
  grouped: boolean
): string[] {
  const issues: string[] = [];
  const columnIds = new Set<string>();
  for (const column of columns) {
    if (!column.id.trim()) issues.push('Every column requires a non-empty id.');
    else if (columnIds.has(column.id)) issues.push(`Duplicate column id: ${column.id}`);
    if (!column.header.trim() && !column.headerLabel?.trim()) {
      issues.push(
        `Column ${column.id || '(missing id)'} requires a visible header or headerLabel.`
      );
    }
    columnIds.add(column.id);
  }

  const groupIds = new Set<string>();
  if (grouped) {
    for (const group of groups) {
      if (!group.id.trim()) issues.push('Every group requires a non-empty id.');
      else if (groupIds.has(group.id)) issues.push(`Duplicate group id: ${group.id}`);
      groupIds.add(group.id);
      if (group.totalCount != null && group.totalCount < group.rows.length) {
        issues.push(`Group ${group.id} totalCount is smaller than its loaded row count.`);
      }
      if (group.intent != null && !isTableGroupIntent(group.intent)) {
        issues.push(`Group ${group.id} has an unsupported intent.`);
      }
      const accessoryCount = (group.accessories ?? []).filter(
        item => typeof item?.text === 'string' && item.text.trim()
      ).length;
      if (accessoryCount > TABLE_GROUP_ACCESSORY_LIMIT) {
        issues.push(`Group ${group.id} has more than ${TABLE_GROUP_ACCESSORY_LIMIT} accessories.`);
      }
      if (group.hero != null && group.hero.kind !== 'score') {
        issues.push(`Group ${group.id} has an unsupported hero.`);
      }
    }
  }

  const rowIds = new Set<string>();
  for (const row of tableRows(rows, groups, grouped)) {
    if (!row.id.trim()) issues.push('Every row requires a non-empty id.');
    else if (rowIds.has(row.id)) issues.push(`Duplicate row id: ${row.id}`);
    rowIds.add(row.id);
  }

  return [...new Set(issues)];
}

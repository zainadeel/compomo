import {
  deriveTableSelectionState,
  isTableGroupIntent,
  resolvedTableGroupCount,
  tableCollapseAllHost,
  tableColumnSize,
  tableExplicitMinWidth,
  tableFlexibleColumnId,
  tableGroupIntentClass,
  tableGroupLabelColor,
  tableRows,
  type TableCollapseAllHost,
  type TableSelectionState,
} from './table-model';
import type {
  TableColumn,
  TableGroup,
  TableGroupIntent,
  TableRow,
  TableSelectionMode,
} from './table-types';

export type TableGroupCountPresentation = 'loaded-progress' | 'total';

export interface TableGroupRenderModel {
  group: TableGroup;
  count: number;
  loadedCount: number;
  visibleCountText: string;
  countLabel: string;
  intent: TableGroupIntent | undefined;
  intentClass: string | undefined;
  labelColor: ReturnType<typeof tableGroupLabelColor>;
  collapsed: boolean;
  selection: TableSelectionState | null;
}

export interface TableRenderModel {
  grouped: boolean;
  selectable: boolean;
  loadedRows: TableRow[];
  hasData: boolean;
  selectedRowIds: ReadonlySet<string>;
  selection: TableSelectionState;
  collapsedGroupIds: ReadonlySet<string>;
  groups: TableGroupRenderModel[];
  totalColumns: number;
  allGroupsCollapsed: boolean;
  showCollapseAll: boolean;
  collapseAllHost: TableCollapseAllHost | undefined;
  flexibleColumnId: string | undefined;
  tableStyle: Record<string, string> | undefined;
}

export interface TableRenderModelInput {
  columns: TableColumn[];
  rows: TableRow[];
  groups: TableGroup[];
  grouped: boolean;
  selectionMode: TableSelectionMode;
  selectedRowIds: string[];
  collapsedGroupIds: string[];
  groupCountPresentation?: TableGroupCountPresentation;
}

/** Create one immutable snapshot of all derived state consumed during a render. */
export function createTableRenderModel(input: TableRenderModelInput): TableRenderModel {
  const selectable = input.selectionMode === 'multiple';
  const loadedRows = tableRows(input.rows, input.groups, input.grouped);
  const selectedRowIds = new Set(input.selectedRowIds);
  const collapsedGroupIds = new Set(input.collapsedGroupIds);
  const allGroupsCollapsed =
    input.grouped &&
    input.groups.length > 0 &&
    input.groups.every(group => collapsedGroupIds.has(group.id));
  const showCollapseAll = input.grouped && input.groups.length > 0 && !allGroupsCollapsed;
  const explicitMinWidth = tableExplicitMinWidth(input.columns);
  const flexibleColumnId = tableFlexibleColumnId(input.columns);
  const gridTracks = [
    ...(selectable ? ['var(--_table-selection-column-inline-size)'] : []),
    ...input.columns.map(column => {
      const width = tableColumnSize(column);
      if (!width) return 'minmax(0, 1fr)';
      return column.id === flexibleColumnId ? `minmax(${width}, 1fr)` : width;
    }),
  ].join(' ');
  const tableStyle: Record<string, string> = {
    '--_table-grid-template-columns': gridTracks || 'minmax(0, 1fr)',
  };
  if (explicitMinWidth != null) {
    tableStyle['--ds-table-explicit-min-inline-size'] = explicitMinWidth;
  }

  return {
    grouped: input.grouped,
    selectable,
    loadedRows,
    hasData: loadedRows.length > 0,
    selectedRowIds,
    selection: deriveTableSelectionState(loadedRows, input.selectedRowIds),
    collapsedGroupIds,
    groups: input.groups.map(group => {
      const loadedCount = group.rows.length;
      const totalPresentation = input.groupCountPresentation === 'total';
      const count = resolvedTableGroupCount(group);
      const totalLabel = group.countLabel ?? `${count} ${count === 1 ? 'item' : 'items'}`;
      const intent = isTableGroupIntent(group.intent) ? group.intent : undefined;
      return {
        group,
        count,
        loadedCount,
        visibleCountText: totalPresentation ? String(count) : `${loadedCount} of ${count}`,
        countLabel: totalPresentation ? totalLabel : `${loadedCount} of ${totalLabel} loaded`,
        intent,
        intentClass: tableGroupIntentClass(intent),
        labelColor: tableGroupLabelColor(intent),
        collapsed: collapsedGroupIds.has(group.id),
        selection: selectable ? deriveTableSelectionState(group.rows, input.selectedRowIds) : null,
      };
    }),
    totalColumns: input.columns.length + (selectable ? 1 : 0),
    allGroupsCollapsed,
    showCollapseAll,
    collapseAllHost: showCollapseAll ? tableCollapseAllHost(input.columns) : undefined,
    flexibleColumnId,
    tableStyle,
  };
}

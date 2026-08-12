import {
  deriveTableSelectionState,
  isTableGroupIntent,
  resolvedTableGroupCount,
  tableCollapseAllHost,
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

export interface TableGroupRenderModel {
  group: TableGroup;
  count: number;
  countLabel: string;
  countIntent: TableGroupIntent;
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
}

/** Create one immutable snapshot of all derived state consumed during a render. */
export function createTableRenderModel(input: TableRenderModelInput): TableRenderModel {
  const selectable = input.selectionMode === 'multiple';
  const loadedRows = tableRows(input.rows, input.groups, input.grouped);
  const selectedRowIds = new Set(input.selectedRowIds);
  const collapsedGroupIds = new Set(input.collapsedGroupIds);
  const allGroupsCollapsed = input.grouped && input.groups.length > 0 &&
    input.groups.every(group => collapsedGroupIds.has(group.id));
  const showCollapseAll = input.grouped && input.groups.length > 0 && !allGroupsCollapsed;
  const explicitMinWidth = tableExplicitMinWidth(input.columns);

  return {
    grouped: input.grouped,
    selectable,
    loadedRows,
    hasData: loadedRows.length > 0,
    selectedRowIds,
    selection: deriveTableSelectionState(loadedRows, input.selectedRowIds),
    collapsedGroupIds,
    groups: input.groups.map(group => {
      const count = resolvedTableGroupCount(group);
      const intent = isTableGroupIntent(group.intent) ? group.intent : undefined;
      return {
        group,
        count,
        countLabel: group.countLabel ?? `${count} ${count === 1 ? 'item' : 'items'}`,
        countIntent: intent ?? 'neutral',
        intent,
        intentClass: tableGroupIntentClass(intent),
        labelColor: tableGroupLabelColor(intent),
        collapsed: collapsedGroupIds.has(group.id),
        selection: selectable
          ? deriveTableSelectionState(group.rows, input.selectedRowIds)
          : null,
      };
    }),
    totalColumns: input.columns.length + (selectable ? 1 : 0),
    allGroupsCollapsed,
    showCollapseAll,
    collapseAllHost: showCollapseAll ? tableCollapseAllHost(input.columns) : undefined,
    flexibleColumnId: tableFlexibleColumnId(input.columns),
    tableStyle: explicitMinWidth == null
      ? undefined
      : { '--ds-table-explicit-min-inline-size': explicitMinWidth },
  };
}

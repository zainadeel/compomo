import { h } from '@stencil/core';
import type { TableGroupRenderModel, TableRenderModel } from './table-render-model';
import type { TableGroup, TableRow } from './table-types';
import type { TableVirtualNode, TableVirtualPlan } from './table-virtual-model';

export interface TableVirtualRowPoolState {
  slotsByRowId: Map<string, number>;
  nextSlot: number;
}

export interface TableBodyRenderOptions {
  model: TableRenderModel;
  plan: TableVirtualPlan | null;
  rows: TableRow[];
  stickyHeader: boolean;
  documentStickyHeader: boolean;
  activeStickyGroupId: string | null;
  renderRow: (
    row: TableRow,
    model: TableRenderModel,
    ariaRowIndex?: number,
    variableVirtualSize?: boolean,
    rowKey?: string,
  ) => unknown;
  renderGroupContent: (group: TableGroupRenderModel) => unknown;
  renderGroupLoadRow: (group: TableGroup, totalColumns: number) => unknown;
}

/**
 * Assign stable, bounded DOM keys to the rows currently occupying one virtual scope.
 * Departed rows release their slots so long scrolls recycle DOM instead of growing it.
 */
export function assignTableVirtualRowPoolKeys(
  nodes: readonly TableVirtualNode[],
  state: TableVirtualRowPoolState,
): Map<number, string> {
  const rows = nodes.filter(
    (node): node is Extract<TableVirtualNode, { kind: 'row' }> => node.kind === 'row',
  );
  const desiredIds = new Set(rows.map(node => node.item.rowId ?? node.item.id));
  const freeSlots: number[] = [];
  for (const [rowId, slot] of state.slotsByRowId) {
    if (desiredIds.has(rowId)) continue;
    state.slotsByRowId.delete(rowId);
    freeSlots.push(slot);
  }
  freeSlots.sort((left, right) => left - right);

  const keys = new Map<number, string>();
  for (const node of rows) {
    const rowId = node.item.rowId ?? node.item.id;
    let slot = state.slotsByRowId.get(rowId);
    if (slot == null) {
      slot = freeSlots.shift() ?? state.nextSlot++;
      state.slotsByRowId.set(rowId, slot);
    }
    keys.set(node.index, `virtual-row-slot-${slot}`);
  }
  return keys;
}

/** Owns grouped and virtual tbody composition while Table remains the behavior orchestrator. */
export class TableBodyRenderer {
  private virtualLookupCache: {
    rows: TableRow[];
    groups: TableGroupRenderModel[];
    rowsById: Map<string, TableRow>;
    groupsById: Map<string, TableGroupRenderModel>;
  } | null = null;

  private readonly virtualRowPoolStates = new Map<string, TableVirtualRowPoolState>();

  resetVirtualState(): void {
    this.virtualLookupCache = null;
    this.virtualRowPoolStates.clear();
  }

  render(options: TableBodyRenderOptions) {
    if (options.plan) return this.renderVirtualBodies(options);

    const { model } = options;
    if (!model.grouped) {
      return (
        <tbody class="ds-table__body">
          {options.rows.map(row => options.renderRow(row, model))}
        </tbody>
      );
    }

    return model.groups.map(groupModel => {
      const { group, collapsed: isCollapsed, intent, intentClass } = groupModel;
      const stickySourceHidden =
        options.documentStickyHeader && options.activeStickyGroupId === group.id;
      return (
        <tbody
          class="ds-table__body ds-table__group"
          role="rowgroup"
          data-group-id={group.id}
          data-group-intent={intent}
          data-collapsed={isCollapsed ? 'true' : undefined}
          aria-busy={!isCollapsed && group.loadingMore ? 'true' : undefined}
          key={group.id}
        >
          <tr
            role="row"
            aria-hidden={stickySourceHidden ? 'true' : undefined}
            class={{
              'ds-table__group-row': true,
              'ds-table__group-row--native-sticky':
                options.stickyHeader && !options.documentStickyHeader,
            }}
          >
            <th
              class={{
                'ds-table__group-cell': true,
                'ds-table__group-cell--sticky-source-hidden': stickySourceHidden,
                [intentClass ?? '']: !!intentClass,
              }}
              role="rowheader"
              scope="rowgroup"
              colSpan={model.totalColumns}
            >
              {options.renderGroupContent(groupModel)}
            </th>
          </tr>
          {!isCollapsed && group.rows.map(row => options.renderRow(row, model))}
          {!isCollapsed && options.renderGroupLoadRow(group, model.totalColumns)}
        </tbody>
      );
    });
  }

  private renderVirtualSpacer(
    node: Extract<TableVirtualNode, { kind: 'spacer' }>,
    totalColumns: number,
  ) {
    if (node.size <= 0) return null;
    return (
      <tr class="ds-table__virtual-spacer-row" key={node.key} aria-hidden="true">
        <td
          class="ds-table__virtual-spacer-cell"
          colSpan={totalColumns}
          style={
            { '--_table-virtual-spacer-block-size': `${node.size}px` } as Record<string, string>
          }
        />
      </tr>
    );
  }

  private renderVirtualRow(
    node: Extract<TableVirtualNode, { kind: 'row' }>,
    options: TableBodyRenderOptions,
    rowsById: Map<string, TableRow>,
    rowKey: string,
  ) {
    const row = node.item.rowId ? rowsById.get(node.item.rowId) : undefined;
    if (!row) return null;
    return options.renderRow(
      row,
      options.model,
      node.index + 2,
      node.item.variableSize,
      rowKey,
    );
  }

  private virtualRowPoolKeys(nodes: readonly TableVirtualNode[], scope: string) {
    const state = this.virtualRowPoolStates.get(scope) ?? {
      slotsByRowId: new Map<string, number>(),
      nextSlot: 0,
    };
    this.virtualRowPoolStates.set(scope, state);
    return assignTableVirtualRowPoolKeys(nodes, state);
  }

  private renderVirtualGroup(
    node: Extract<TableVirtualNode, { kind: 'group' }>,
    options: TableBodyRenderOptions,
    rowsById: Map<string, TableRow>,
    groupsById: Map<string, TableGroupRenderModel>,
  ) {
    const groupModel = groupsById.get(node.groupId);
    if (!groupModel) return null;
    const { group, collapsed: isCollapsed, intent, intentClass } = groupModel;
    const rowKeys = this.virtualRowPoolKeys(node.nodes, `group:${group.id}`);
    return (
      <tbody
        class="ds-table__body ds-table__group"
        role="rowgroup"
        data-group-id={group.id}
        data-group-intent={intent}
        data-collapsed={isCollapsed ? 'true' : undefined}
        key={group.id}
      >
        <tr
          role="row"
          data-virtual-id={`group:${group.id}`}
          aria-rowindex={node.headerIndex + 2}
          class={{
            'ds-table__group-row': true,
            'ds-table__group-row--native-sticky':
              options.stickyHeader && !options.documentStickyHeader,
          }}
        >
          <th
            class={{
              'ds-table__group-cell': true,
              [intentClass ?? '']: !!intentClass,
            }}
            role="rowheader"
            scope="rowgroup"
            colSpan={options.model.totalColumns}
          >
            {options.renderGroupContent(groupModel)}
          </th>
        </tr>
        {node.nodes.map(child =>
          child.kind === 'spacer'
            ? this.renderVirtualSpacer(child, options.model.totalColumns)
            : this.renderVirtualRow(
                child,
                options,
                rowsById,
                rowKeys.get(child.index) ?? `virtual-row-${child.index}`,
              ),
        )}
      </tbody>
    );
  }

  private renderVirtualBodies(options: TableBodyRenderOptions) {
    const { model, plan } = options;
    if (!plan) return null;
    let lookup = this.virtualLookupCache;
    if (!lookup || lookup.rows !== model.loadedRows || lookup.groups !== model.groups) {
      lookup = {
        rows: model.loadedRows,
        groups: model.groups,
        rowsById: new Map(model.loadedRows.map(row => [row.id, row])),
        groupsById: new Map(model.groups.map(groupModel => [groupModel.group.id, groupModel])),
      };
      this.virtualLookupCache = lookup;
    }
    const { rowsById, groupsById } = lookup;
    if (!model.grouped) {
      for (const scope of this.virtualRowPoolStates.keys()) {
        if (scope !== 'flat') this.virtualRowPoolStates.delete(scope);
      }
      const rowKeys = this.virtualRowPoolKeys(plan.nodes, 'flat');
      return (
        <tbody class="ds-table__body">
          {plan.nodes.map(node =>
            node.kind === 'spacer'
              ? this.renderVirtualSpacer(node, model.totalColumns)
              : node.kind === 'row'
                ? this.renderVirtualRow(
                    node,
                    options,
                    rowsById,
                    rowKeys.get(node.index) ?? `virtual-row-${node.index}`,
                  )
                : null,
          )}
        </tbody>
      );
    }

    const activeGroupScopes = new Set(
      plan.nodes
        .filter(
          (node): node is Extract<TableVirtualNode, { kind: 'group' }> => node.kind === 'group',
        )
        .map(node => `group:${node.groupId}`),
    );
    for (const scope of this.virtualRowPoolStates.keys()) {
      if (!activeGroupScopes.has(scope)) this.virtualRowPoolStates.delete(scope);
    }
    return plan.nodes.map(node => {
      if (node.kind === 'spacer') {
        return (
          <tbody class="ds-table__body ds-table__virtual-pad" aria-hidden="true" key={node.key}>
            {this.renderVirtualSpacer(node, model.totalColumns)}
          </tbody>
        );
      }
      if (node.kind === 'group') {
        return this.renderVirtualGroup(node, options, rowsById, groupsById);
      }
      return null;
    });
  }
}

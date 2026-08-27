import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampTableColumnSize,
  deriveTableSelectionState,
  formatTableResultSummary,
  formatTableTotalSummary,
  hasOwnedTableFooterSlot,
  isOwnedTableFooterSlot,
  isTableCellIcon,
  isTableCellIconText,
  isTableGroupIntent,
  nextTableGroupsCollapsed,
  nextTableSortState,
  resolvedTableGroupCount,
  tableCellPrimary,
  tableCollapseAllHost,
  tableColumnSize,
  tableElasticSpacerIndex,
  tableExplicitMinWidth,
  tableGroupIntentClass,
  tableGroupLabelColor,
  tableModelIssues,
  tableRowSelectionLabel,
  toggleAllLoadedTableRows,
  toggleTableGroupCollapsed,
  toggleTableGroupSelection,
  toggleTableRowSelection,
} from '../src/wc/components/Table/table-model';
import type { TableColumn, TableRow } from '../src/wc/components/Table/table-types';

const columns: TableColumn[] = [
  { id: 'name', header: 'Name', size: 160, minSize: 120, maxSize: 200 },
  { id: 'score', header: 'Score', size: 80, align: 'end', sortable: true },
];

const rows: TableRow[] = [
  { id: 'a', cells: { name: { primary: 'Avery', secondary: 'Driver' }, score: 98 } },
  { id: 'b', cells: { name: 'Blair', score: 92 }, selectable: false },
  { id: 'c', cells: { name: 'Casey', score: 87 }, disabled: true },
  { id: 'd', cells: { name: 'Devon', score: 84 } },
];

test('keeps controlled member sorting binary', () => {
  assert.deepEqual(nextTableSortState(null, 'score'), { columnId: 'score', direction: 'asc' });
  assert.deepEqual(nextTableSortState({ columnId: 'score', direction: 'asc' }, 'score'), {
    columnId: 'score',
    direction: 'desc',
  });
  assert.deepEqual(nextTableSortState({ columnId: 'score', direction: 'desc' }, 'score'), {
    columnId: 'score',
    direction: 'asc',
  });
  assert.deepEqual(nextTableSortState({ columnId: 'name', direction: 'desc' }, 'score'), {
    columnId: 'score',
    direction: 'asc',
  });
});

test('derives loaded selection while excluding non-selectable and disabled rows', () => {
  assert.deepEqual(deriveTableSelectionState(rows, ['a', 'not-loaded']), {
    selectableRowIds: ['a', 'd'],
    selectedLoadedCount: 1,
    allSelected: false,
    indeterminate: true,
  });

  assert.deepEqual(toggleTableRowSelection(['a'], rows[1]), ['a']);
  assert.deepEqual(toggleTableRowSelection(['a'], rows[3]).sort(), ['a', 'd']);
});

test('select-all preserves identities outside the loaded window', () => {
  const selected = toggleAllLoadedTableRows(['a', 'not-loaded'], rows);
  assert.deepEqual(new Set(selected), new Set(['a', 'd', 'not-loaded']));

  const cleared = toggleAllLoadedTableRows(selected, rows);
  assert.deepEqual(cleared, ['not-loaded']);
});

test('group selection toggles only the group members while preserving outsiders', () => {
  const groupRows = [rows[0], rows[3]];
  const selected = toggleTableGroupSelection(['not-loaded'], groupRows);
  assert.deepEqual(new Set(selected), new Set(['a', 'd', 'not-loaded']));

  const completed = toggleTableGroupSelection(['a', 'not-loaded'], groupRows);
  assert.deepEqual(new Set(completed), new Set(['a', 'd', 'not-loaded']));

  const cleared = toggleTableGroupSelection(selected, groupRows);
  assert.deepEqual(cleared, ['not-loaded']);
});

test('toggles collapsed group identities without mutating the input array', () => {
  const collapsed = toggleTableGroupCollapsed(['driving'], 'on-duty');
  assert.deepEqual(collapsed, ['driving', 'on-duty']);
  assert.deepEqual(toggleTableGroupCollapsed(collapsed, 'driving'), ['on-duty']);
});

test('collapses or expands every group from the current collapsed set', () => {
  assert.deepEqual(nextTableGroupsCollapsed([], ['a', 'b']), ['a', 'b']);
  assert.deepEqual(nextTableGroupsCollapsed(['a'], ['a', 'b']), ['a', 'b']);
  assert.deepEqual(nextTableGroupsCollapsed(['a', 'b'], ['a', 'b']), []);
  assert.deepEqual(nextTableGroupsCollapsed(['a', 'b', 'extra'], ['a', 'b']), []);
});

test('hosts collapse-all on the trailing action column or a scrollport overlay', () => {
  const actionColumns: TableColumn[] = [
    { id: 'name', header: 'Name' },
    { id: 'actions', kind: 'action', header: '', headerLabel: 'Actions' },
  ];
  assert.deepEqual(tableCollapseAllHost(actionColumns), {
    columnId: 'actions',
    mode: 'action',
  });

  const dualActionColumns: TableColumn[] = [
    { id: 'name', header: 'Name' },
    { id: 'action', kind: 'action', header: '', headerLabel: 'Action' },
    { id: 'borderedAction', kind: 'action', header: '', headerLabel: 'Bordered action' },
    { id: 'empty', header: 'Empty' },
  ];
  assert.deepEqual(tableCollapseAllHost(dualActionColumns), {
    columnId: 'borderedAction',
    mode: 'action',
  });

  const plainColumns: TableColumn[] = [
    { id: 'name', header: 'Name' },
    { id: 'score', header: 'Score' },
  ];
  assert.deepEqual(tableCollapseAllHost(plainColumns), { mode: 'floating' });
});

test('places an elastic spacer before trailing fixed lanes only when every column is sized', () => {
  assert.equal(tableElasticSpacerIndex(columns), 2);
  assert.equal(
    tableElasticSpacerIndex([
      { id: 'name', header: 'Name', size: 160 },
      { id: 'notes', header: 'Notes' },
      { id: 'actions', kind: 'action', header: '', headerLabel: 'Actions' },
    ]),
    undefined
  );
  assert.equal(
    tableElasticSpacerIndex([
      { id: 'name', header: 'Name', size: 160 },
      { id: 'status', header: 'Status', size: 120 },
      { id: 'identifier', header: 'Identifier', size: 140, sticky: true },
      { id: 'actions', kind: 'action', header: '', headerLabel: 'Actions' },
    ]),
    3
  );
  assert.equal(
    tableElasticSpacerIndex([
      { id: 'name', header: 'Name', size: 160 },
      { id: 'identifier', header: 'Identifier', size: 140, sticky: 'end' },
      { id: 'actions', kind: 'action', header: '', headerLabel: 'Actions' },
    ]),
    1
  );
  assert.equal(
    tableColumnSize({ id: 'actions', kind: 'action', header: '', headerLabel: 'Actions' }),
    'var(--dimension-size-500)'
  );
});

test('resolves labels, column constraints, and server group totals defensively', () => {
  assert.equal(tableRowSelectionLabel(rows[0], columns), 'Avery');
  assert.equal(
    tableRowSelectionLabel({ id: 'fallback', selectionLabel: ' Explicit ', cells: {} }, columns),
    'Explicit'
  );
  assert.equal(clampTableColumnSize({ ...columns[0], size: 80 }), 120);
  assert.equal(clampTableColumnSize({ ...columns[0], size: 240 }), 200);
  assert.equal(
    tableColumnSize({ id: 'token', header: 'Token', size: 'sm' }),
    'var(--dimension-table-column-width-sm)'
  );
  assert.equal(
    tableColumnSize({ id: 'preview', header: 'Preview', imageTracks: 2 }),
    'var(--_table-image-column-inline-size-multi)'
  );
  assert.equal(
    tableColumnSize({ id: 'preview', header: 'Preview', size: 102, imageTracks: 2 }),
    '102px'
  );
  assert.equal(tableExplicitMinWidth(columns), 'calc(160px + 80px)');
  assert.equal(
    tableExplicitMinWidth([
      { id: 'token-a', header: 'A', size: 'xs' },
      { id: 'token-b', header: 'B', size: 'md' },
    ]),
    'calc(var(--dimension-table-column-width-xs) + var(--dimension-table-column-width-md))'
  );
  assert.equal(resolvedTableGroupCount({ id: 'g', label: 'Group', totalCount: 8, rows }), 8);
  assert.equal(resolvedTableGroupCount({ id: 'g', label: 'Group', totalCount: 1, rows }), 4);
  assert.equal(
    tableCellPrimary({ kind: 'tag', label: 'Pending review', intent: 'caution' }),
    'Pending review'
  );
  assert.equal(
    tableCellPrimary({
      kind: 'tags',
      tracks: 2,
      items: [{ label: 'Harsh braking' }, { label: 'Close following' }],
    }),
    'Harsh braking, Close following'
  );
  assert.equal(
    tableCellPrimary({ kind: 'icon', icon: 'DocumentInverted', label: 'Has notes' }),
    null
  );
  assert.equal(isTableCellIcon({ kind: 'icon', icon: 'DocumentInverted' }), true);
  assert.equal(
    isTableCellIcon({ kind: 'icon-text', icon: 'VehicleTruck', primary: 'Freightliner Cascadia' }),
    false
  );
  assert.equal(
    isTableCellIconText({
      kind: 'icon-text',
      icon: 'VehicleTruck',
      primary: 'Freightliner Cascadia',
    }),
    true
  );
  assert.equal(
    tableCellPrimary({ kind: 'icon-text', icon: 'VehicleTruck', primary: 'Freightliner Cascadia' }),
    'Freightliner Cascadia'
  );
  assert.equal(
    tableCellPrimary({ kind: 'image', alt: 'Road-facing preview' }),
    'Road-facing preview'
  );
  assert.equal(
    tableCellPrimary({ kind: 'primary-text', primary: 'Vehicle', secondary: 'VH-2841' }),
    'Vehicle'
  );
  assert.equal(tableCellPrimary({ kind: 'action', actionId: 'view', label: 'View' }), 'View');
  assert.equal(
    tableCellPrimary({
      kind: 'action',
      ariaLabel: 'More actions for Avery Chen',
      items: [{ actionId: 'view', label: 'View details' }],
    }),
    'More actions for Avery Chen'
  );
  assert.equal(tableCellPrimary({ kind: 'empty' }), null);
  assert.equal(tableCellPrimary({ kind: 'blank' }), null);
});

test('formats the optional result summary footer from controlled counts', () => {
  assert.equal(formatTableResultSummary(50, 1500), 'Displaying 50 of 1,500');
  assert.equal(formatTableResultSummary(0, 0), 'Displaying 0 of 0');
  assert.equal(formatTableResultSummary(-2, 10.8), 'Displaying 0 of 10');
  assert.equal(formatTableResultSummary(12, 10), 'Displaying 10 of 10');
  assert.equal(
    formatTableResultSummary(12, 3400, 'Showing {displayed} / {total}', 'en-US'),
    'Showing 12 / 3,400'
  );
  assert.equal(formatTableResultSummary(undefined, 1500), null);
  assert.equal(formatTableResultSummary(50, undefined), null);
  assert.equal(formatTableResultSummary(Number.NaN, 10), null);
});

test('formats a total-only summary for virtual mode', () => {
  assert.equal(formatTableTotalSummary(1500), '1,500 items');
  assert.equal(formatTableTotalSummary(1, '{total} item'), '1 item');
  assert.equal(formatTableTotalSummary(-2.5), '0 items');
  assert.equal(formatTableTotalSummary(undefined), null);
});

test('treats relocated table footer slots as owned and ignores nested dialog footers', () => {
  const host = { id: 'table' } as unknown as Element;
  const ancestor = (parentElement: Element, options: { slot?: boolean; footer?: boolean } = {}) =>
    ({
      parentElement,
      hasAttribute: (name: string) => name === 'slot' && !!options.slot,
      classList: { contains: (name: string) => name === 'ds-table__footer' && !!options.footer },
    }) as unknown as Element;
  const asChild = { parentElement: host } as unknown as Element;
  const footer = ancestor(host, { footer: true });
  const relocated = { parentElement: ancestor(footer) } as unknown as Element;
  const nestedBoundary = ancestor(footer, { slot: true });
  const nestedDialog = { parentElement: ancestor(nestedBoundary) } as unknown as Element;

  assert.equal(isOwnedTableFooterSlot(asChild, host), true);
  assert.equal(isOwnedTableFooterSlot(relocated, host), true);
  assert.equal(isOwnedTableFooterSlot(nestedDialog, host), false);

  (host as Element & { querySelectorAll: () => Element[] }).querySelectorAll = () => [nestedDialog];
  assert.equal(hasOwnedTableFooterSlot(host, 'footer'), false);
  (host as Element & { querySelectorAll: () => Element[] }).querySelectorAll = () => [relocated];
  assert.equal(hasOwnedTableFooterSlot(host, 'footer-leading'), true);
});

test('maps optional group intents to class and title color recipes', () => {
  assert.equal(isTableGroupIntent('negative'), true);
  assert.equal(isTableGroupIntent('ai'), false);
  assert.equal(tableGroupIntentClass('warning'), 'ds-table__group-cell--intent-warning');
  assert.equal(tableGroupIntentClass(undefined), undefined);
  assert.equal(tableGroupLabelColor(undefined), 'primary');
  assert.equal(tableGroupLabelColor('neutral'), 'var(--color-foreground-bold-neutral)');
  assert.equal(tableGroupLabelColor('negative'), 'negative');
  assert.equal(tableGroupLabelColor('caution'), 'caution');
});

test('reports unstable model identities and impossible group counts', () => {
  const issues = tableModelIssues(
    [columns[0], { ...columns[0] }],
    [],
    [
      { id: 'same', label: 'First', rows: [rows[0]] },
      { id: 'same', label: 'Second', totalCount: 0, rows: [rows[0]] },
    ],
    true
  );

  assert.ok(issues.includes('Duplicate column id: name'));
  assert.ok(issues.includes('Duplicate group id: same'));
  assert.ok(issues.includes('Duplicate row id: a'));
  assert.ok(issues.includes('Group same totalCount is smaller than its loaded row count.'));
});

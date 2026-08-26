import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isRenderableTableActionMenu,
  isTableCellActionMenu,
  tableActionMenuSections,
  tableActionTriggerId,
} from '../src/wc/components/Table/table-action-menu';
import type { TableCellAction } from '../src/wc/components/Table/table-types';

const overflow: TableCellAction = {
  kind: 'action',
  ariaLabel: 'More actions',
  items: [
    { actionId: 'view', label: 'View details' },
    { actionId: 'edit', label: 'Edit' },
    { actionId: 'download', label: 'Download report', isInactive: true },
    { kind: 'divider' },
    { actionId: 'delete', label: 'Delete', isDestructive: true },
  ],
};

test('treats items as the overflow-menu variant', () => {
  assert.equal(isTableCellActionMenu(overflow), true);
  assert.equal(isRenderableTableActionMenu(overflow), true);
  assert.equal(isTableCellActionMenu({ kind: 'action', actionId: 'more', label: 'More' }), false);
  assert.equal(
    isRenderableTableActionMenu({ kind: 'action', actionId: 'more', label: 'More' }),
    false
  );
});

test('maps divider entries to Menu sections and drops empty runs', () => {
  assert.ok(isTableCellActionMenu(overflow));
  assert.deepEqual(tableActionMenuSections(overflow.items), [
    {
      items: [
        { value: 'view', label: 'View details' },
        { value: 'edit', label: 'Edit' },
        { value: 'download', label: 'Download report', isInactive: true },
      ],
    },
    {
      items: [{ value: 'delete', label: 'Delete', isDestructive: true }],
    },
  ]);

  assert.deepEqual(
    tableActionMenuSections([
      { kind: 'divider' },
      { actionId: 'view', label: 'View' },
      { kind: 'divider' },
      { kind: 'divider' },
      { actionId: 'edit', label: 'Edit' },
      { kind: 'divider' },
    ]),
    [{ items: [{ value: 'view', label: 'View' }] }, { items: [{ value: 'edit', label: 'Edit' }] }]
  );

  assert.equal(
    isRenderableTableActionMenu({ kind: 'action', ariaLabel: 'More', items: [] }),
    false
  );
  assert.equal(
    isRenderableTableActionMenu({
      kind: 'action',
      ariaLabel: 'More',
      items: [{ kind: 'divider' }],
    }),
    false
  );
});

test('builds stable trigger ids from table, row, and column identities', () => {
  assert.equal(
    tableActionTriggerId('ds-table-action-menu-1', 'tag variants', 'action'),
    'ds-table-action-menu-1-tag-variants-action'
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveTableCellPresentation } from '../src/wc/components/Table/table-cell-model';
import type { TableColumn } from '../src/wc/components/Table/table-types';

const column: TableColumn = { id: 'value', header: 'Value' };

test('normalizes text cells once for markup and class recipes', () => {
  assert.deepEqual(resolveTableCellPresentation(42, column), {
    kind: 'text',
    cellType: 'text',
    value: { primary: 42, fontFeature: 'tabular-nums' },
    primaryText: false,
    singleLine: true,
    variant: 'single',
    wraps: false,
  });
  assert.deepEqual(
    resolveTableCellPresentation(
      { primary: 'Driver', secondary: 'Active', secondaryColor: 'positive' },
      column,
    ),
    {
      kind: 'text',
      cellType: 'text',
      value: { primary: 'Driver', secondary: 'Active', secondaryColor: 'positive' },
      primaryText: false,
      singleLine: false,
      variant: 'multi',
      wraps: false,
    },
  );
  assert.deepEqual(
    resolveTableCellPresentation(
      {
        primary: 'Freightliner Cascadia',
        secondary: 'VEH-1042',
        href: '/vehicles/VEH-1042',
        target: '_blank',
      },
      column,
    ).value,
    {
      primary: 'Freightliner Cascadia',
      secondary: 'VEH-1042',
      href: '/vehicles/VEH-1042',
      target: '_blank',
    },
  );
  assert.equal(
    resolveTableCellPresentation(
      { kind: 'primary-text', primary: 'Driver', secondary: 42 },
      { ...column, wrap: true },
    ).variant,
    'primary-pair',
  );
});

test('preserves declarative non-text cell kinds and variants', () => {
  assert.deepEqual(resolveTableCellPresentation(null, column), {
    kind: 'empty',
    cellType: 'empty',
    value: null,
  });
  assert.equal(resolveTableCellPresentation({ kind: 'blank' }, column).kind, 'blank');
  assert.equal(
    resolveTableCellPresentation({ kind: 'icon', icon: 'Check' }, column).kind,
    'icon',
  );
  assert.equal(
    resolveTableCellPresentation({ kind: 'image', alt: 'Vehicle' }, column).kind,
    'image',
  );
  assert.equal(
    resolveTableCellPresentation(
      { kind: 'action', actionId: 'open', label: 'Open' },
      column,
    ).kind,
    'action',
  );
  const tag = resolveTableCellPresentation(
    { kind: 'tag', label: 'Active', variant: 'tag-with-text', text: 'Status' },
    column,
  );
  assert.equal(tag.kind, 'tag');
  assert.equal(tag.variant, 'tag-with-text');
});

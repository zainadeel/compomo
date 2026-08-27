import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveTableCellPresentation,
  resolveTableCellImageTracks,
  resolveTableCellTagsTracks,
  tableCellTrackStackBlockSize,
} from '../src/wc/components/Table/table-cell-model';
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
    lineClamp: 1,
  });
  assert.deepEqual(
    resolveTableCellPresentation(
      { primary: 'Driver', secondary: 'Active', secondaryColor: 'positive' },
      column
    ),
    {
      kind: 'text',
      cellType: 'text',
      value: {
        primary: 'Driver',
        secondary: [{ text: 'Active' }],
        secondaryColor: 'positive',
      },
      primaryText: false,
      singleLine: false,
      variant: 'multi',
      wraps: false,
      lineClamp: 1,
    }
  );
  assert.deepEqual(
    resolveTableCellPresentation(
      {
        primary: 'Freightliner Cascadia',
        secondary: 'VEH-1042',
        href: '/vehicles/VEH-1042',
        target: '_blank',
      },
      column
    ).value,
    {
      primary: 'Freightliner Cascadia',
      secondary: [{ text: 'VEH-1042' }],
      href: '/vehicles/VEH-1042',
      target: '_blank',
    }
  );
  assert.deepEqual(
    resolveTableCellPresentation(
      {
        primary: 'Avery Chen',
        secondary: 'DRV-1048',
        tertiary: 'Dallas, TX',
      },
      column
    ),
    {
      kind: 'text',
      cellType: 'text',
      value: {
        primary: 'Avery Chen',
        secondary: [{ text: 'DRV-1048' }],
        tertiary: [{ text: 'Dallas, TX' }],
      },
      primaryText: false,
      singleLine: false,
      variant: 'triple',
      wraps: false,
      lineClamp: 1,
    }
  );
  assert.equal(
    resolveTableCellPresentation(
      {
        primary: 'Speeding',
        secondary: [
          { text: 'High', color: 'negative' },
          { text: '45 mph over' },
          { text: 'Coachable' },
          { text: 'ignored' },
        ],
      },
      column
    ).value.secondary?.length,
    3
  );
  assert.equal(
    resolveTableCellPresentation(
      {
        kind: 'primary-text',
        primary: 'Driver',
        secondary: 42,
        tertiary: 'ignored',
      } as never,
      column
    ).variant,
    'primary-pair'
  );
  assert.equal(
    resolveTableCellPresentation(
      { kind: 'primary-text', primary: 'Driver', secondary: 42 },
      { ...column, wrap: true }
    ).variant,
    'primary-pair'
  );
});

test('preserves declarative non-text cell kinds and variants', () => {
  assert.deepEqual(resolveTableCellPresentation(null, column), {
    kind: 'empty',
    cellType: 'empty',
    value: null,
  });
  assert.equal(resolveTableCellPresentation({ kind: 'blank' }, column).kind, 'blank');
  assert.equal(resolveTableCellPresentation({ kind: 'icon', icon: 'Check' }, column).kind, 'icon');
  assert.deepEqual(
    resolveTableCellPresentation(
      {
        kind: 'icon-text',
        icon: 'VehicleTruck',
        primary: 'Freightliner Cascadia',
      },
      column
    ),
    {
      kind: 'icon-text',
      cellType: 'icon-text',
      icon: 'VehicleTruck',
      value: { primary: 'Freightliner Cascadia' },
      variant: 'single',
      wraps: false,
      lineClamp: 1,
    }
  );
  assert.deepEqual(
    resolveTableCellPresentation(
      {
        kind: 'icon-text',
        icon: 'VehicleTruck',
        iconLabel: 'Vehicle',
        primary: 'Freightliner Cascadia',
        secondary: [{ text: 'VEH-1042' }, { text: 'Class 8' }],
        href: '/vehicles/VEH-1042',
      },
      column
    ),
    {
      kind: 'icon-text',
      cellType: 'icon-text',
      icon: 'VehicleTruck',
      iconLabel: 'Vehicle',
      value: {
        primary: 'Freightliner Cascadia',
        secondary: [{ text: 'VEH-1042' }, { text: 'Class 8' }],
        href: '/vehicles/VEH-1042',
      },
      variant: 'multi',
      wraps: false,
      lineClamp: 1,
    }
  );
  assert.equal(
    resolveTableCellPresentation(
      {
        kind: 'icon-text',
        icon: 'Person',
        primary: 'Avery Chen',
        secondary: 'DRV-1048',
        tertiary: 'Dallas, TX',
      },
      column
    ).variant,
    'triple'
  );
  assert.deepEqual(resolveTableCellPresentation({ kind: 'image', alt: 'Vehicle' }, column), {
    kind: 'image',
    cellType: 'image',
    value: { kind: 'image', alt: 'Vehicle' },
    variant: 'single',
  });
  assert.deepEqual(
    resolveTableCellPresentation({ kind: 'image', alt: 'Vehicle', tracks: 2 }, column),
    {
      kind: 'image',
      cellType: 'image',
      value: { kind: 'image', alt: 'Vehicle', tracks: 2 },
      variant: 'multi',
    }
  );
  assert.deepEqual(
    resolveTableCellPresentation({ kind: 'image', alt: 'Vehicle', tracks: 3 }, column),
    {
      kind: 'image',
      cellType: 'image',
      value: { kind: 'image', alt: 'Vehicle', tracks: 3 },
      variant: 'triple',
    }
  );
  assert.equal(resolveTableCellImageTracks(undefined), 1);
  assert.equal(resolveTableCellImageTracks(2), 2);
  assert.equal(resolveTableCellImageTracks(3), 3);
  assert.equal(
    resolveTableCellPresentation({ kind: 'action', actionId: 'open', label: 'Open' }, column).kind,
    'action'
  );
  const tag = resolveTableCellPresentation(
    { kind: 'tag', label: 'Active', variant: 'tag-with-text', text: 'Status' },
    column
  );
  assert.equal(tag.kind, 'tag');
  assert.equal(tag.variant, 'tag-with-text');
  assert.deepEqual(
    resolveTableCellPresentation(
      {
        kind: 'tags',
        tracks: 5,
        items: [{ label: 'Harsh braking' }, { label: 'Close following' }],
      },
      column
    ),
    {
      kind: 'tags',
      cellType: 'tags',
      value: {
        kind: 'tags',
        tracks: 5,
        items: [{ label: 'Harsh braking' }, { label: 'Close following' }],
      },
      tracks: 5,
      variant: '5-track',
    }
  );
  assert.equal(resolveTableCellTagsTracks(0), 1);
  assert.equal(resolveTableCellTagsTracks(4.8), 4);
  assert.equal(
    tableCellTrackStackBlockSize(3),
    'calc(var(--_table-cell-track-min-block-size) + var(--dimension-space-025) + var(--dimension-size-250) + var(--dimension-space-025) + var(--dimension-size-250))'
  );
});

test('resolves wrap and maxLines into wrap geometry and a line clamp', () => {
  assert.deepEqual(resolveTableCellPresentation({ primary: 'Notes' }, { ...column, wrap: true }), {
    kind: 'text',
    cellType: 'text',
    value: { primary: 'Notes' },
    primaryText: false,
    singleLine: true,
    variant: 'single',
    wraps: true,
    lineClamp: 'none',
  });
  assert.equal(
    resolveTableCellPresentation({ primary: 'Notes' }, { ...column, maxLines: 2 }).lineClamp,
    2
  );
  assert.equal(
    resolveTableCellPresentation({ primary: 'Notes' }, { ...column, maxLines: 2 }).wraps,
    true
  );
  assert.equal(
    resolveTableCellPresentation({ primary: 'Notes', maxLines: 3 }, column).lineClamp,
    3
  );
  assert.equal(
    resolveTableCellPresentation({ primary: 'Notes', wrap: true }, { ...column, maxLines: 2 })
      .lineClamp,
    'none'
  );
  assert.equal(
    resolveTableCellPresentation({ primary: 'Notes', wrap: true, maxLines: 2 }, column).lineClamp,
    2
  );
  assert.equal(
    resolveTableCellPresentation({ primary: 'Notes', wrap: false }, { ...column, wrap: true })
      .wraps,
    false
  );
});

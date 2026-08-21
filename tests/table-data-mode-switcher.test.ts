import assert from 'node:assert/strict';
import test from 'node:test';
import {
  tableDataModeFromMenuItem,
  tableDataModeMenuItems,
} from '../src/wc/components/Table/table-data-mode-switcher';

test('builds the supported data-mode choices from the controlled mode', () => {
  assert.deepEqual(
    tableDataModeMenuItems('virtual', {
      infinite: 'Infinite scroll',
      pagination: 'Pagination + Infinite groups',
      virtual: 'Virtual scroll',
    }),
    [
      {
        label: 'Infinite scroll',
        value: 'infinite',
        isSelected: false,
      },
      {
        label: 'Pagination + Infinite groups',
        value: 'pagination',
        isSelected: false,
      },
      {
        label: 'Virtual scroll',
        value: 'virtual',
        isSelected: true,
      },
    ],
  );
});

test('accepts only supported data-mode menu values', () => {
  assert.equal(tableDataModeFromMenuItem({ label: 'Infinite', value: 'infinite' }), 'infinite');
  assert.equal(tableDataModeFromMenuItem({ label: 'Pagination', value: 'pagination' }), 'pagination');
  assert.equal(tableDataModeFromMenuItem({ label: 'Virtual', value: 'virtual' }), 'virtual');
  assert.equal(tableDataModeFromMenuItem({ label: 'Missing' }), null);
});

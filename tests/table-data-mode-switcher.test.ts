import assert from 'node:assert/strict';
import test from 'node:test';
import {
  tableDataModeFromMenuItem,
  tableDataModeMenuItems,
} from '../src/wc/components/Table/table-data-mode-switcher';

test('builds the two supported data-mode choices from the controlled mode', () => {
  assert.deepEqual(
    tableDataModeMenuItems('pagination', {
      infinite: 'Infinite scroll',
      pagination: 'Pagination + Infinite groups',
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
        isSelected: true,
      },
    ],
  );
});

test('accepts only supported data-mode menu values', () => {
  assert.equal(tableDataModeFromMenuItem({ label: 'Infinite', value: 'infinite' }), 'infinite');
  assert.equal(tableDataModeFromMenuItem({ label: 'Pagination', value: 'pagination' }), 'pagination');
  assert.equal(tableDataModeFromMenuItem({ label: 'Virtual', value: 'virtual' }), null);
  assert.equal(tableDataModeFromMenuItem({ label: 'Missing' }), null);
});

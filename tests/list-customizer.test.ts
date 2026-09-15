import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canToggleListHidden,
  listCustomizerMenuItems,
  moveListOrder,
  moveListOrderBy,
  resolveListHiddenIds,
  resolveListOrder,
  toggleListHidden,
} from '../src/wc/utils/list-customizer.ts';

const IDS = ['driver', 'vehicle', 'asset', 'motion'];
const ITEMS = IDS.map(id => ({ id, label: id[0].toUpperCase() + id.slice(1) }));

describe('list customizer order', () => {
  it('drops unknown and duplicate ids and appends anything missing', () => {
    assert.deepEqual(resolveListOrder(IDS, ['motion', 'ghost', 'motion', 'asset']), [
      'motion',
      'asset',
      'driver',
      'vehicle',
    ]);
  });

  it('moves an id before another and by an offset', () => {
    assert.deepEqual(moveListOrder([...IDS], 'motion', 'driver'), [
      'motion',
      'driver',
      'vehicle',
      'asset',
    ]);
    assert.deepEqual(moveListOrderBy([...IDS], 'driver', 2), [
      'vehicle',
      'asset',
      'driver',
      'motion',
    ]);
    assert.deepEqual(moveListOrderBy([...IDS], 'driver', 0), IDS);
  });
});

describe('list customizer visibility policy', () => {
  it('hides every item when minVisible is 0', () => {
    assert.deepEqual(resolveListHiddenIds(IDS, IDS, { minVisible: 0 }), IDS);
    assert.equal(canToggleListHidden(IDS, ['driver', 'vehicle', 'asset'], 'motion'), true);
  });

  it('keeps minVisible items visible and restores in catalog order', () => {
    // Table's policy: the last visible entry cannot be hidden.
    assert.equal(
      canToggleListHidden(IDS, ['vehicle', 'asset', 'motion'], 'driver', {
        minVisible: 1,
      }),
      false
    );
    // Over-hidden input restores the first catalog id, not whichever came last.
    assert.deepEqual(
      resolveListHiddenIds(IDS, ['motion', 'asset', 'vehicle', 'driver'], {
        minVisible: 1,
      }),
      ['motion', 'asset', 'vehicle']
    );
  });

  it('toggles hidden state and refuses a toggle the policy blocks', () => {
    assert.deepEqual(toggleListHidden(IDS, [], 'asset', { minVisible: 1 }), ['asset']);
    assert.deepEqual(toggleListHidden(IDS, ['asset'], 'asset', { minVisible: 1 }), []);

    const oneLeft = ['vehicle', 'asset', 'motion'];
    assert.deepEqual(toggleListHidden(IDS, oneLeft, 'driver', { minVisible: 1 }), oneLeft);
    assert.deepEqual(toggleListHidden(IDS, oneLeft, 'driver', { minVisible: 0 }), [
      'vehicle',
      'asset',
      'motion',
      'driver',
    ]);
  });
});

describe('list customizer menu rows', () => {
  it('builds toggle-only rows with no drag handle and nothing locked', () => {
    const rows = listCustomizerMenuItems(ITEMS, ['asset'], undefined, { minVisible: 0 });

    assert.deepEqual(
      rows.map(row => row.value),
      IDS
    );
    assert.equal(
      rows.every(row => row.showSwitch === true && row.reorderable === false),
      true
    );
    assert.equal(
      rows.every(row => row.isInactive === false),
      true,
      'every entry stays hideable when minVisible is 0'
    );
    assert.equal(rows.find(row => row.value === 'asset')?.switchValue, false);
  });

  it('locks the last visible row and prefixes drag handles for a table', () => {
    const rows = listCustomizerMenuItems(ITEMS, ['vehicle', 'asset', 'motion'], undefined, {
      minVisible: 1,
      reorderable: true,
    });

    assert.equal(
      rows.every(row => row.reorderable === true),
      true
    );
    assert.equal(rows.find(row => row.value === 'driver')?.isInactive, true);
    assert.equal(rows.find(row => row.value === 'asset')?.isInactive, false);
  });

  it('follows the supplied order', () => {
    const rows = listCustomizerMenuItems(ITEMS, undefined, ['motion', 'driver'], {});
    assert.deepEqual(
      rows.map(row => row.value),
      ['motion', 'driver', 'vehicle', 'asset']
    );
  });
});

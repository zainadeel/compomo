import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveTabLabel,
  tabsOverflowContainer,
  tabsToMenuSections,
} from '../src/wc/components/BarNav/bar-nav-tabs-menu-utils';

describe('tabsToMenuSections', () => {
  it('maps tabs to a single section', () => {
    const sections = tabsToMenuSections(
      [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
      ],
      'b',
    );
    assert.equal(sections.length, 1);
    assert.deepEqual(sections[0].items, [
      { label: 'Alpha', value: 'a', isSelected: false, isInactive: undefined },
      { label: 'Beta', value: 'b', isSelected: true, isInactive: undefined },
    ]);
  });

  it('splits sections at dividers', () => {
    const sections = tabsToMenuSections(
      [
        { id: 'a', label: 'Alpha' },
        { type: 'divider' },
        { id: 'b', label: 'Beta' },
      ],
      'b',
    );
    assert.equal(sections.length, 2);
    assert.equal(sections[0].items[0].value, 'a');
    assert.equal(sections[1].items[0].value, 'b');
  });
});

describe('getActiveTabLabel', () => {
  it('returns the selected tab label', () => {
    assert.equal(
      getActiveTabLabel([{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }], 'b'),
      'Beta',
    );
  });
});

describe('tabsOverflowContainer', () => {
  it('collapses when content exceeds width', () => {
    assert.equal(tabsOverflowContainer(500, 400, false), true);
  });

  it('stays collapsed until there is spare room', () => {
    assert.equal(tabsOverflowContainer(397, 400, true), false);
    assert.equal(tabsOverflowContainer(401, 400, true), true);
  });
});

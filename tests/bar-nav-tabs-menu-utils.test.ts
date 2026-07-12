import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveTabLabel,
  tabsOverflowContainer,
  tabsToMenuSections,
  tabsToOverflowMenuSections,
  trimTrailingDividers,
  visibleTabCountForWidth,
} from '../src/wc/components/BarNav/bar-nav-tabs-menu-utils';

describe('tabsToMenuSections', () => {
  it('maps tabs to a single section', () => {
    const sections = tabsToMenuSections(
      [
        { id: 'a', label: 'Alpha', dot: true },
        { id: 'b', label: 'Beta' },
      ],
      'b',
    );
    assert.equal(sections.length, 1);
    assert.deepEqual(sections[0].items, [
      { label: 'Alpha', value: 'a', dot: true, isSelected: false, isInactive: undefined },
      { label: 'Beta', value: 'b', dot: undefined, isSelected: true, isInactive: undefined },
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

describe('tabsToOverflowMenuSections', () => {
  it('drops leading dividers from overflow-only menus', () => {
    const sections = tabsToOverflowMenuSections(
      [
        { type: 'divider' },
        { id: 'events', label: 'Events' },
      ],
      'events',
    );
    assert.equal(sections.length, 1);
    assert.equal(sections[0].items[0].value, 'events');
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

describe('visibleTabCountForWidth', () => {
  it('returns all tabs when the full row fits', () => {
    assert.equal(visibleTabCountForWidth([64, 80, 72], 260, 40, 4, 10), 3);
  });

  it('reserves space for the overflow trigger when tabs do not all fit', () => {
    assert.equal(visibleTabCountForWidth([64, 80, 72], 180, 40, 4, 10), 1);
  });

  it('returns zero when no tab fits beside the overflow trigger', () => {
    assert.equal(visibleTabCountForWidth([96, 80], 88, 40, 4, 10), 0);
  });
});

describe('trimTrailingDividers', () => {
  it('removes dividers at the end of visible tab slices', () => {
    assert.deepEqual(
      trimTrailingDividers([
        { id: 'live-map', label: 'Live Map' },
        { type: 'divider' },
      ]),
      [{ id: 'live-map', label: 'Live Map' }],
    );
  });
});

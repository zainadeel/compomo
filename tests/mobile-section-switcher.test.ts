import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveMobileSectionPosition } from '../src/wc/components/MobileSectionSwitcher/mobile-section-switcher-utils';

const sections = [
  { id: 'live-map', label: 'Live Map' },
  { id: 'location-history', label: 'Location History' },
  { type: 'divider' as const },
  { id: 'trips', label: 'Trips' },
];

describe('resolveMobileSectionPosition', () => {
  it('exposes only the next direction on the first selectable section', () => {
    assert.deepEqual(resolveMobileSectionPosition(sections, 'live-map'), {
      selectedIndex: 0,
      selected: sections[0],
      hasPrevious: false,
      hasNext: true,
    });
  });

  it('ignores dividers and exposes both directions in the middle', () => {
    assert.deepEqual(resolveMobileSectionPosition(sections, 'location-history'), {
      selectedIndex: 1,
      selected: sections[1],
      hasPrevious: true,
      hasNext: true,
    });
  });

  it('exposes only the previous direction on the last selectable section', () => {
    const position = resolveMobileSectionPosition(sections, 'trips');
    assert.equal(position.selectedIndex, 2);
    assert.equal(position.hasPrevious, true);
    assert.equal(position.hasNext, false);
  });
});

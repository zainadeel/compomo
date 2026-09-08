import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  barTitleSectionMenuSections,
  barTitleSectionTriggerAriaLabel,
  barTitleSectionsDigest,
  barTitleSectionsToTabs,
  effectiveBarTitleSectionValue,
  selectableBarTitleSections,
  selectedBarTitleSectionLabel,
} from '../src/wc/components/BarTitle/bar-title-sections';
import type { BarTitleSectionItem } from '../src/wc/components/BarTitle/bar-title-types';

const sections: BarTitleSectionItem[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'history', label: 'History' },
  { type: 'divider' },
  { id: 'settings', label: 'Settings', isInactive: true },
];

describe('BarTitle shared section helpers', () => {
  it('ignores dividers when resolving selectable sections and the effective value', () => {
    assert.deepEqual(
      selectableBarTitleSections(sections).map(section => section.id),
      ['summary', 'history', 'settings']
    );
    assert.equal(effectiveBarTitleSectionValue(sections, 'history'), 'history');
    assert.equal(effectiveBarTitleSectionValue(sections, 'missing'), 'summary');
    assert.equal(selectedBarTitleSectionLabel(sections, 'history'), 'History');
  });

  it('builds menu groups from dividers and maps sections onto tab items', () => {
    const groups = barTitleSectionMenuSections(sections, 'summary');
    assert.deepEqual(
      groups.map(section => section.items.map(item => item.value)),
      [['summary', 'history'], ['settings']]
    );
    assert.equal(groups[0]?.items[0]?.isSelected, true);
    assert.equal(groups[1]?.items[0]?.isInactive, true);
    assert.equal(
      barTitleSectionTriggerAriaLabel('Change driver section', 'Summary'),
      'Change driver section. Current section: Summary'
    );
    assert.deepEqual(
      barTitleSectionsToTabs(sections).map(item => ('type' in item ? 'divider' : item.id)),
      ['summary', 'history', 'divider', 'settings']
    );
  });

  it('treats equivalent section arrays as the same layout identity', () => {
    assert.equal(barTitleSectionsDigest(sections), barTitleSectionsDigest([...sections]));
    assert.notEqual(
      barTitleSectionsDigest(sections),
      barTitleSectionsDigest([
        { id: 'summary', label: 'Summary' },
        { id: 'history', label: 'History' },
      ])
    );
  });
});

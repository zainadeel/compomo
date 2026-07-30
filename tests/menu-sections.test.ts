import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { snapshotMenuSections } from '../src/wc/components/Menu/menu-sections';
import type { MenuSection } from '../src/wc/components/Menu/menu-types';

describe('snapshotMenuSections', () => {
  it('deep-copies rows and nested swatch options for stable exit rendering', () => {
    const source: MenuSection[] = [
      { items: [{ id: 'settings', label: 'Settings' }] },
      {
        variant: 'swatch-picker',
        value: 'blue',
        sections: [{
          label: 'Themes',
          options: [{ value: 'blue', label: 'Blue', background: '#00f' }],
        }],
      },
    ];
    const snapshot = snapshotMenuSections(source);

    assert.notEqual(snapshot[0], source[0]);
    assert.notEqual(
      snapshot[1].variant === 'swatch-picker' ? snapshot[1].sections?.[0].options[0] : null,
      source[1].variant === 'swatch-picker' ? source[1].sections?.[0].options[0] : null
    );
    assert.deepEqual(snapshot, source);
  });
});

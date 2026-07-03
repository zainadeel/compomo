import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { tabsOverflowContainer } from '../src/wc/components/BarNav/bar-nav-tabs-menu-utils';

describe('tabsOverflowContainer hysteresis', () => {
  it('keeps collapsed state when width gap is within hysteresis band', () => {
    assert.equal(tabsOverflowContainer(392, 390, true, 8), true);
    assert.equal(tabsOverflowContainer(392, 390, false, 8), false);
  });

  it('requires a larger gap before collapsing when expanded (8px hysteresis)', () => {
    assert.equal(tabsOverflowContainer(395, 390, false, 8), false);
    assert.equal(tabsOverflowContainer(401, 390, false, 8), true);
  });
});

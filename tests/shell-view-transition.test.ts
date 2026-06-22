import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SHELL_BAR_NAV_VT_NAME } from '../src/wc/nav/shell-view-transition';

describe('SHELL_BAR_NAV_VT_NAME', () => {
  it('matches ds-bar-nav view-transition-name', () => {
    assert.equal(SHELL_BAR_NAV_VT_NAME, 'ds-shell-bar-nav');
  });
});

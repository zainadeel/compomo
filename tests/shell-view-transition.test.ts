import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SHELL_BAR_NAV_VT_NAME,
  SHELL_NAV_REVEAL_DURATION_VAR,
  SHELL_NAV_REVEAL_EASING_VAR,
} from '../src/wc/nav/shell-view-transition';

describe('SHELL_BAR_NAV_VT_NAME', () => {
  it('matches ds-bar-nav view-transition-name', () => {
    assert.equal(SHELL_BAR_NAV_VT_NAME, 'ds-shell-bar-nav');
  });
});

describe('shell nav reveal motion tokens', () => {
  it('uses medium-3 duration and ease-in-out easing vars', () => {
    assert.equal(SHELL_NAV_REVEAL_DURATION_VAR, '--effect-animation-duration-medium-3');
    assert.equal(SHELL_NAV_REVEAL_EASING_VAR, '--effect-animation-easing-ease-in-out');
  });
});

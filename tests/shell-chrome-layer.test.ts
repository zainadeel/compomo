import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shellChromeLayerActive } from '../src/wc/nav/shell-gradient';

describe('shellChromeLayerActive', () => {
  it('is false when both wash and grid are off', () => {
    assert.equal(shellChromeLayerActive(false, false), false);
  });

  it('is true when only gradient wash is on', () => {
    assert.equal(shellChromeLayerActive(true, false), true);
  });

  it('is true when only grid is on', () => {
    assert.equal(shellChromeLayerActive(false, true), true);
  });

  it('is true when both are on', () => {
    assert.equal(shellChromeLayerActive(true, true), true);
  });
});

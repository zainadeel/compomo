import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shellChromeLayerActive } from '../src/wc/nav/shell-gradient';

describe('shellChromeLayerActive', () => {
  it('is false when gradient is off', () => {
    assert.equal(shellChromeLayerActive(false), false);
  });

  it('is true when gradient is on', () => {
    assert.equal(shellChromeLayerActive(true), true);
  });
});

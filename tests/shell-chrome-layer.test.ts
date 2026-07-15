import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shellChromeLayerActive } from '../src/wc/shell/shell-gradient';

describe('shellChromeLayerActive', () => {
  it('is false for the solid chrome preset', () => {
    assert.equal(shellChromeLayerActive('none'), false);
  });

  it('is true for a wash preset', () => {
    assert.equal(shellChromeLayerActive('neutral'), true);
  });
});

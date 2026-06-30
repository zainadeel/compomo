import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  scrollEdgeFadeMaskImage,
  SCROLL_EDGE_FADE_SIZE_VAR,
} from '../src/wc/utils/scroll-edge-fade';

describe('scrollEdgeFadeMaskImage', () => {
  it('builds bottom fade using the size custom property', () => {
    const mask = scrollEdgeFadeMaskImage('bottom');
    assert.match(mask, /linear-gradient\(to bottom/);
    assert.match(mask, new RegExp(`calc\\(100% - var\\(${SCROLL_EDGE_FADE_SIZE_VAR}`));
  });

  it('builds top fade with a solid midpoint', () => {
    const mask = scrollEdgeFadeMaskImage('top');
    assert.match(mask, /#000 0, #000 50%, transparent 100%/);
  });
});

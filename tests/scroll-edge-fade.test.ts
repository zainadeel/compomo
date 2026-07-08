import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isScrollAtEdge,
  resolveScrollEdgeFadeSize,
  scrollEdgeFadeClassMap,
  scrollEdgeFadeMaskImage,
  scrollEdgeFadeSizeStyle,
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

describe('resolveScrollEdgeFadeSize', () => {
  it('maps dimension size tokens to CSS variables', () => {
    assert.equal(resolveScrollEdgeFadeSize('size-600'), 'var(--dimension-size-600)');
  });

  it('passes through raw CSS lengths', () => {
    assert.equal(resolveScrollEdgeFadeSize('24px'), '24px');
  });

  it('prefers deprecated height alias when provided', () => {
    assert.equal(resolveScrollEdgeFadeSize('size-600', '32px'), '32px');
  });
});

describe('scrollEdgeFadeSizeStyle', () => {
  it('sets the fade depth custom property', () => {
    assert.equal(
      scrollEdgeFadeSizeStyle('size-500')[SCROLL_EDGE_FADE_SIZE_VAR],
      'var(--dimension-size-500)',
    );
  });
});

describe('scrollEdgeFadeClassMap', () => {
  it('adds edge modifiers and at-end when the edge is flush', () => {
    const classes = scrollEdgeFadeClassMap({
      edges: 'bottom',
      atEnd: { bottom: true },
    });
    assert.equal(classes['scroll-edge-fade'], true);
    assert.equal(classes['scroll-edge-fade--bottom'], true);
    assert.equal(classes['scroll-edge-fade--at-end'], true);
  });

  it('keeps the mask when not at end', () => {
    const classes = scrollEdgeFadeClassMap({
      edges: 'bottom',
      atEnd: { bottom: false },
    });
    assert.equal(classes['scroll-edge-fade--at-end'], undefined);
  });

  it('supports hidden to force the mask off', () => {
    const classes = scrollEdgeFadeClassMap({ edges: 'top', hidden: true });
    assert.equal(classes['scroll-edge-fade--hidden'], true);
  });
});

describe('isScrollAtEdge', () => {
  it('detects bottom flush within threshold', () => {
    const el = {
      scrollHeight: 200,
      scrollTop: 100,
      clientHeight: 98,
      scrollWidth: 0,
      scrollLeft: 0,
      clientWidth: 0,
    } as HTMLElement;
    assert.equal(isScrollAtEdge(el, 'bottom'), true);
  });

  it('detects when content still scrolls below', () => {
    const el = {
      scrollHeight: 400,
      scrollTop: 0,
      clientHeight: 200,
      scrollWidth: 0,
      scrollLeft: 0,
      clientWidth: 0,
    } as HTMLElement;
    assert.equal(isScrollAtEdge(el, 'bottom'), false);
  });
});

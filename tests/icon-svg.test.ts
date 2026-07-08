import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidIconSvgRoot, type IconSvgElementLike } from '../src/wc/components/Icon/icon-svg.ts';

function el(
  localName: string,
  attrs: Record<string, string> = {},
  children: IconSvgElementLike[] = [],
): IconSvgElementLike {
  return {
    localName,
    getAttributeNames: () => Object.keys(attrs),
    getAttribute: (name: string) => attrs[name] ?? null,
    children,
  };
}

describe('icon svg validation', () => {
  it('accepts a typical IcoMo glyph tree', () => {
    const glyph = el('svg', { viewBox: '0 0 24 24', fill: 'none' }, [
      el('path', { d: 'M4 4h16v16H4z', fill: 'currentColor' }),
      el('g', {}, [el('circle', { cx: '12', cy: '12', r: '4' })]),
    ]);
    assert.equal(isValidIconSvgRoot(glyph), true);
  });

  it('rejects a root that is not <svg>', () => {
    assert.equal(isValidIconSvgRoot(el('div')), false);
    assert.equal(isValidIconSvgRoot(null), false);
  });

  it('rejects executable and foreign-content elements anywhere in the tree', () => {
    for (const bad of ['script', 'foreignObject', 'iframe', 'object', 'embed']) {
      const glyph = el('svg', {}, [el('g', {}, [el(bad)])]);
      assert.equal(isValidIconSvgRoot(glyph), false, `expected <${bad}> to be rejected`);
    }
  });

  it('rejects event-handler attributes in any casing', () => {
    assert.equal(isValidIconSvgRoot(el('svg', { onclick: 'x()' })), false);
    assert.equal(isValidIconSvgRoot(el('svg', {}, [el('path', { onLoad: 'x()' })])), false);
    assert.equal(isValidIconSvgRoot(el('svg', {}, [el('path', { ONERROR: 'x()' })])), false);
  });

  it('rejects non-internal href targets, allows fragment references', () => {
    assert.equal(isValidIconSvgRoot(el('svg', {}, [el('use', { href: '#glyph' })])), true);
    assert.equal(
      isValidIconSvgRoot(el('svg', {}, [el('use', { href: 'javascript:alert(1)' })])),
      false,
    );
    assert.equal(
      isValidIconSvgRoot(el('svg', {}, [el('use', { 'xlink:href': 'https://evil.example/x.svg#g' })])),
      false,
    );
    assert.equal(isValidIconSvgRoot(el('svg', {}, [el('image', { href: 'data:image/svg+xml,x' })])), false);
  });
});

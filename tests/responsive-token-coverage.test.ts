import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseCss } from './helpers/css-contracts';

test('the mobile profile covers every independent TokoMo spatial length', () => {
  const profile = parseCss(readFileSync('src/wc/styles/responsive.css', 'utf8'));
  const mappings = new Set<string>();
  profile.walkDecls(declaration => {
    mappings.add(declaration.prop);
  });
  for (const category of ['dimensions', 'typography']) {
    const tokens = parseCss(
      readFileSync(`node_modules/@ds-mo/tokens/dist/${category}.css`, 'utf8')
    );
    const lengths = new Set<string>();
    tokens.walkDecls(declaration => {
      if (!/^--/.test(declaration.prop) || !/^-?[\d.]+(?:px|rem|em)$/.test(declaration.value))
        return;
      // Base feeds the scales; the full-round sentinel retains its pill meaning.
      if (
        ['--dimension-base', '--dimension-radius-half'].includes(declaration.prop) ||
        parseFloat(declaration.value) === 0
      )
        return;
      lengths.add(declaration.prop);
    });
    assert.ok(lengths.size > 0, `No lengths found in ${category}`);
    for (const token of lengths)
      assert.ok(
        mappings.has(token),
        `${token} needs a responsive mapping or an intentional exemption`
      );
  }
});

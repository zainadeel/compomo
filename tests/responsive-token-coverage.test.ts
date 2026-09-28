import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('the mobile profile covers every independent TokoMo spatial length', () => {
  const profile = readFileSync('src/wc/styles/responsive.css', 'utf8');
  for (const category of ['dimensions', 'typography']) {
    const tokens = readFileSync(`node_modules/@ds-mo/tokens/dist/${category}.css`, 'utf8');
    const lengths = [...tokens.matchAll(/(--[\w-]+):\s*(-?[\d.]+)(?:px|rem|em)\s*;/g)];
    assert.ok(lengths.length > 0, `No lengths found in ${category}`);
    for (const [, token, value] of lengths) {
      // Base feeds the category scales; the full-round sentinel keeps its pill meaning.
      if (['--dimension-base', '--dimension-radius-half'].includes(token) || Number(value) === 0)
        continue;
      assert.ok(
        profile.includes(`${token}:`),
        `${token} needs an explicit responsive mapping or an intentional exemption`
      );
    }
  }
});

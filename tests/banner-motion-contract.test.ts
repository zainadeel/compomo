import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/wc/components/Banner/Banner.tsx', 'utf8');
const styles = readFileSync('src/wc/components/Banner/Banner.css', 'utf8');

test('Banner delegates entry motion to CSS starting styles without a frame scheduler', () => {
  assert.match(styles, /@starting-style\s*{/);
  assert.match(styles, /:host\(\.banner--open\)\s*{[^}]*grid-template-rows:\s*0fr/s);
  assert.doesNotMatch(source, /requestAnimationFrame|cancelAnimationFrame|openFrame/);
});

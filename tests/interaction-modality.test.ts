import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('shared focus targets suppress touch chrome without weakening keyboard focus', () => {
  const css = read('src/wc/utils/focus-ring.css');

  assert.match(
    css,
    /:host\(\.ds-focus-ring\),[\s\S]*?\.ds-focus-ring-inset\s*{[\s\S]*?outline: none;[\s\S]*?-webkit-tap-highlight-color: transparent;[\s\S]*?touch-action: manipulation;/,
  );
  assert.match(
    css,
    /:host\(\.ds-focus-ring:focus-visible\),[\s\S]*?outline: var\(--ds-focus-ring-width\) solid var\(--ds-focus-ring-color\);/,
  );
  assert.match(
    css,
    /:host\(\.ds-focus-ring-inset:focus-visible\)::after,[\s\S]*?outline: var\(--ds-focus-ring-width\) solid var\(--ds-focus-ring-color\);/,
  );
});

test('shared hover wash is limited to hover-capable fine pointers', () => {
  const css = read('src/wc/utils/interaction-fill.css');
  const guardedHover =
    /@media \(hover: hover\) and \(pointer: fine\)\s*{[\s\S]*?:host\(\.ds-interaction-fill:hover:not\(:disabled\)\)::after,[\s\S]*?background: var\(--ds-interaction-hover\);[\s\S]*?}/;

  assert.match(css, guardedHover);
  assert.match(
    css,
    /:host\(\.ds-interaction-fill:active:not\(:disabled\)\)::after,[\s\S]*?background: var\(--ds-interaction-pressed\);/,
  );
});

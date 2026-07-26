import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('chrome spacing defines matching padding and gap without owning size', () => {
  const css = read('src/wc/utils/chrome-layout.css');
  const recipes = {
    sm: '050',
    md: '100',
    lg: '200',
  } as const;

  for (const [size, token] of Object.entries(recipes)) {
    assert.match(
      css,
      new RegExp(
        `\\.ds-chrome-space--${size}[\\s\\S]*?--ds-chrome-padding: var\\(--dimension-space-${token}\\);[\\s\\S]*?--ds-chrome-gap: var\\(--dimension-space-${token}\\);`,
      ),
    );
  }

  assert.doesNotMatch(css, /(?:^|[;{]\s*)(?:min-|max-)?(?:width|height)\s*:/m);
  assert.match(css, /box-sizing: border-box/);
});

test('CardSetting pilots md row chrome while retaining explicit 48px ownership', () => {
  const source = read('src/wc/components/CardSetting/CardSetting.tsx');
  const css = read('src/wc/components/CardSetting/CardSetting.css');

  assert.match(source, /card-setting__header ds-chrome-row ds-chrome-space--md/);
  assert.match(css, /@import ['"]\.\.\/\.\.\/utils\/chrome-layout\.css['"];/);
  assert.match(
    css,
    /\.card-setting__header\s*{[\s\S]*?height: var\(--dimension-size-600\);/,
  );
  assert.doesNotMatch(
    css,
    /\.card-setting__header\s*{[^}]*(?:padding|gap): var\(--dimension-space-100\);/,
  );
});

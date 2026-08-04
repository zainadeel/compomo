import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(root, 'src/wc');
const cssFiles = fs
  .readdirSync(sourceRoot, { recursive: true })
  .filter(file => typeof file === 'string' && file.endsWith('.css'))
  .sort();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(sourceRoot, relativePath), 'utf8');

test('OS system-color keywords stay centralized in the forced-colors utility', () => {
  const systemColorOwners = cssFiles.filter(file =>
    /\b(?:Canvas|CanvasText|ButtonText|Highlight|HighlightText|GrayText)\b/.test(
      read(file)
    )
  );

  assert.deepEqual(systemColorOwners, ['utils/forced-colors.css']);
});

test('authored colors survive forced colors only for approved information marks', () => {
  const optOutOwners = cssFiles
    .filter(file => /forced-color-adjust:\s*none/.test(read(file)))
    .sort();

  assert.deepEqual(optOutOwners, [
    'components/Chart/Chart.css',
    'components/ChartLegend/ChartLegend.css',
    'components/SwatchPicker/SwatchPicker.css',
  ]);

  for (const file of optOutOwners) {
    assert.match(
      read(file),
      /@media \(forced-colors: active\)\s*{[\s\S]*forced-color-adjust:\s*none/,
      `${file} must keep the opt-out inside forced-colors mode`,
    );
  }
});

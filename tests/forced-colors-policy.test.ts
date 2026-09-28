import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import valueParser from 'postcss-value-parser';
import { parseCss } from './helpers/css-contracts';

const sourceRoot = 'src/wc';
const stylesheets = fs
  .readdirSync(sourceRoot, { recursive: true, encoding: 'utf8' })
  .filter(file => file.endsWith('.css'))
  .map(file => ({ file, css: parseCss(fs.readFileSync(path.join(sourceRoot, file), 'utf8')) }));

test('OS system-color keywords stay centralized in the forced-colors utility', () => {
  const owners = new Set<string>();
  for (const { file, css } of stylesheets)
    css.walkDecls(declaration => {
      valueParser(declaration.value).walk(node => {
        if (
          node.type === 'word' &&
          /^(Canvas|CanvasText|ButtonText|Highlight|HighlightText|GrayText)$/i.test(node.value)
        )
          owners.add(file);
      });
    });
  assert.deepEqual([...owners], ['utils/forced-colors.css']);
});

test('authored colors survive forced colors only for approved information marks', () => {
  const owners = new Set<string>();
  for (const { file, css } of stylesheets)
    css.walkDecls('forced-color-adjust', declaration => {
      if (declaration.value !== 'none') return;
      owners.add(file);
      let guarded = false;
      for (
        let parent = declaration.parent;
        parent && parent.type !== 'root';
        parent = parent.parent
      )
        if (
          parent.type === 'atrule' &&
          parent.name === 'media' &&
          /^\(\s*forced-colors\s*:\s*active\s*\)$/.test(parent.params)
        )
          guarded = true;
      assert.ok(guarded, `${file} must keep the opt-out inside forced-colors mode`);
    });
  assert.deepEqual([...owners].sort(), [
    'components/Chart/Chart.css',
    'components/ChartLegend/ChartLegend.css',
    'components/SwatchPicker/SwatchPicker.css',
  ]);
});

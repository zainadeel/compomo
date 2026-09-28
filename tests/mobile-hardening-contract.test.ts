import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import selectorParser from 'postcss-selector-parser';
import { parseCss } from './helpers/css-contracts';

test('authored hover selectors require a hover-capable fine pointer', () => {
  const root = 'src/wc';
  for (const file of fs
    .readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter(file => file.endsWith('.css'))) {
    const css = parseCss(fs.readFileSync(path.join(root, file), 'utf8'));
    css.walkRules(rule => {
      let hasHover = false;
      selectorParser(selectors => {
        selectors.walkPseudos(node => {
          if (node.value === ':hover') hasHover = true;
        });
      }).processSync(rule.selector);
      if (!hasHover) return;
      let guarded = false;
      for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
        if (parent.type !== 'atrule' || parent.name !== 'media') continue;
        // Every alternative must require both capabilities; negated/or clauses are not a guard.
        if (
          parent.params
            .split(',')
            .every(
              query =>
                !/\b(?:not|or)\b/.test(query) &&
                /\(\s*hover\s*:\s*hover\s*\)/.test(query) &&
                /\(\s*pointer\s*:\s*fine\s*\)/.test(query)
            )
        )
          guarded = true;
      }
      assert.ok(guarded, `${file}:${rule.source?.start?.line} has an unguarded :hover selector`);
    });
  }
});

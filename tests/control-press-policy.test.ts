import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import selectorParser from 'postcss-selector-parser';
import { assertDeclarations, cssDeclarations, parseCss } from './helpers/css-contracts';

test('shared press recipe retains resting geometry and respects reduced motion', () => {
  const css = parseCss(fs.readFileSync('src/wc/utils/control-press.css', 'utf8'));
  const resting = '.ds-control-press-scale';
  const pressed = `${resting}:active:not(:disabled):not(.ds-control-inactive):not([aria-busy='true'])`;
  assert.ok(!cssDeclarations(css, resting).has('scale'));
  assertDeclarations(css, resting, { transition: 'scale var(--effect-motion-short-2)' });
  assertDeclarations(css, pressed, {
    scale: 'var(--ds-control-press-active-scale, var(--dimension-scale-subtle))',
  });
  assertDeclarations(css, pressed, { scale: 'none', transition: 'none' }, [
    '@media (prefers-reduced-motion: reduce)',
  ]);
});

test('component CSS delegates active scale feedback to the shared press policy', () => {
  const root = 'src/wc/components';
  for (const file of fs
    .readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter(file => file.endsWith('.css'))) {
    const css = parseCss(fs.readFileSync(path.join(root, file), 'utf8'));
    css.walkRules(rule => {
      let active = false;
      selectorParser(selectors => {
        selectors.walkPseudos(node => {
          if (node.value === ':active') active = true;
        });
      }).processSync(rule.selector);
      if (!active) return;
      rule.walkDecls(declaration => {
        assert.ok(
          !['scale', 'transform'].includes(declaration.prop),
          `${file}: ${rule.selector} must use the shared press policy`
        );
      });
    });
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertClassesInWhere,
  assertDeclarations,
  cssImports,
  parseCss,
} from './helpers/css-contracts';

test('CSS recipes ignore declaration/selector order and insignificant whitespace', () => {
  for (const source of [
    '.other, .surface { gap: var(--space); display: flex; }',
    '.surface,.other{display : flex; /* recipe */ gap:var( --space )}',
    '.surface {display:flex} .other,.surface {gap:var(--space)}',
    '.surface {display:flex; gap:0} .surface {gap:var(--space)}',
  ])
    assertDeclarations(parseCss(source), '.surface', { display: 'flex', gap: 'var(--space)' });
  assert.deepEqual(
    cssImports(parseCss('@import "./one.css"; @import url(\'./two.css\');')),
    new Set(['./one.css', './two.css'])
  );
  assertDeclarations(
    parseCss(".surface[data-mode='open'] { display: flex; }"),
    '.surface[data-mode="open"]',
    { display: 'flex' }
  );
});

test('CSS recipes reject missing, overridden, changed or unrelated declarations', () => {
  for (const source of [
    '/* .surface { display: flex; gap: var(--space); } */',
    '.surface { display: flex; } .other { gap: var(--space); }',
    '.surface { display: flex; gap: var(--wrong-space); }',
    '.surface { display: flex; gap: var(--space); gap: 0; }',
    '.surface { display: flex; gap: var(--space); } .surface { gap: 0; }',
    '.surface { display: flex; gap: var(--space) !important; }',
    '.surface { display: flex; gap: 0 !important; } .surface { gap: var(--space); }',
    '@media (width < 600px) { .surface { display: flex; gap: var(--space); } }',
  ])
    assert.throws(
      () =>
        assertDeclarations(parseCss(source), '.surface', { display: 'flex', gap: 'var(--space)' }),
      assert.AssertionError
    );
  assertDeclarations(
    parseCss('@media (width < 600px) { .surface { display: flex; } }'),
    '.surface',
    { display: 'flex' },
    ['@media (width < 600px)']
  );
});

test('public class checks inspect selectors and reject specificity outside :where', () => {
  assert.deepEqual(
    assertClassesInWhere(
      parseCss(':where(.ds-demo, .ds-demo__item):hover { color: red; }'),
      'ds-demo'
    ),
    new Set(['ds-demo', 'ds-demo__item'])
  );
  for (const source of [
    '/* :where(.ds-demo) {} */',
    '.ds-demo { color: red; }',
    ':where(.ds-demo) .ds-demo__item { color: red; }',
    ':is(.ds-demo) { color: red; }',
  ])
    assert.throws(() => assertClassesInWhere(parseCss(source), 'ds-demo'), assert.AssertionError);
});

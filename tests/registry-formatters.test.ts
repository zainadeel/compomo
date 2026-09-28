import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  formatComponentDetail,
  formatComponentSourceHeader,
  formatPatternDetail,
  formatPatternList,
} from '../scripts/registry-formatters.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loadComponent = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(root, 'public', 'r', `${name}.json`), 'utf8'));
const loadPattern = (name: string) =>
  JSON.parse(
    fs.readFileSync(path.join(root, 'agent', 'patterns', name, 'pattern.agent.json'), 'utf8')
  );

test('formats compiler API, framework imports, and complete intent', () => {
  const component = loadComponent('button-filled');
  const output = formatComponentDetail(component);
  assert.match(output, /# ds-button-filled, DsButtonFilled, DsButtonFilled/);
  assert.match(output, /@ds-mo\/ui\/dist\/components\/ds-button-filled\.js/);
  assert.match(output, /@ds-mo\/ui\/react/);
  assert.match(output, /@ds-mo\/ui\/vue/);
  assert.match(output, /@ds-mo\/ui\/angular\/ds-button-filled/);
  for (const text of [
    ...component.meta.intent.useWhen,
    ...component.meta.intent.avoidWhen,
    ...component.meta.intent.accessibility,
  ])
    assert.ok(output.includes(text), text);
  assert.doesNotMatch(output, /\nundefined\n/);
});

test('formats revised descriptions and intent without a copied prose snapshot', () => {
  const component = loadComponent('card-chart');
  component.description = 'Updated chart guidance.';
  component.meta.intent.useWhen = ['A newly documented composition.'];
  const output = formatComponentDetail(component);
  assert.ok(output.includes(component.description));
  assert.ok(output.includes(component.meta.intent.useWhen[0]));
  assert.doesNotMatch(output, /\nundefined\n/);
});

test('formats source guidance from the custom-element import', () => {
  const output = formatComponentSourceHeader(loadComponent('button-filled'));
  assert.match(output, /Source Reference/);
  assert.match(output, /import '@ds-mo\/ui\/dist\/components\/ds-button-filled\.js';/);
});

test('formats pattern discovery and framework-specific executable recipes', () => {
  const pattern = loadPattern('menu-trigger');
  const list = formatPatternList([pattern]);
  const detail = formatPatternDetail(pattern, 'react');

  assert.match(list, /pattern:menu-trigger/);
  for (const recipe of pattern.implementations.react.recipes) {
    assert.ok(detail.includes(`## react: ${recipe.title}`));
    for (const file of recipe.files) assert.ok(detail.includes(file.content));
  }
  assert.match(detail, /DsButtonUnfilled/);
  assert.match(detail, /DsMenu/);
  assert.doesNotMatch(detail, /## angular:/);
  assert.doesNotMatch(detail, /## customElements:/);
});

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
const loadComponent = (name: string) => JSON.parse(
  fs.readFileSync(path.join(root, 'public', 'r', `${name}.json`), 'utf8'),
);
const loadPattern = (name: string) => JSON.parse(
  fs.readFileSync(path.join(root, 'agent', 'patterns', name, 'pattern.agent.json'), 'utf8'),
);

test('formats compiler API, framework imports, and complete intent', () => {
  const output = formatComponentDetail(loadComponent('button-filled'));
  assert.match(output, /# ds-button-filled, DsButtonFilled, DsButtonFilled/);
  assert.match(output, /@ds-mo\/ui\/dist\/components\/ds-button-filled\.js/);
  assert.match(output, /@ds-mo\/ui\/react/);
  assert.match(output, /@ds-mo\/ui\/angular\/ds-button-filled/);
  assert.match(output, /The user initiates the single primary command in a local decision area/);
  assert.doesNotMatch(output, /undefined/);
});

test('labels missing semantic intent without failing component formatting', () => {
  const output = formatComponentDetail(loadComponent('banner'));
  assert.match(output, /Semantic guidance is migration-pending/);
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
  assert.match(detail, /## react: Selected view menu/);
  assert.match(detail, /DsButtonUnfilled/);
  assert.match(detail, /DsMenu/);
  assert.doesNotMatch(detail, /## angular:/);
  assert.doesNotMatch(detail, /## customElements:/);
});

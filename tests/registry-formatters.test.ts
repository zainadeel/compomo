import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { formatComponentDetail, formatComponentSourceHeader } from '../scripts/registry-formatters.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loadComponent = (name: string) => JSON.parse(
  fs.readFileSync(path.join(root, 'public', 'r', `${name}.json`), 'utf8'),
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
  const output = formatComponentDetail(loadComponent('badge'));
  assert.match(output, /Semantic guidance is migration-pending/);
  assert.doesNotMatch(output, /\nundefined\n/);
});

test('formats source guidance from the custom-element import', () => {
  const output = formatComponentSourceHeader(loadComponent('button-filled'));
  assert.match(output, /Source Reference/);
  assert.match(output, /import '@ds-mo\/ui\/dist\/components\/ds-button-filled\.js';/);
});

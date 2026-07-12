import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  discoverComponents,
  validateAuthoredArtifacts,
  validateRegistryCoverage,
} from '../scripts/component-inventory.mjs';
import './registry-formatters.test.ts';

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compomo-inventory-'));
  temporaryRoots.push(root);
  return root;
}

function writeComponent(root: string, directory: string, tag: string, options: {
  style?: boolean;
  story?: boolean;
  agent?: boolean;
} = {}) {
  const componentDirectory = path.join(root, 'src/wc/components', directory);
  fs.mkdirSync(componentDirectory, { recursive: true });
  fs.writeFileSync(path.join(componentDirectory, `${directory}.tsx`), `
    import { Component, h } from '@stencil/core';
    @Component({ tag: '${tag}', styleUrl: '${directory}.css', scoped: true })
    export class ${directory} { render() { return <div />; } }
  `);
  if (options.style !== false) fs.writeFileSync(path.join(componentDirectory, `${directory}.css`), '');
  if (options.story !== false) fs.writeFileSync(path.join(componentDirectory, `${directory}.stories.ts`), '');
  if (options.agent !== false) fs.writeFileSync(path.join(componentDirectory, `${directory}.agent.json`), '{}');
}

describe('source-derived component inventory', () => {
  it('discovers a complete component without a handwritten catalog entry', () => {
    const root = fixtureRoot();
    writeComponent(root, 'NewWidget', 'ds-new-widget');
    const components = discoverComponents(root);
    assert.deepEqual(components.map(component => component.id), ['component:ds-new-widget']);
    assert.deepEqual(validateAuthoredArtifacts({ root, components, checkAdapters: false }), []);
  });

  it('reports missing stories and agent metadata with exact paths', () => {
    const root = fixtureRoot();
    writeComponent(root, 'NewWidget', 'ds-new-widget', { story: false, agent: false });
    const errors = validateAuthoredArtifacts({ root, components: discoverComponents(root), checkAdapters: false });
    assert.ok(errors.some(error => error.includes('NewWidget.stories.ts')));
    assert.ok(errors.some(error => error.includes('NewWidget.agent.json')));
  });

  it('allows only explicit migration and artifact exceptions', () => {
    const root = fixtureRoot();
    writeComponent(root, 'LegacyWidget', 'ds-legacy-widget', { style: false, agent: false });
    const components = discoverComponents(root);
    const errors = validateAuthoredArtifacts({
      root,
      components,
      migrationIds: new Set(['component:ds-legacy-widget']),
      artifactExceptions: {
        'component:ds-legacy-widget': { style: 'Component intentionally has no styles.' },
      },
      checkAdapters: false,
    });
    assert.deepEqual(errors, []);
  });

  it('requires migration entries to be removed after metadata is added', () => {
    const root = fixtureRoot();
    writeComponent(root, 'LegacyWidget', 'ds-legacy-widget');
    const errors = validateAuthoredArtifacts({
      root,
      components: discoverComponents(root),
      migrationIds: new Set(['component:ds-legacy-widget']),
      checkAdapters: false,
    });
    assert.ok(errors.some(error => error.includes('remove completed component:ds-legacy-widget')));
  });

  it('detects renamed registry items and detail files', () => {
    const root = fixtureRoot();
    writeComponent(root, 'NewWidget', 'ds-new-widget');
    const errors = validateRegistryCoverage(
      discoverComponents(root),
      { items: [{ name: 'old-widget' }] },
      ['registry.json', 'old-widget.json'],
    );
    assert.ok(errors.includes('registry coverage: missing new-widget'));
    assert.ok(errors.includes('registry coverage: stale item old-widget'));
    assert.ok(errors.includes('registry coverage: stale file public/r/old-widget.json'));
  });

  it('detects registry output left after component deletion', () => {
    const errors = validateRegistryCoverage(
      [],
      { items: [{ name: 'deleted-widget' }] },
      ['registry.json', 'deleted-widget.json'],
    );
    assert.ok(errors.includes('registry coverage: stale item deleted-widget'));
    assert.ok(errors.includes('registry coverage: stale file public/r/deleted-widget.json'));
  });
});

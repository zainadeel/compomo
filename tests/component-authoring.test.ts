import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ESLint } from 'eslint';
import { createComponent } from '../scripts/create-component.mjs';
import { verifyComponentAuthoring } from '../scripts/verify-component-authoring.mjs';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compomo-authoring-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, 'src/wc/components'), { recursive: true });
  return root;
}
function options(root: string) {
  return {
    root,
    name: 'StatusNote',
    summary: 'A persistent contextual message.',
    storyTitle: 'Feedback/StatusNote',
  };
}
function completeIntent(root: string) {
  const filename = path.join(root, 'src/wc/components/StatusNote/StatusNote.agent.json');
  const document = JSON.parse(fs.readFileSync(filename, 'utf8'));
  document.useWhen = ['A persistent contextual message accompanies a section.'];
  document.avoidWhen = ['Feedback needs the existing Banner actions or dismissal.'];
  document.accessibility = ['The surrounding section owns the heading and status announcement.'];
  document.states = ['The component renders authored content without owning state.'];
  document.responsiveBehavior = ['The parent controls the available width.'];
  document.styling.rationale = 'The container owns no protected typography or geometry.';
  fs.writeFileSync(filename, JSON.stringify(document));
}

describe('component authoring workflow', () => {
  it('creates only authored files that pass lint, then requires completed design intent', async () => {
    const root = fixtureRoot();
    const result = await createComponent(options(root));
    assert.equal(result.tag, 'ds-status-note');
    assert.equal(result.files.length, 4);
    assert.equal(fs.existsSync(path.join(root, 'dist')), false);
    assert.equal(fs.existsSync(path.join(root, 'public')), false);
    const initial = verifyComponentAuthoring(root);
    assert.equal(initial.components, 1);
    assert.equal(initial.errors.length, 6);
    assert.ok(initial.errors.every(error => error.includes('unfinished authoring guidance')));
    const eslint = new ESLint();
    for (const file of result.files.filter(file => !file.endsWith('.json'))) {
      const [report] = await eslint.lintText(fs.readFileSync(path.join(root, file), 'utf8'), {
        filePath: file,
      });
      assert.equal(report.errorCount, 0, JSON.stringify(report.messages));
      assert.equal(report.warningCount, 0, JSON.stringify(report.messages));
    }
    completeIntent(root);
    assert.deepEqual(verifyComponentAuthoring(root), { components: 1, errors: [] });
  });

  it('previews without writing and refuses unsafe names, missing intent, or existing directories', async () => {
    const root = fixtureRoot();
    await createComponent({ ...options(root), dryRun: true });
    assert.deepEqual(fs.readdirSync(path.join(root, 'src/wc/components')), []);
    for (const name of ['../Outside', 'foo/bar', 'status-note', 'Status\nNote']) {
      await assert.rejects(createComponent({ ...options(root), name }), /PascalCase/);
    }
    await assert.rejects(createComponent({ ...options(root), summary: '' }), /summary/);
    await assert.rejects(createComponent({ ...options(root), storyTitle: '' }), /story-title/);
    for (const name of ['Component', 'Host']) {
      await assert.rejects(createComponent({ ...options(root), name }), /Stencil import/);
    }
    await createComponent(options(root));
    const source = path.join(root, 'src/wc/components/StatusNote/StatusNote.tsx');
    fs.writeFileSync(source, 'preserve this authored source');
    await assert.rejects(createComponent(options(root)), /already exists/);
    await assert.rejects(
      createComponent({ ...options(root), name: 'STATUSNOTE' }),
      /already exists/
    );
    assert.equal(fs.readFileSync(source, 'utf8'), 'preserve this authored source');
  });

  it('reports missing files and metadata drift without requiring generated output', async () => {
    const root = fixtureRoot();
    await createComponent(options(root));
    completeIntent(root);
    const directory = path.join(root, 'src/wc/components/StatusNote');
    fs.rmSync(path.join(directory, 'StatusNote.css'));
    const metadata = path.join(directory, 'StatusNote.agent.json');
    const document = JSON.parse(fs.readFileSync(metadata, 'utf8'));
    document.tag = 'ds-wrong';
    fs.writeFileSync(metadata, JSON.stringify(document));
    const errors = verifyComponentAuthoring(root).errors;
    assert.ok(errors.some(error => error.includes('missing required authored artifact')));
    assert.ok(errors.some(error => error.includes('id and tag must match')));
    fs.writeFileSync(metadata, '{');
    assert.ok(
      verifyComponentAuthoring(root).errors.some(error => error.includes('StatusNote.agent.json'))
    );
  });

  it('detects undiscoverable component sources, orphan metadata and duplicate tags', async () => {
    const root = fixtureRoot();
    await createComponent(options(root));
    completeIntent(root);
    const original = path.join(root, 'src/wc/components/StatusNote');
    const duplicate = path.join(root, 'src/wc/components/Duplicate');
    fs.mkdirSync(duplicate);
    fs.copyFileSync(path.join(original, 'StatusNote.tsx'), path.join(duplicate, 'Duplicate.tsx'));
    fs.copyFileSync(
      path.join(original, 'StatusNote.agent.json'),
      path.join(original, 'Extra.agent.json')
    );
    fs.copyFileSync(path.join(original, 'StatusNote.tsx'), path.join(original, 'Wrong.tsx'));
    const errors = verifyComponentAuthoring(root).errors;
    assert.ok(errors.some(error => error.includes('duplicate tag')));
    assert.ok(errors.some(error => error.includes('Extra.agent.json')));
    assert.ok(errors.some(error => error.includes('Wrong.tsx')));
  });
});

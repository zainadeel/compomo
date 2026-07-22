import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import {
  validateAgentContract,
  validateAgentDocument,
} from '../scripts/validate-agent-contract.mjs';

const root = path.resolve(import.meta.dirname, '..');
const buttonMetadata = JSON.parse(
  fs.readFileSync(path.join(root, 'src/wc/components/ButtonFilled/ButtonFilled.agent.json'), 'utf8')
);

test('prototype agent metadata is schema-valid and references source components', () => {
  const result = validateAgentContract();

  assert.equal(result.sourceComponents, 60);
  assert.equal(result.componentDocuments, result.sourceComponents);
  assert.equal(result.patternDocuments, 5);
});

test('menu trigger pattern provides executable recipes for every framework', () => {
  const pattern = JSON.parse(
    fs.readFileSync(path.join(root, 'agent/patterns/menu-trigger/pattern.agent.json'), 'utf8')
  );
  const result = validateAgentDocument('pattern', pattern);

  assert.equal(result.valid, true);
  for (const framework of ['customElements', 'react', 'angular']) {
    const recipes = pattern.implementations[framework].recipes;
    assert.ok(recipes.length > 0, `${framework} should include a recipe`);
    assert.match(
      recipes[0].files.map((file: { content: string }) => file.content).join('\n'),
      /view-menu/
    );
    for (const file of recipes[0].files as Array<{
      path: string;
      language: string;
      content: string;
    }>) {
      if (file.language !== 'typescript' && file.language !== 'tsx') continue;
      const result = ts.transpileModule(file.content, {
        fileName: file.path,
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
        },
        reportDiagnostics: true,
      });
      const errors =
        result.diagnostics?.filter(
          diagnostic => diagnostic.category === ts.DiagnosticCategory.Error
        ) ?? [];
      assert.deepEqual(errors, [], `${framework}/${file.path} should parse as TypeScript`);
    }
  }
});

test('component schema rejects handwritten API facts', () => {
  const result = validateAgentDocument('component', {
    ...buttonMetadata,
    props: { label: { type: 'string' } },
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.keyword === 'additionalProperties'));
});

test('deprecated component metadata requires a replacement explanation', () => {
  const result = validateAgentDocument('component', {
    ...buttonMetadata,
    status: 'deprecated',
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.keyword === 'required'));
});

test('component schema accepts a declared lifecycle replacement', () => {
  const result = validateAgentDocument('component', {
    ...buttonMetadata,
    status: 'deprecated',
    replacedBy: 'component:ds-button-unfilled',
    replacementReason: 'Use the replacement for new work.',
  });

  assert.equal(result.valid, true);
});

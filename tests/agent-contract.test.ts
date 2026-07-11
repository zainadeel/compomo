import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  validateAgentContract,
  validateAgentDocument,
} from '../scripts/validate-agent-contract.mjs';

const root = path.resolve(import.meta.dirname, '..');
const buttonMetadata = JSON.parse(fs.readFileSync(
  path.join(root, 'src/wc/components/ButtonFilled/ButtonFilled.agent.json'),
  'utf8',
));

test('prototype agent metadata is schema-valid and references source components', () => {
  const result = validateAgentContract();

  assert.equal(result.sourceComponents, 40);
  assert.equal(result.componentDocuments, 3);
  assert.equal(result.patternDocuments, 1);
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

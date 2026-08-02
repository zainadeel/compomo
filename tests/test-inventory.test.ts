import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildTestInventory, validateTestInventory } from '../scripts/test-inventory.mjs';
import policy from './test-ownership-policy.json' with { type: 'json' };

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('test ownership inventory', () => {
  it('discovers every suite layer and resolves audited ownership metadata', async () => {
    const inventory = await buildTestInventory(repositoryRoot);

    assert.ok(inventory.summary.byLayer.unit > 0);
    assert.ok(inventory.summary.byLayer.rendered > 0);
    assert.ok(inventory.summary.byLayer.storybook > 0);
    assert.equal(validateTestInventory(inventory, policy).length, 0);
  });

  it('keeps unreviewed rendered coverage cross-browser by default', async () => {
    const inventory = await buildTestInventory(repositoryRoot);
    const unreviewed = inventory.tests.find(
      testCase =>
        testCase.layer === 'rendered' && !Object.hasOwn(policy.auditedRenderedSuites, testCase.file)
    );

    assert.ok(unreviewed);
    assert.deepEqual(unreviewed.browsers, ['chromium', 'firefox', 'webkit']);
    assert.equal(unreviewed.decision, 'keep-cross-browser-pending-audit');
  });

  it('distinguishes reviewed cross-browser cases from Chromium-only cases', async () => {
    const inventory = await buildTestInventory(repositoryRoot);
    const reviewed = inventory.tests.filter(
      testCase => testCase.layer === 'rendered' && testCase.audited
    );

    assert.ok(reviewed.some(testCase => testCase.decision === 'keep-cross-browser'));
    assert.ok(reviewed.some(testCase => testCase.decision === 'chromium-only'));
  });

  it('records retired rendered cases and their authoritative replacements', async () => {
    const inventory = await buildTestInventory(repositoryRoot);

    assert.equal(
      inventory.summary.retiredRenderedCases,
      inventory.retiredRenderedCases.length
    );
    assert.equal(inventory.summary.retiredRenderedAxeCases, 10);
    assert.equal(inventory.summary.activeRenderedAxeCases, 11);
    assert.equal(
      inventory.summary.byDecision['remove-redundant'],
      inventory.retiredRenderedCases.length
    );
    assert.ok(
      inventory.retiredRenderedCases.some(
        testCase =>
          testCase.owner === 'responsive-shell' &&
          testCase.replacements?.length === 2
      )
    );
    assert.ok(
      inventory.tests
        .filter(testCase => testCase.accessibilityAudit)
        .every(
          testCase =>
            testCase.owner === 'accessibility' && testCase.decision === 'chromium-only'
        )
    );
  });

  it('rejects a retired rendered case whose replacement is no longer active', async () => {
    const inventory = structuredClone(await buildTestInventory(repositoryRoot));
    const shellRetirement = inventory.retiredRenderedCases.find(
      testCase => testCase.owner === 'responsive-shell'
    );
    assert.ok(shellRetirement);
    shellRetirement.replacements = [
      {
        file: 'tests/e2e/shell-mobile.spec.ts',
        title: 'missing replacement',
      },
    ];

    assert.ok(
      validateTestInventory(inventory, policy).some(error =>
        error.includes('references missing rendered coverage')
      )
    );
  });
});

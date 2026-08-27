import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { crossBrowserContractSpecs } from './e2e/browser-tier';

test('cross-browser contracts stay explicit, unique, and source-backed', () => {
  const contracts = new Set<string>(crossBrowserContractSpecs);
  assert.equal(contracts.size, crossBrowserContractSpecs.length);

  for (const spec of crossBrowserContractSpecs) {
    assert.equal(
      fs.existsSync(`tests/e2e/${spec}`),
      true,
      `cross-browser contract spec does not exist: ${spec}`
    );
  }

  for (const requiredContract of [
    'accessibility-overlays.spec.ts',
    'forms.spec.ts',
    'scroll-overlay.spec.ts',
    'selects.spec.ts',
    'shell-mobile.spec.ts',
    'table.spec.ts',
    'table-virtual.spec.ts',
    'tooltip.spec.ts',
  ]) {
    assert.ok(
      contracts.has(requiredContract),
      `missing required cross-browser contract: ${requiredContract}`
    );
  }
});

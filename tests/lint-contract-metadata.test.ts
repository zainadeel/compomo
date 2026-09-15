import { it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createLintContracts } from '../scripts/lint-contracts.mjs';

it('validates compiler prop references, CSS hook consumption and source inventory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compomo-contract-'));
  const folder = path.join(root, 'src/wc/components/Example');
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(
    path.join(folder, 'Example.tsx'),
    "@Component({tag:'ds-example'}) export class Example {}"
  );
  fs.writeFileSync(path.join(folder, 'Example.css'), ':host {height:var(--example-height, 1px)}');
  const docs = path.join(root, 'dist/docs');
  fs.mkdirSync(docs, { recursive: true });
  fs.writeFileSync(
    path.join(docs, 'components.json'),
    JSON.stringify({
      components: [
        {
          tag: 'ds-example',
          props: [{ name: 'size', values: [{ value: 'sm' }, { value: 'lg' }] }],
        },
      ],
    })
  );
  const intent = {
    audience: 'general',
    status: 'experimental',
    styling: {
      rationale: 'Size owns height.',
      protected: [{ properties: ['height'], reason: 'Use size.', props: ['size'] }],
      customProperties: [
        {
          name: '--example-height',
          source: 'src/wc/components/Example/Example.css',
          reason: 'Explicit custom height.',
        },
      ],
    },
  };
  const write = () =>
    fs.writeFileSync(path.join(folder, 'Example.agent.json'), JSON.stringify(intent));
  try {
    write();
    const contracts = createLintContracts({ root, requireCompiler: true });
    assert.deepEqual(contracts['ds-example'].props.size.values, ['sm', 'lg']);
    assert.equal(contracts['ds-example'].reactName, 'DsExample');
    intent.styling.protected[0].props = ['missing'];
    write();
    assert.throws(() => createLintContracts({ root, requireCompiler: true }), /missing prop/);
    // Authoring lint can run with stale/missing build artifacts; packaging cannot.
    assert.doesNotThrow(() => createLintContracts({ root }));
    intent.styling.protected[0].props = ['size'];
    intent.styling.customProperties[0].name = '--typo';
    write();
    assert.throws(() => createLintContracts({ root, requireCompiler: true }), /not consumed/);
    intent.styling.customProperties[0].name = '--example-height';
    intent.styling.protected[0].properties = ['not-a-property'];
    write();
    assert.throws(
      () => createLintContracts({ root, requireCompiler: true }),
      /unknown protected property/
    );
    intent.styling.protected[0].properties = ['height'];
    intent.styling.rationale = '';
    write();
    assert.throws(
      () => createLintContracts({ root, requireCompiler: true }),
      /missing styling contract/
    );
    intent.styling.rationale = 'Size owns height.';
    write();
    fs.rmSync(path.join(root, 'dist'), { recursive: true });
    assert.doesNotThrow(() => createLintContracts({ root }));
    assert.throws(() => createLintContracts({ root, requireCompiler: true }), /Build Stencil/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

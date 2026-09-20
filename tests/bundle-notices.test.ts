import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { writeBundleNotices } from '../scripts/bundle-notices.mjs';

const fixtures: string[] = [];
afterEach(() => {
  for (const root of fixtures.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compomo-notices-'));
  fixtures.push(root);
  return root;
}

function dependency(
  root: string,
  directory: string,
  name: string,
  version: string,
  files: Record<string, string>
) {
  const absolute = path.join(root, directory);
  fs.mkdirSync(absolute, { recursive: true });
  fs.writeFileSync(
    path.join(absolute, 'package.json'),
    JSON.stringify({ name, version, license: 'MIT' })
  );
  for (const [file, text] of Object.entries(files))
    fs.writeFileSync(path.join(absolute, file), text);
  return `${directory}/index.js`;
}

describe('bundled dependency notices', () => {
  it('retains complete licenses and notices for the actual scoped and nested package versions', () => {
    const root = fixture();
    const output = path.join(root, 'dist/bundle');
    const direct = dependency(root, 'node_modules/example', 'example', '2.0.0', {
      LICENSE: 'Direct copyright\nAll direct license terms.',
    });
    const nested = dependency(
      root,
      'node_modules/parent/node_modules/example',
      'example',
      '1.0.0',
      {
        'LICENSE-MIT': 'Nested MIT terms.',
        'LICENSE-APACHE': 'Nested Apache terms.',
        NOTICE: 'Required nested attribution.',
      }
    );
    const scoped = dependency(root, 'node_modules/@scope/helper', '@scope/helper', '3.0.0', {
      'COPYING.txt': 'Scoped license terms.',
    });
    dependency(root, 'node_modules/external', 'external', '4.0.0', { LICENSE: 'Not bundled.' });

    writeBundleNotices({
      inputs: [direct, nested, scoped, 'src/entry.ts', direct],
      root,
      output,
      preamble: 'Local adaptation license.',
    });
    const notices = fs.readFileSync(path.join(output, 'THIRD-PARTY-NOTICES'), 'utf8');
    for (const text of [
      'Local adaptation license.',
      'Direct copyright\nAll direct license terms.',
      'Nested MIT terms.',
      'Nested Apache terms.',
      'Required nested attribution.',
      'Scoped license terms.',
    ]) {
      assert.ok(notices.includes(text), text);
    }
    assert.equal(notices.includes('Not bundled.'), false);
    const inventory = JSON.parse(
      fs.readFileSync(path.join(output, 'bundled-dependencies.json'), 'utf8')
    );
    assert.deepEqual(inventory, {
      schemaVersion: 1,
      packages: [
        { name: '@scope/helper', version: '3.0.0', license: 'MIT', files: ['COPYING.txt'] },
        {
          name: 'example',
          version: '1.0.0',
          license: 'MIT',
          files: ['LICENSE-APACHE', 'LICENSE-MIT', 'NOTICE'],
        },
        { name: 'example', version: '2.0.0', license: 'MIT', files: ['LICENSE'] },
      ],
    });
    assert.equal(notices.includes(root), false);
    writeBundleNotices({
      inputs: [scoped, nested, direct],
      root,
      output,
      preamble: 'Local adaptation license.',
    });
    assert.equal(fs.readFileSync(path.join(output, 'THIRD-PARTY-NOTICES'), 'utf8'), notices);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(output, 'bundled-dependencies.json'), 'utf8')),
      inventory
    );
  });

  it('fails a bundle with a missing license even when metadata and NOTICE exist', () => {
    const root = fixture();
    const input = dependency(root, 'node_modules/incomplete', 'incomplete', '1.0.0', {
      NOTICE: 'Attribution alone is insufficient.',
    });
    assert.throws(
      () => writeBundleNotices({ inputs: [input], root, output: path.join(root, 'dist') }),
      /Missing bundled dependency identity or license/
    );
    assert.equal(fs.existsSync(path.join(root, 'dist/THIRD-PARTY-NOTICES')), false);
  });

  it('preserves legacy license declarations without inventing a license expression', () => {
    const root = fixture();
    const input = dependency(root, 'node_modules/legacy', 'legacy', '1.0.0', {
      LICENSE: 'Original license text.',
    });
    const licenses = [{ type: 'MIT', url: 'https://opensource.org/license/mit' }];
    fs.writeFileSync(
      path.join(root, 'node_modules/legacy/package.json'),
      JSON.stringify({ name: 'legacy', version: '1.0.0', licenses })
    );
    const output = path.join(root, 'dist');
    writeBundleNotices({ inputs: [input], root, output });
    const inventory = JSON.parse(
      fs.readFileSync(path.join(output, 'bundled-dependencies.json'), 'utf8')
    );
    assert.deepEqual(inventory.packages[0].license, licenses);
    assert.ok(
      fs
        .readFileSync(path.join(output, 'THIRD-PARTY-NOTICES'), 'utf8')
        .includes('Original license text.')
    );
  });
});

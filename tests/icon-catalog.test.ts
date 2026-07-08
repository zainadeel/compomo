import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const meta = JSON.parse(readFileSync(require.resolve('@ds-mo/icons/meta.json'), 'utf8'));

describe('icon loader catalogs', () => {
  it('system catalog has a lazy loader for every system icon from IcoMo meta', async () => {
    const { systemIconLoaders } = await import('../src/wc/components/Icon/system-icon-catalog.ts');
    const expected = meta.icons.filter((i: { category: string }) => i.category === 'system').map(
      (i: { name: string }) => i.name,
    );

    for (const name of expected) {
      assert.equal(typeof systemIconLoaders[name], 'function', `missing loader for ${name}`);
    }
  });

  it('flag catalog has a lazy loader for every flag icon from IcoMo meta', async () => {
    const { flagIconLoaders } = await import('../src/wc/components/Icon/flag-icon-catalog.ts');
    const expected = meta.icons.filter((i: { category: string }) => i.category === 'flag').map(
      (i: { name: string }) => i.name,
    );

    for (const name of expected) {
      assert.equal(typeof flagIconLoaders[name], 'function', `missing loader for ${name}`);
    }
  });

  it('every loader resolves to SVG markup from the @ds-mo/icons peer', async () => {
    const { systemIconLoaders } = await import('../src/wc/components/Icon/system-icon-catalog.ts');
    const { flagIconLoaders } = await import('../src/wc/components/Icon/flag-icon-catalog.ts');

    for (const [name, load] of [
      ...Object.entries<() => Promise<string>>(systemIconLoaders),
      ...Object.entries<() => Promise<string>>(flagIconLoaders),
    ]) {
      const svg = await load();
      assert.match(svg, /^<svg /, `loader for ${name} did not resolve to SVG markup`);
    }
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const meta = JSON.parse(readFileSync(require.resolve('@ds-mo/icons/meta.json'), 'utf8'));

describe('icon catalogs', () => {
  it('system catalog lists every system icon from IcoMo meta', async () => {
    const { systemIconCatalog } = await import('../src/wc/components/Icon/system-icon-catalog.ts');
    const expected = meta.icons.filter((i: { category: string }) => i.category === 'system').map(
      (i: { name: string }) => i.name,
    );

    for (const name of expected) {
      assert.ok(systemIconCatalog[name], `missing catalog entry for ${name}`);
      assert.match(systemIconCatalog[name], /^<svg /);
    }
  });

  it('flag catalog lists every flag icon from IcoMo meta', async () => {
    const { flagIconCatalog } = await import('../src/wc/components/Icon/flag-icon-catalog.ts');
    const expected = meta.icons.filter((i: { category: string }) => i.category === 'flag').map(
      (i: { name: string }) => i.name,
    );

    for (const name of expected) {
      assert.ok(flagIconCatalog[name], `missing catalog entry for ${name}`);
      assert.match(flagIconCatalog[name], /^<svg /);
    }
  });
});

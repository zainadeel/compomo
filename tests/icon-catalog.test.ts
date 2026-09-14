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
    const expected = meta.icons
      .filter((i: { category: string }) => i.category === 'system')
      .map((i: { name: string }) => i.name);

    for (const name of expected) {
      assert.equal(typeof systemIconLoaders[name], 'function', `missing loader for ${name}`);
    }
  });

  it('flag catalog has a lazy loader for every flag icon from IcoMo meta', async () => {
    const { flagIconLoaders } = await import('../src/wc/components/Icon/flag-icon-catalog.ts');
    const expected = meta.icons
      .filter((i: { category: string }) => i.category === 'flag')
      .map((i: { name: string }) => i.name);

    for (const name of expected) {
      assert.equal(typeof flagIconLoaders[name], 'function', `missing loader for ${name}`);
    }
  });

  it('resolves canonical names only — meta.json aliases are never loader keys', async () => {
    const { systemIconLoaders } = await import('../src/wc/components/Icon/system-icon-catalog.ts');
    const { flagIconLoaders } = await import('../src/wc/components/Icon/flag-icon-catalog.ts');
    const canonical = new Set(meta.icons.map((i: { name: string }) => i.name));

    for (const icon of meta.icons) {
      for (const alias of icon.aliases ?? []) {
        if (canonical.has(alias)) continue; // an alias colliding with a canonical name keys that icon, not this one
        assert.equal(
          Object.prototype.hasOwnProperty.call(systemIconLoaders, alias),
          false,
          `alias "${alias}" (${icon.name}) must not resolve`
        );
        assert.equal(
          Object.prototype.hasOwnProperty.call(flagIconLoaders, alias),
          false,
          `alias "${alias}" (${icon.name}) must not resolve`
        );
      }
    }
  });

  it('inherited object-prototype keys are not own loader entries', async () => {
    const { systemIconLoaders } = await import('../src/wc/components/Icon/system-icon-catalog.ts');
    for (const key of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(systemIconLoaders, key),
        false,
        `"${key}" must not be an own loader key`
      );
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

describe('icon catalog routing', () => {
  /** Mirrors how ds-icon picks a catalog, so these assert the shipped resolution path. */
  async function resolve(name: string): Promise<string> {
    const { isFlagIconName } = await import('../src/wc/components/Icon/icon-cache.ts');
    const { systemIconLoaders } = await import('../src/wc/components/Icon/system-icon-catalog.ts');
    const { flagIconLoaders } = await import('../src/wc/components/Icon/flag-icon-catalog.ts');

    const loaders = isFlagIconName(name) ? flagIconLoaders : systemIconLoaders;
    const load = Object.prototype.hasOwnProperty.call(loaders, name) ? loaders[name] : undefined;
    return load ? await load() : '';
  }

  // Regression: a `name.startsWith('Flag')` test routed these system icons to the
  // country-flag catalog, where they do not exist, so they rendered blank.
  for (const name of ['Flag', 'FlagFilled']) {
    it(`resolves the ${name} system icon to non-empty SVG`, async () => {
      assert.match(await resolve(name), /^<svg /);
    });
  }

  it('still resolves country flags from the flag catalog', async () => {
    const { isFlagIconName } = await import('../src/wc/components/Icon/icon-cache.ts');

    assert.equal(isFlagIconName('FlagCanada'), true);
    assert.match(await resolve('FlagCanada'), /^<svg /);
  });

  it('routes every icon to the catalog its IcoMo category names', async () => {
    const { isFlagIconName } = await import('../src/wc/components/Icon/icon-cache.ts');

    for (const icon of meta.icons as { name: string; category: string }[]) {
      assert.equal(
        isFlagIconName(icon.name),
        icon.category === 'flag',
        `${icon.name} (${icon.category}) routed to the wrong catalog`
      );
    }
  });

  it('classifies identically for registerIcons and resolution, so cache keys agree', async () => {
    const { iconCache, iconCacheKey, isFlagIconName, registerIcons } =
      await import('../src/wc/components/Icon/icon-cache.ts');

    // A pre-registered glyph must be readable under the key the resolver derives.
    registerIcons({ Flag: '<svg data-test="generic-flag"/>' });
    assert.equal(
      iconCache().get(iconCacheKey('Flag', isFlagIconName('Flag'))),
      '<svg data-test="generic-flag"/>'
    );

    registerIcons({ FlagCanada: '<svg data-test="ca-flag"/>' });
    assert.equal(
      iconCache().get(iconCacheKey('FlagCanada', isFlagIconName('FlagCanada'))),
      '<svg data-test="ca-flag"/>'
    );
  });
});

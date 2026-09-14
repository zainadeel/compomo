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
    const { resolveIconCategory } = await import('../src/wc/components/Icon/icon-cache.ts');
    const { systemIconLoaders } = await import('../src/wc/components/Icon/system-icon-catalog.ts');
    const { flagIconLoaders } = await import('../src/wc/components/Icon/flag-icon-catalog.ts');
    const { mapIconLoaders } = await import('../src/wc/components/Icon/map-icon-catalog.ts');

    const loaders = { system: systemIconLoaders, flag: flagIconLoaders, map: mapIconLoaders }[
      resolveIconCategory(name)
    ];
    const load = Object.prototype.hasOwnProperty.call(loaders, name) ? loaders[name] : undefined;
    return load ? await load() : '';
  }

  // Regression: a prefix test routes these system icons to a catalog that does not
  // contain them, so they render blank. Flag/FlagFilled shipped broken that way; the
  // four Map* names would have broken identically once the map category landed.
  for (const name of ['Flag', 'FlagFilled', 'MapNavigation', 'MapPage', 'MapPin', 'MapStreet']) {
    it(`resolves the ${name} system icon to non-empty SVG`, async () => {
      assert.match(await resolve(name), /^<svg /);
    });
  }

  it('resolves country flags and map glyphs from their own catalogs', async () => {
    const { resolveIconCategory } = await import('../src/wc/components/Icon/icon-cache.ts');

    assert.equal(resolveIconCategory('FlagCanada'), 'flag');
    assert.match(await resolve('FlagCanada'), /^<svg /);

    assert.equal(resolveIconCategory('MapGeofence'), 'map');
    assert.match(await resolve('MapGeofence'), /^<svg /);
  });

  it('routes every icon to the catalog its IcoMo category names', async () => {
    const { resolveIconCategory } = await import('../src/wc/components/Icon/icon-cache.ts');

    for (const icon of meta.icons as { name: string; category: string }[]) {
      assert.equal(
        resolveIconCategory(icon.name),
        icon.category,
        `${icon.name} routed away from its ${icon.category} catalog`
      );
    }
  });

  it('keys each category separately so same-named glyphs cannot collide', async () => {
    const { iconCacheKey } = await import('../src/wc/components/Icon/icon-cache.ts');
    const keys = new Set(
      (['system', 'flag', 'map'] as const).map(category => iconCacheKey('Probe', category))
    );

    assert.equal(keys.size, 3);
  });

  it('classifies identically for registerIcons and resolution, so cache keys agree', async () => {
    const { iconCache, iconCacheKey, resolveIconCategory, registerIcons } =
      await import('../src/wc/components/Icon/icon-cache.ts');

    // A pre-registered glyph must be readable under the key the resolver derives.
    for (const name of ['Flag', 'FlagCanada', 'MapGeofence']) {
      registerIcons({ [name]: `<svg data-test="${name}"/>` });
      assert.equal(
        iconCache().get(iconCacheKey(name, resolveIconCategory(name))),
        `<svg data-test="${name}"/>`,
        `${name} was registered under a key the resolver does not read`
      );
    }
  });

  it('registers an app-supplied custom name where ds-icon reads it', async () => {
    const { iconCache, iconCacheKey, resolveIconCategory, registerIcons } =
      await import('../src/wc/components/Icon/icon-cache.ts');

    // Names IcoMo does not ship fall to system, which is the key ds-icon reads.
    registerIcons({ AppOwnedMarker: '<svg data-test="app-owned"/>' });
    assert.equal(resolveIconCategory('AppOwnedMarker'), 'system');
    assert.equal(
      iconCache().get(iconCacheKey('AppOwnedMarker', 'system')),
      '<svg data-test="app-owned"/>'
    );
  });

  it('keeps names unique across categories so routing has no tie to break', () => {
    const categoriesByName = new Map<string, Set<string>>();
    for (const { name, category } of meta.icons as { name: string; category: string }[]) {
      if (!categoriesByName.has(name)) categoriesByName.set(name, new Set());
      categoriesByName.get(name)!.add(category);
    }

    const collisions = [...categoriesByName]
      .filter(([, categories]) => categories.size > 1)
      .map(([name, categories]) => `${name} (${[...categories].sort().join(', ')})`);

    assert.deepEqual(collisions, [], 'generate-icon-catalog.mjs fails the build on these');
  });
});

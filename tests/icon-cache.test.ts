import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { iconCache, iconCacheKey, registerIcons } from '../src/wc/components/Icon/icon-cache.ts';

describe('icon cache', () => {
  it('namespaces system and flag icons separately', () => {
    assert.notEqual(iconCacheKey('US', false), iconCacheKey('US', true));
  });

  it('registerIcons fills the shared cache for synchronous resolution', () => {
    registerIcons({ Bell: '<svg data-test="bell"/>' });
    registerIcons({ FlagUnitedStates: '<svg data-test="us-flag"/>' });

    assert.equal(iconCache().get(iconCacheKey('Bell', false)), '<svg data-test="bell"/>');
    assert.equal(
      iconCache().get(iconCacheKey('FlagUnitedStates', true)),
      '<svg data-test="us-flag"/>',
    );
    assert.equal(iconCache().get(iconCacheKey('FlagUnitedStates', false)), undefined);
  });

  it('shares one cache across module instances via the global symbol key', () => {
    registerIcons({ SharedProbe: '<svg/>' });
    const g = globalThis as { [k: symbol]: Map<string, string> | undefined };
    const shared = g[Symbol.for('ds-mo.icon-svg-cache')];
    assert.ok(shared?.has(iconCacheKey('SharedProbe', false)));
  });
});

/**
 * Shared SVG glyph cache for ds-icon.
 *
 * Keyed on a global symbol so every module instance (the compiled Stencil chunk
 * inside dist/components and any direct source import, e.g. via `@ds-mo/ui/utils`)
 * reads and writes the same cache. Without this, `registerIcons` called from an
 * app would fill a different Map than the one ds-icon resolves from.
 */
import { flagIconLoaders } from './flag-icon-catalog';

const CACHE_KEY = Symbol.for('ds-mo.icon-svg-cache');

type IconCacheMap = Map<string, string>;

type GlobalWithIconCache = { [CACHE_KEY]?: IconCacheMap };

export function iconCacheKey(name: string, flag: boolean): string {
  return flag ? `flag:${name}` : `system:${name}`;
}

/**
 * Route a name to the flag catalog only when it is genuinely an own key there.
 *
 * A `name.startsWith('Flag')` prefix test looks equivalent but is not: IcoMo
 * ships `Flag` and `FlagFilled` as *system* icons (a generic flag glyph, not a
 * country), so the prefix misroutes them to the country-flag catalog, the
 * own-key lookup misses, and ds-icon renders nothing with no error. Membership
 * is also future-proof — any later `Flag*` system icon resolves correctly
 * without another special case.
 *
 * Both the resolver and `registerIcons` must classify identically, otherwise a
 * pre-registered glyph is written under one key and read under another.
 */
export function isFlagIconName(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(flagIconLoaders, name);
}

export function iconCache(): IconCacheMap {
  const g = globalThis as GlobalWithIconCache;
  return (g[CACHE_KEY] ??= new Map());
}

/**
 * Pre-register glyphs so ds-icon renders them synchronously — no lazy-chunk
 * fetch, no first-paint pop-in. Import the SVG strings from `@ds-mo/icons`
 * in the app (statically, so they ship in the app's own bundle):
 *
 * ```ts
 * import { Bell } from '@ds-mo/icons/svg/Bell';
 * import { FlagUnitedStates } from '@ds-mo/icons/svg/flags/FlagUnitedStates';
 * import { registerIcons } from '@ds-mo/ui/utils';
 *
 * registerIcons({ Bell });
 * registerIcons({ FlagUnitedStates });
 * ```
 *
 * Icons that are not registered still work — they lazy-load on first render
 * and stay cached afterwards.
 */
export function registerIcons(icons: Record<string, string>, options?: { flag?: boolean }): void {
  const cache = iconCache();
  for (const [name, svg] of Object.entries(icons)) {
    const flag = options?.flag ?? isFlagIconName(name);
    cache.set(iconCacheKey(name, flag), svg);
  }
}

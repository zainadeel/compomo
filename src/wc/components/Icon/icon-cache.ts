/**
 * Shared SVG glyph cache for ds-icon.
 *
 * Keyed on a global symbol so every module instance (the compiled Stencil chunk
 * inside dist/components and any direct source import, e.g. via `@ds-mo/ui/utils`)
 * reads and writes the same cache. Without this, `registerIcons` called from an
 * app would fill a different Map than the one ds-icon resolves from.
 */
const CACHE_KEY = Symbol.for('ds-mo.icon-svg-cache');

type IconCacheMap = Map<string, string>;

type GlobalWithIconCache = { [CACHE_KEY]?: IconCacheMap };

export function iconCacheKey(name: string, flag: boolean): string {
  return flag ? `flag:${name}` : `system:${name}`;
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
 * import { US } from '@ds-mo/icons/svg/flags/US';
 * import { registerIcons } from '@ds-mo/ui/utils';
 *
 * registerIcons({ Bell });
 * registerIcons({ US }, { flag: true });
 * ```
 *
 * Icons that are not registered still work — they lazy-load on first render
 * and stay cached afterwards.
 */
export function registerIcons(icons: Record<string, string>, options?: { flag?: boolean }): void {
  const cache = iconCache();
  const flag = options?.flag === true;
  for (const [name, svg] of Object.entries(icons)) {
    cache.set(iconCacheKey(name, flag), svg);
  }
}

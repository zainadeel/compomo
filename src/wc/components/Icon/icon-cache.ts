/**
 * Shared SVG glyph cache for ds-icon.
 *
 * Keyed on a global symbol so every module instance (the compiled Stencil chunk
 * inside dist/components and any direct source import, e.g. via `@ds-mo/ui/utils`)
 * reads and writes the same cache. Without this, `registerIcons` called from an
 * app would fill a different Map than the one ds-icon resolves from.
 */
import { flagIconLoaders } from './flag-icon-catalog';
import { mapIconLoaders } from './map-icon-catalog';
import { systemIconLoaders } from './system-icon-catalog';

const CACHE_KEY = Symbol.for('ds-mo.icon-svg-cache');

type IconCacheMap = Map<string, string>;

type GlobalWithIconCache = { [CACHE_KEY]?: IconCacheMap };

/** IcoMo ships each glyph in exactly one category; the catalogs mirror that split. */
export type IconCategory = 'system' | 'flag' | 'map';

export function iconCacheKey(name: string, category: IconCategory): string {
  return `${category}:${name}`;
}

function hasOwn(loaders: Record<string, unknown>, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(loaders, name);
}

/**
 * Pick the catalog a name belongs to by own-key membership — never by prefix.
 *
 * A prefix test looks equivalent and is not. IcoMo ships `Flag`/`FlagFilled` as
 * *system* icons (a generic flag glyph, not a country) and `MapNavigation`,
 * `MapPage`, `MapPin`, `MapStreet` as system icons too, while every genuine
 * flag/map export carries the category prefix. So `startsWith('Flag')` or
 * `startsWith('Map')` misroutes those six to a catalog that does not contain
 * them, the own-key lookup misses, and ds-icon renders nothing with no error.
 * Membership needs no special case and stays correct as IcoMo adds names.
 *
 * System is tested first so that if a future release ever does ship one name in
 * two categories, the collision degrades predictably toward the system glyph
 * rather than silently flipping behaviour.
 *
 * The resolver and `registerIcons` must classify identically, otherwise a
 * pre-registered glyph is written under one key and read under another.
 */
export function resolveIconCategory(name: string): IconCategory {
  if (hasOwn(systemIconLoaders, name)) return 'system';
  if (hasOwn(flagIconLoaders, name)) return 'flag';
  if (hasOwn(mapIconLoaders, name)) return 'map';
  // Unknown names resolve as system so the miss surfaces on the default catalog.
  return 'system';
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
 * import { MapGeofence } from '@ds-mo/icons/svg/map/MapGeofence';
 * import { registerIcons } from '@ds-mo/ui/utils';
 *
 * registerIcons({ Bell });
 * registerIcons({ FlagUnitedStates });
 * registerIcons({ MapGeofence });
 * ```
 *
 * The category is inferred from the name, so the calls above need no options.
 * Pass `{ category }` only to register a glyph under a category its name does
 * not resolve to — for example app-supplied markup under a custom name.
 *
 * Icons that are not registered still work — they lazy-load on first render
 * and stay cached afterwards.
 */
export function registerIcons(
  icons: Record<string, string>,
  /** `flag` predates the map category; it still forces flag/system as before. */
  options?: { category?: IconCategory; flag?: boolean }
): void {
  const cache = iconCache();
  for (const [name, svg] of Object.entries(icons)) {
    const category =
      options?.category ??
      (options?.flag === undefined ? resolveIconCategory(name) : options.flag ? 'flag' : 'system');
    cache.set(iconCacheKey(name, category), svg);
  }
}

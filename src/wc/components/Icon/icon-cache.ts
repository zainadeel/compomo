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
 *
 * Only the two prefixed catalogs are consulted; anything else is system. That
 * keeps the system catalog — 400 loaders, by far the largest — out of the
 * `@ds-mo/ui/utils` entry, which exists to hand apps `registerIcons`.
 *
 * Test order is not a tie-break: `generate-icon-catalog.mjs` fails the build if
 * IcoMo ever ships one name in two categories, so at most one can match.
 *
 * Names in no catalog resolve as system, which is what lets an app register a
 * glyph of its own under a custom name and have ds-icon read it back.
 */
export function resolveIconCategory(name: string): IconCategory {
  if (hasOwn(flagIconLoaders, name)) return 'flag';
  if (hasOwn(mapIconLoaders, name)) return 'map';
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
 * The category comes from the name, exactly as ds-icon derives it, so a
 * registration is always readable by the element that needs it. Glyphs under a
 * name IcoMo does not ship — an app's own marker artwork, say — register as
 * system and resolve the same way.
 *
 * There is deliberately no category override. ds-icon has no such override when
 * it reads, so forcing a different category on write could only produce an
 * entry nothing ever reads.
 *
 * Icons that are not registered still work — they lazy-load on first render
 * and stay cached afterwards.
 */
export function registerIcons(icons: Record<string, string>): void {
  const cache = iconCache();
  for (const [name, svg] of Object.entries(icons)) {
    cache.set(iconCacheKey(name, resolveIconCategory(name)), svg);
  }
}

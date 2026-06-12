import iconMeta from '@ds-mo/icons/meta';

export type IconMetaCategory = 'system' | 'flag';

interface IconMetaEntry {
  name: string;
  category: IconMetaCategory;
  kebab: string;
  aliases: string[];
}

const mapsByCategory: Partial<Record<IconMetaCategory, Map<string, string>>> = {};

function kebabToPascal(kebab: string): string {
  return kebab
    .split('-')
    .map(segment => (segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : segment))
    .join('');
}

function registerAlias(map: Map<string, string>, alias: string, canonical: string): void {
  map.set(alias, canonical);
  if (alias.includes('-')) {
    map.set(kebabToPascal(alias), canonical);
  } else if (alias.length > 0) {
    map.set(alias.charAt(0).toUpperCase() + alias.slice(1), canonical);
  }
}

function getAliasMap(category: IconMetaCategory): Map<string, string> {
  const cached = mapsByCategory[category];
  if (cached) return cached;

  const map = new Map<string, string>();
  const icons = (iconMeta as { icons: IconMetaEntry[] }).icons;

  for (const icon of icons) {
    if (icon.category !== category) continue;

    map.set(icon.name, icon.name);
    map.set(icon.kebab, icon.name);
    map.set(kebabToPascal(icon.kebab), icon.name);

    for (const alias of icon.aliases) {
      registerAlias(map, alias, icon.name);
    }
  }

  mapsByCategory[category] = map;
  return map;
}

/** Map a consumer-facing icon name to the canonical IcoMo export key. */
export function resolveIconName(name: string, category: IconMetaCategory = 'system'): string {
  if (!name) return '';
  return getAliasMap(category).get(name) ?? name;
}

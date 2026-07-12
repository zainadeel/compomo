const MODIFIER_GLYPHS = new Set(['⌘', '⇧', '⌥', '⌃']);

/** Split a shortcut chord into the labels rendered on individual keycaps. */
export function shortcutKeyLabels(shortcut: string): string[] {
  const normalized = shortcut.trim();
  if (!normalized) return [];

  if (normalized.includes('+')) {
    return normalized.split('+').map(part => part.trim()).filter(Boolean);
  }

  if (/\s/.test(normalized)) {
    return normalized.split(/\s+/).filter(Boolean);
  }

  const characters = Array.from(normalized);
  const labels: string[] = [];
  while (characters.length > 1 && MODIFIER_GLYPHS.has(characters[0])) {
    labels.push(characters.shift()!);
  }
  labels.push(characters.join(''));
  return labels;
}

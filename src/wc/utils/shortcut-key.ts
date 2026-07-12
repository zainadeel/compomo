const MODIFIER_GLYPHS = new Set(['⌘', '⇧', '⌥', '⌃']);
const MODIFIER_LABELS: Readonly<Record<string, string>> = {
  alt: '⌥',
  cmd: '⌘',
  command: '⌘',
  control: '⌃',
  ctrl: '⌃',
  option: '⌥',
  shift: '⇧',
};

function canonicalKeyLabel(label: string): string {
  return MODIFIER_LABELS[label.toLowerCase()] ?? label;
}

/** Split a shortcut chord into the labels rendered on individual keycaps. */
export function shortcutKeyLabels(shortcut: string): string[] {
  const normalized = shortcut.trim();
  if (!normalized) return [];

  if (normalized.includes('+')) {
    return normalized.split('+').map(part => part.trim()).filter(Boolean).map(canonicalKeyLabel);
  }

  if (/\s/.test(normalized)) {
    return normalized.split(/\s+/).filter(Boolean).map(canonicalKeyLabel);
  }

  const characters = Array.from(normalized);
  const labels: string[] = [];
  while (characters.length > 1 && MODIFIER_GLYPHS.has(characters[0])) {
    labels.push(characters.shift()!);
  }
  labels.push(characters.join(''));
  return labels;
}

const toWords = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '')
    .split(/\s+/)
    .filter(Boolean);

/**
 * Builds an accessible name that contains the visible text as a contiguous run of words
 * (WCAG 2.5.3 Label in Name). Returns `label` unchanged when it already contains the visible
 * text; otherwise prefixes it, e.g. `("Zain Adeel", "Account")` -> `"Zain Adeel, Account"`.
 */
export function labelWithVisibleText(visibleText: string, label: string): string {
  const visible = visibleText.trim();
  const name = label.trim();
  if (!visible) return name;
  if (!name) return visible;

  const visibleWords = toWords(visible);
  const nameWords = toWords(name);
  if (visibleWords.length === 0) return name;
  for (let start = 0; start + visibleWords.length <= nameWords.length; start++) {
    if (visibleWords.every((word, offset) => nameWords[start + offset] === word)) return name;
  }
  return `${visible}, ${name}`;
}

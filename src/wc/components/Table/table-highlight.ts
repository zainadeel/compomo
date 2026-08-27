export interface TableHighlightSegment {
  text: string;
  match: boolean;
}

export type TableHighlightMatcher = (value: string | number) => TableHighlightSegment[];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Creates one literal, case-insensitive matcher for table-owned text tracks.
 * Longer terms win when supplied terms overlap.
 */
export function createTableHighlightMatcher(terms: string[]): TableHighlightMatcher {
  const normalizedTerms = Array.from(
    new Map(
      terms
        .map(term => term.trim())
        .filter(Boolean)
        .map(term => [term.toLocaleLowerCase(), term])
    ).values()
  ).sort((left, right) => right.length - left.length);

  if (!normalizedTerms.length) {
    return value => [{ text: String(value), match: false }];
  }

  const expression = new RegExp(normalizedTerms.map(escapeRegExp).join('|'), 'giu');

  return value => {
    const text = String(value);
    const segments: TableHighlightSegment[] = [];
    let cursor = 0;

    expression.lastIndex = 0;
    for (const match of text.matchAll(expression)) {
      const index = match.index;
      if (index > cursor) segments.push({ text: text.slice(cursor, index), match: false });
      segments.push({ text: match[0], match: true });
      cursor = index + match[0].length;
    }

    if (!segments.length) return [{ text, match: false }];
    if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
    return segments;
  };
}

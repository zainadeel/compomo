/** Categorical data-viz palette from `@ds-mo/tokens` (`--color-data-category-1..12`). Cycles if a chart has more series than swatches. */
const CATEGORY_TOKEN_COUNT = 12;

export function categoryColor(index: number): string {
  const slot = (index % CATEGORY_TOKEN_COUNT) + 1;
  return `var(--color-data-category-${slot})`;
}

/** `ds-chart-legend` entry — value is optional so a series name (no single value) can be legended too. */
export interface ChartLegendItem {
  label: string;
  value?: number;
  /** CSS color override; defaults to the next `--color-data-category-*` token. */
  color?: string;
  /** When set, the row renders as a link (e.g. to a filtered list page for this segment). */
  href?: string;
}

/** Shared data shapes for `ds-chart-*` components — kept minimal for the initial scaffold, expect these to grow per component once design is finalized. */

export interface ChartDatum {
  label: string;
  value: number;
  /** CSS color override; defaults to the next `--color-data-category-*` token. */
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: number[];
  /** CSS color override; defaults to the next `--color-data-category-*` token. */
  color?: string;
}

/** `ds-chart-legend` entry — value is optional so a series name (no single value) can be legended too. */
export interface ChartLegendItem {
  label: string;
  value?: number;
  /** CSS color override; defaults to the next `--color-data-category-*` token. */
  color?: string;
  /** When set, the row renders as a link (e.g. to a filtered list page for this segment). */
  href?: string;
}

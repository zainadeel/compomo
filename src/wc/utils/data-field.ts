/**
 * A data point a control can name, sort by, search, or show and hide.
 *
 * Table columns were the first of these, so the toolbar controls originally
 * typed against TableColumn. They never read a rendering property from it —
 * only identity, labelling and capability — which meant a card list or map
 * overlay had to describe itself as a table to reuse Sort, Search or Customize.
 *
 * TableColumn extends this, so table callers are unaffected and a non-table
 * surface can supply the fields it actually has.
 */
export interface DataFieldSegment {
  /** Compact label rendered where space is tight. */
  label: string;
  /** Complete data-point label used when the segment is named outside that context. */
  dataLabel?: string;
  /** Whether this data point is offered by search. Defaults to true. */
  searchable?: boolean;
  /** Stable key emitted as the sorted field id. */
  sortKey: string;
}

export interface DataField {
  /** Stable field identity. */
  id: string;
  /** Visible field label. May be empty when accessibleLabel supplies a non-visual name. */
  label: string;
  /** Complete data-point label used by controls such as Sort and Search. */
  dataLabel?: string;
  /** Screen-reader-only name for an intentionally blank visible label. */
  accessibleLabel?: string;
  /** Whether this data point is offered by Search. Defaults to true. */
  searchable?: boolean;
  /** Whether Sort offers this field. */
  sortable?: boolean;
  /** Labels for a field that presents and sorts several related data points. */
  segments?: DataFieldSegment[];
}

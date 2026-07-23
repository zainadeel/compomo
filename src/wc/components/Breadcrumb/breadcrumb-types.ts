export interface BreadcrumbItem {
  /** Stable value returned from dsSelect. */
  id: string;
  /** Visible caption label. */
  label: string;
  /** Optional accessible name when the visible label is not destination-specific enough. */
  ariaLabel?: string;
  /** Native destination. Omit when the route owner handles dsSelect. */
  href?: string;
  /** Marks this item as the current page and removes its interaction. */
  isCurrent?: boolean;
}

export interface BreadcrumbSelectDetail {
  item: BreadcrumbItem;
  originalEvent: MouseEvent;
}

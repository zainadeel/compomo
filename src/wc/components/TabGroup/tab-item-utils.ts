export interface TabItemDivider {
  type: 'divider';
}

export interface TabItemTab {
  id: string;
  label: string;
  /** Disables the tab (same meaning as control `isInactive`). */
  isInactive?: boolean;
  /** id of the tabpanel this tab controls */
  panelId?: string;
  /** Show a notification dot (brand) on the tab — no count, matching panel-nav. */
  dot?: boolean;
}

export type TabItem = TabItemTab | TabItemDivider;

export function isTabDivider(item: TabItem): item is TabItemDivider {
  return 'type' in item && item.type === 'divider';
}

/** Tab entries that participate in selection, keyboard nav, and URL matching. */
export function getSelectableTabs(tabs: TabItem[]): TabItemTab[] {
  return tabs.filter((t): t is TabItemTab => !isTabDivider(t));
}

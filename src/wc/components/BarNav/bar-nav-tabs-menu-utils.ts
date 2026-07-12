import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import {
  getSelectableTabs,
  isTabDivider,
  type TabItem,
  type TabItemTab,
} from '../TabGroup/tab-item-utils';

/** Map BarNav tabs to menu sections, preserving `{ type: 'divider' }` as section breaks. */
export function tabsToMenuSections(tabs: TabItem[], selectedId: string): MenuSection[] {
  const sections: MenuSection[] = [];
  let batch: MenuItemData[] = [];

  for (const item of tabs) {
    if (isTabDivider(item)) {
      if (batch.length > 0) {
        sections.push({ items: batch });
        batch = [];
      }
      continue;
    }

    batch.push({
      label: item.label,
      value: item.id,
      dot: item.dot,
      isSelected: item.id === selectedId,
      isInactive: item.isInactive,
    });
  }

  if (batch.length > 0) {
    sections.push({ items: batch });
  }

  return sections;
}

export function tabsToOverflowMenuSections(tabs: TabItem[], selectedId: string): MenuSection[] {
  return tabsToMenuSections(trimLeadingDividers(tabs), selectedId);
}

export function getActiveTab(tabs: TabItem[], selectedId: string): TabItemTab | undefined {
  const selectable = getSelectableTabs(tabs);
  return selectable.find(tab => tab.id === selectedId) ?? selectable[0];
}

export function getActiveTabLabel(tabs: TabItem[], selectedId: string): string {
  return getActiveTab(tabs, selectedId)?.label ?? 'Tabs';
}

/** True when tablist content exceeds the available width (with optional hysteresis). */
export function tabsOverflowContainer(
  tabListScrollWidth: number,
  containerClientWidth: number,
  collapsed: boolean,
  hysteresis = 2,
): boolean {
  const diff = tabListScrollWidth - containerClientWidth;
  if (collapsed) {
    return diff > -hysteresis;
  }
  return diff > hysteresis;
}

export function visibleTabCountForWidth(
  itemWidths: number[],
  availableWidth: number,
  overflowTriggerWidth: number,
  itemGap: number,
  listExtraWidth: number,
): number {
  if (itemWidths.length === 0 || availableWidth <= 0) return 0;

  const fullWidth = widthForItemCount(itemWidths, itemWidths.length, itemGap, listExtraWidth);
  if (fullWidth <= availableWidth) return itemWidths.length;

  const availableForTabs = Math.max(0, availableWidth - overflowTriggerWidth);
  let count = 0;

  for (let i = 1; i <= itemWidths.length; i++) {
    const width = widthForItemCount(itemWidths, i, itemGap, listExtraWidth);
    if (width > availableForTabs) break;
    count = i;
  }

  return count;
}

export function trimTrailingDividers(tabs: TabItem[]): TabItem[] {
  let end = tabs.length;
  while (end > 0 && isTabDivider(tabs[end - 1])) {
    end -= 1;
  }
  return tabs.slice(0, end);
}

function trimLeadingDividers(tabs: TabItem[]): TabItem[] {
  let start = 0;
  while (start < tabs.length && isTabDivider(tabs[start])) {
    start += 1;
  }
  return tabs.slice(start);
}

function widthForItemCount(
  itemWidths: number[],
  count: number,
  itemGap: number,
  listExtraWidth: number,
): number {
  if (count <= 0) return 0;
  const itemsWidth = itemWidths.slice(0, count).reduce((sum, width) => sum + width, 0);
  return listExtraWidth + itemsWidth + itemGap * Math.max(0, count - 1);
}

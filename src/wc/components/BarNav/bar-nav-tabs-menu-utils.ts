import type { MenuSection } from '../Menu/Menu';
import {
  getSelectableTabs,
  isTabDivider,
  type TabItem,
  type TabItemTab,
} from '../TabGroup/tab-item-utils';

/** Map BarNav tabs to menu sections, preserving `{ type: 'divider' }` as section breaks. */
export function tabsToMenuSections(tabs: TabItem[], selectedId: string): MenuSection[] {
  const sections: MenuSection[] = [];
  let batch: MenuSection['items'] = [];

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
      isSelected: item.id === selectedId,
      isInactive: item.disabled,
    });
  }

  if (batch.length > 0) {
    sections.push({ items: batch });
  }

  return sections;
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

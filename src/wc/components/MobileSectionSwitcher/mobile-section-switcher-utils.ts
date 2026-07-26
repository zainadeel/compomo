import { getSelectableTabs, type TabItem, type TabItemTab } from '../TabGroup/tab-item-utils';

export interface MobileSectionPosition {
  selectedIndex: number;
  selected?: TabItemTab;
  hasPrevious: boolean;
  hasNext: boolean;
}

/** Resolve ordered selectable neighbors while ignoring visual divider entries. */
export function resolveMobileSectionPosition(
  sections: TabItem[],
  value: string
): MobileSectionPosition {
  const selectable = getSelectableTabs(sections);
  const matchedIndex = selectable.findIndex(section => section.id === value);
  const selectedIndex = matchedIndex >= 0 ? matchedIndex : 0;
  return {
    selectedIndex,
    selected: selectable[selectedIndex],
    hasPrevious: selectedIndex > 0,
    hasNext: selectedIndex < selectable.length - 1,
  };
}


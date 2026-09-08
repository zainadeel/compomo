import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import type { TabItem } from '../TabGroup/tab-item-utils';
import { isBarTitleDivider, type BarTitleSection, type BarTitleSectionItem } from './bar-title-types';

export function selectableBarTitleSections(sections: BarTitleSectionItem[]): BarTitleSection[] {
  return sections.filter((item): item is BarTitleSection => !isBarTitleDivider(item));
}

export function effectiveBarTitleSectionValue(
  sections: BarTitleSectionItem[],
  value: string
): string {
  const selectable = selectableBarTitleSections(sections);
  return selectable.some(section => section.id === value)
    ? value
    : (selectable[0]?.id ?? '');
}

export function selectedBarTitleSectionLabel(
  sections: BarTitleSectionItem[],
  value: string
): string {
  const selectedId = effectiveBarTitleSectionValue(sections, value);
  return selectableBarTitleSections(sections).find(section => section.id === selectedId)?.label ?? '';
}

export function barTitleSectionTriggerAriaLabel(
  sectionsAriaLabel: string,
  selectedLabel: string
): string {
  return `${sectionsAriaLabel}. Current section: ${selectedLabel}`;
}

export function barTitleSectionMenuSections(
  sections: BarTitleSectionItem[],
  selectedId: string
): MenuSection[] {
  const groups: MenuSection[] = [];
  let items: MenuItemData[] = [];
  const commit = () => {
    if (items.length > 0) groups.push({ items });
    items = [];
  };

  for (const item of sections) {
    if (isBarTitleDivider(item)) {
      commit();
    } else {
      items.push({
        label: item.label,
        value: item.id,
        isSelected: item.id === selectedId,
        isInactive: item.isInactive,
      });
    }
  }
  commit();
  return groups;
}

export function barTitleSectionsToTabs(sections: BarTitleSectionItem[]): TabItem[] {
  return sections.map(item =>
    isBarTitleDivider(item)
      ? { type: 'divider' }
      : {
          id: item.id,
          label: item.label,
          isInactive: item.isInactive,
        }
  );
}

export function barTitleSectionsDigest(sections: BarTitleSectionItem[] | undefined): string {
  return (sections ?? [])
    .map(item =>
      isBarTitleDivider(item) ? '|' : `${item.id}\0${item.label}\0${item.isInactive ? '1' : '0'}`
    )
    .join('\n');
}

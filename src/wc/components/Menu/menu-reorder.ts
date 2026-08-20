import {
  isMenuPickerSection,
  type MenuItemData,
  type MenuReorderDetail,
  type MenuSection,
} from './menu-types';

export interface MenuReorderRange {
  start: number;
  end: number;
}

/** Contiguous reorderable run containing `index`, or null when that row cannot move. */
export function menuReorderableRange(
  items: readonly MenuItemData[],
  index: number,
): MenuReorderRange | null {
  if (!items[index]?.reorderable) return null;

  let start = index;
  while (start > 0 && items[start - 1]?.reorderable) start -= 1;

  let end = index;
  while (end < items.length - 1 && items[end + 1]?.reorderable) end += 1;

  return { start, end };
}

/**
 * Move a reorderable row so it would be inserted before `insertBefore`.
 * `insertBefore` is clamped to the contiguous reorderable run.
 */
export function moveReorderableMenuItemBefore(
  items: readonly MenuItemData[],
  fromIndex: number,
  insertBefore: number,
): MenuItemData[] | null {
  const range = menuReorderableRange(items, fromIndex);
  if (!range) return null;

  const clamped = Math.min(Math.max(insertBefore, range.start), range.end + 1);
  let toIndex = clamped;
  if (fromIndex < toIndex) toIndex -= 1;
  if (toIndex === fromIndex || toIndex < range.start || toIndex > range.end) return null;

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/** Keyboard step: move one slot within the reorderable run. */
export function moveReorderableMenuItemBy(
  items: readonly MenuItemData[],
  fromIndex: number,
  offset: number,
): MenuItemData[] | null {
  if (offset === 0) return null;
  return moveReorderableMenuItemBefore(
    items,
    fromIndex,
    fromIndex + (offset < 0 ? offset : offset + 1),
  );
}

export function locateMenuItem(
  sections: readonly MenuSection[],
  flatIndex: number,
): { sectionIndex: number; itemIndex: number; items: MenuItemData[] } | null {
  let remaining = flatIndex;
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    if (isMenuPickerSection(section)) continue;
    if (remaining < section.items.length) {
      return { sectionIndex, itemIndex: remaining, items: section.items };
    }
    remaining -= section.items.length;
  }
  return null;
}

export function createMenuReorderDetail(
  items: MenuItemData[],
  fromIndex: number,
  nextItems: MenuItemData[],
  sectionIndex: number,
): MenuReorderDetail | null {
  const item = items[fromIndex];
  if (!item) return null;
  const toIndex = nextItems.indexOf(item);
  if (toIndex < 0) {
    const value = item.value;
    const matched = value
      ? nextItems.findIndex(candidate => candidate.value === value)
      : -1;
    if (matched < 0) return null;
    return { item, fromIndex, toIndex: matched, sectionIndex, items: nextItems };
  }
  return { item, fromIndex, toIndex, sectionIndex, items: nextItems };
}

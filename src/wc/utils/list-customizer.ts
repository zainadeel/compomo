import type { MenuItemData } from '../components/Menu/menu-types';

/**
 * Domain-neutral show/hide and reorder state for a customizable list of items.
 *
 * Table columns were the first consumer, but nothing here is table-shaped: a
 * card list, a map overlay, or a filter catalog needs the same resolution rules
 * (drop unknown ids, dedupe, keep a stable order) and the same menu rows. The
 * two behaviours that genuinely differ between consumers are parameters rather
 * than modes:
 *
 * - `minVisible` — how many items must stay visible. Table passes 1 so the last
 *   data column cannot be hidden; a catalog where every field may hide passes 0.
 * - `reorderable` — whether rows carry a drag handle. Menu renders a switch row
 *   without one when this is false.
 */
export interface ListCustomizerItem {
  /** Stable identity. */
  id: string;
  /** Visible row label. */
  label: string;
}

export interface ListCustomizerOptions {
  /** Items that must remain visible. Defaults to 0, so every item may hide. */
  minVisible?: number;
  /** Prefix a drag handle and allow reorder. Defaults to false. */
  reorderable?: boolean;
}

/** Ids in display order. Unknown and duplicate ids are ignored, missing ids append. */
export function resolveListOrder(ids: readonly string[], order: readonly string[] = []): string[] {
  const catalog = new Set(ids);
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const id of order) {
    if (!catalog.has(id) || seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  for (const id of ids) {
    if (seen.has(id)) continue;
    ordered.push(id);
  }
  return ordered;
}

/** Hidden ids, dropping unknowns and keeping `minVisible` items visible. */
export function resolveListHiddenIds(
  ids: readonly string[],
  hiddenIds: readonly string[] = [],
  options: ListCustomizerOptions = {}
): string[] {
  const minVisible = options.minVisible ?? 0;
  const catalog = new Set(ids);
  const hidden = [...new Set(hiddenIds.filter(id => catalog.has(id)))];
  if (ids.length === 0) return hidden;

  const maxHidden = Math.max(ids.length - minVisible, 0);
  if (hidden.length <= maxHidden) return hidden;

  // Over the limit: restore visibility in catalog order, so the item that comes
  // back is stable rather than whichever happened to be listed last.
  const restoreCount = hidden.length - maxHidden;
  const hiddenSet = new Set(hidden);
  const restored = new Set<string>();
  for (const id of ids) {
    if (restored.size >= restoreCount) break;
    if (hiddenSet.has(id)) restored.add(id);
  }
  return hidden.filter(id => !restored.has(id));
}

export function canToggleListHidden(
  ids: readonly string[],
  hiddenIds: readonly string[] | undefined,
  id: string,
  options: ListCustomizerOptions = {}
): boolean {
  if (!ids.includes(id)) return false;

  const hidden = new Set(resolveListHiddenIds(ids, hiddenIds, options));
  if (hidden.has(id)) return true;

  const visible = ids.filter(candidate => !hidden.has(candidate)).length;
  return visible > (options.minVisible ?? 0);
}

export function toggleListHidden(
  ids: readonly string[],
  hiddenIds: readonly string[] | undefined,
  id: string,
  options: ListCustomizerOptions = {}
): string[] {
  const resolved = resolveListHiddenIds(ids, hiddenIds, options);
  if (!canToggleListHidden(ids, resolved, id, options)) return resolved;

  const hidden = new Set(resolved);
  if (hidden.has(id)) hidden.delete(id);
  else hidden.add(id);
  return resolveListHiddenIds(ids, [...hidden], options);
}

export function moveListOrder(order: string[], fromId: string, toId: string): string[] {
  const from = order.indexOf(fromId);
  const to = order.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return order;

  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, fromId);
  return next;
}

export function moveListOrderBy(order: string[], id: string, offset: number): string[] {
  const from = order.indexOf(id);
  if (from < 0 || offset === 0) return order;
  return moveListOrder(order, id, order[from + offset] ?? id);
}

/** Menu switch rows for a customizable list, in resolved display order. */
export function listCustomizerMenuItems(
  items: readonly ListCustomizerItem[],
  hiddenIds: readonly string[] | undefined,
  order: readonly string[] | undefined,
  options: ListCustomizerOptions = {}
): MenuItemData[] {
  const byId = new Map(items.map(item => [item.id, item]));
  const ids = items.map(item => item.id);
  const resolvedHidden = resolveListHiddenIds(ids, hiddenIds, options);
  const hidden = new Set(resolvedHidden);

  return resolveListOrder(ids, order).flatMap(id => {
    const item = byId.get(id);
    if (!item) return [];
    return [
      {
        label: item.label,
        value: item.id,
        showSwitch: true,
        switchValue: !hidden.has(id),
        isInactive: !canToggleListHidden(ids, resolvedHidden, id, options),
        reorderable: options.reorderable ?? false,
      },
    ];
  });
}

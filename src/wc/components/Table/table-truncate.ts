/** Marks text tracks that may present the table-owned truncation tooltip. */
export const TABLE_TRUNCATE_ATTR = 'data-table-truncate';

function isValidTruncateTrack(track: HTMLElement): boolean {
  return !track.closest('.ds-table__row--disabled, thead, .ds-table__header-row');
}

/** Resolve the overflowing text track under a pointer or focus target. */
export function resolveTableTruncateTrack(target: EventTarget | null): HTMLElement | null {
  const element =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  if (!element) return null;

  const fromAncestor = element.closest<HTMLElement>(`[${TABLE_TRUNCATE_ATTR}]`);
  if (fromAncestor && isValidTruncateTrack(fromAncestor)) return fromAncestor;

  const link = element.closest('a.ds-table__cell-link');
  const nested = link?.querySelector<HTMLElement>(`[${TABLE_TRUNCATE_ATTR}]`);
  if (nested && isValidTruncateTrack(nested)) return nested;
  return null;
}

export function tableTruncateLabel(track: HTMLElement): string {
  return (track.textContent ?? '').replace(/\s+/g, ' ').trim();
}

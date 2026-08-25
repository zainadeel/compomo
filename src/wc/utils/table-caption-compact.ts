/** Matches `@container ds-table (max-width: 899px)` on caption Filter/Group/Sort. */
export const TABLE_CAPTION_COMPACT_MAX_PX = 899;

export function isTableCaptionCompact(width: number): boolean {
  return width > 0 && width <= TABLE_CAPTION_COMPACT_MAX_PX;
}

export function tableCaptionInlineSize(entry: ResizeObserverEntry): number {
  return entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width;
}

export function observeTableCaptionCompact(
  host: HTMLElement,
  onChange: (compact: boolean) => void
): () => void {
  if (typeof ResizeObserver === 'undefined') {
    onChange(false);
    return () => undefined;
  }

  const table = host.closest('ds-table');
  if (!table) {
    onChange(false);
    return () => undefined;
  }

  const sync = (width: number) => {
    if (width <= 0) return;
    onChange(isTableCaptionCompact(width));
  };

  const observer = new ResizeObserver(entries => {
    sync(entries[0] ? tableCaptionInlineSize(entries[0]) : 0);
  });
  observer.observe(table);
  sync(table.clientWidth);
  return () => observer.disconnect();
}

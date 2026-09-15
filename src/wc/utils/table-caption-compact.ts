/** Shared compact breakpoint for table captions and standalone data toolbars. */
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

  // Table captions own the complete control row; their slotted toolbar uses
  // display: contents and has no measurable box. Standalone toolbars own theirs.
  const owner = host.closest('ds-table') ?? host.closest('ds-data-toolbar');
  if (!owner) {
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
  observer.observe(owner);
  sync(owner.clientWidth);
  return () => observer.disconnect();
}

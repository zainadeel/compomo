import { resolveCssLengthPx } from './resolve-css-length-px';

export const SCROLL_OVERLAY_BLOCK_SIZE = '--ds-scroll-overlay-block-size';
export const SCROLL_OVERLAY_CONTENT_BLOCK_SIZE = '--ds-scroll-overlay-content-block-size';
export const SCROLL_OVERLAY_FADE_BLOCK_SIZE = '--ds-scroll-overlay-fade-block-size';

interface ScrollOverlayControllerOptions {
  host: HTMLElement;
  viewport: HTMLElement;
  content: HTMLElement;
  overlay: HTMLElement;
  overlayContentSelector?: string;
  onGeometryChange?: () => void;
}

/**
 * Keeps a content-owned alpha mask pinned behind a fixed overlay.
 *
 * The mask lives on the long content element so native scrollbars stay outside
 * the fade and the actual parent surface shows through. Its stop positions are
 * therefore expressed in content coordinates and must follow scrollTop.
 */
export class ScrollOverlayController {
  private resizeObserver?: ResizeObserver;
  private overlayBlockSize = 0;
  private overlayContentBlockSize = 0;
  private fadeBlockSize = 0;

  constructor(private readonly options: ScrollOverlayControllerOptions) {}

  connect(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.sync();
      this.options.onGeometryChange?.();
    });
    this.resizeObserver.observe(this.options.viewport);
    this.resizeObserver.observe(this.options.content);
    this.resizeObserver.observe(this.options.overlay);
    this.sync();
  }

  disconnect(): void {
    this.resizeObserver?.disconnect();
  }

  sync(): void {
    this.syncOverlayGeometry();
    this.syncFadeWindow();
  }

  getOverlayBlockSize(): number {
    return this.overlayBlockSize;
  }

  getOverlayContentBlockSize(): number {
    return this.overlayContentBlockSize;
  }

  private syncOverlayGeometry(): void {
    const { host, overlay } = this.options;
    const overlayRect = overlay.getBoundingClientRect();
    this.overlayBlockSize = Math.max(Math.ceil(overlayRect.height), 0);

    const assigned = host.querySelector<HTMLElement>(
      this.options.overlayContentSelector ?? '[slot="overlay"]',
    );
    if (!assigned) {
      this.overlayBlockSize = 0;
      this.overlayContentBlockSize = 0;
      this.fadeBlockSize = 0;
      host.style.setProperty(SCROLL_OVERLAY_BLOCK_SIZE, '0px');
      host.style.setProperty(SCROLL_OVERLAY_CONTENT_BLOCK_SIZE, '0px');
      host.style.setProperty(SCROLL_OVERLAY_FADE_BLOCK_SIZE, '0px');
      return;
    }

    const visibleContent =
      assigned.firstElementChild instanceof HTMLElement ? assigned.firstElementChild : assigned;
    const topInset = Math.max(
      Math.ceil(visibleContent.getBoundingClientRect().top - overlayRect.top),
      0,
    );
    this.overlayContentBlockSize = Math.max(this.overlayBlockSize - topInset, 0);
    const fadeLead = resolveCssLengthPx('var(--dimension-space-100)', 8);
    this.fadeBlockSize = this.overlayContentBlockSize + fadeLead;

    host.style.setProperty(SCROLL_OVERLAY_BLOCK_SIZE, `${this.overlayBlockSize}px`);
    host.style.setProperty(
      SCROLL_OVERLAY_CONTENT_BLOCK_SIZE,
      `${this.overlayContentBlockSize}px`,
    );
    host.style.setProperty(SCROLL_OVERLAY_FADE_BLOCK_SIZE, `${this.fadeBlockSize}px`);
  }

  private syncFadeWindow(): void {
    const { viewport, content } = this.options;
    const fadeEnd = Math.max(viewport.scrollTop + viewport.clientHeight, 0);
    const fadeStart = Math.max(fadeEnd - this.fadeBlockSize, 0);
    content.style.setProperty('--ds-scroll-edge-fade-window-start', `${fadeStart}px`);
    content.style.setProperty('--ds-scroll-edge-fade-window-end', `${fadeEnd}px`);
  }
}

import { Component, Prop, State, Element, h, Host } from '@stencil/core';

export type ScrollbarVariant = 'default' | 'thick';

@Component({
  tag: 'ds-scrollbar',
  styleUrl: 'Scrollbar.css',
  scoped: true,
})
export class Scrollbar {
  @Element() el!: HTMLElement;

  @Prop() variant: ScrollbarVariant = 'default';
  @Prop() showTrackOnHover: boolean = true;

  @State() private thumbHeight: number = 0;
  @State() private thumbTop: number = 0;
  @State() private thumbWidth: number = 0;
  @State() private thumbLeft: number = 0;
  @State() private isDragging: boolean = false;
  @State() private isDraggingH: boolean = false;
  @State() private isPointerInside: boolean = false;

  private contentEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private scrollHandler: (() => void) | null = null;

  // Drag state (not reactive — no re-render needed)
  private dragStartY = 0;
  private dragStartScrollTop = 0;
  private dragStartX = 0;
  private dragStartScrollLeft = 0;

  componentDidLoad() {
    this.contentEl = this.el.querySelector('.scrollbar-content') as HTMLElement | null;
    if (!this.contentEl) return;

    this.scrollHandler = () => this.updateThumb();
    this.contentEl.addEventListener('scroll', this.scrollHandler);

    this.resizeObserver = new ResizeObserver(() => this.updateThumb());
    this.resizeObserver.observe(this.contentEl);
    window.addEventListener('resize', this.scrollHandler);

    this.updateThumb();
  }

  disconnectedCallback() {
    if (this.contentEl && this.scrollHandler) {
      this.contentEl.removeEventListener('scroll', this.scrollHandler);
    }
    if (this.scrollHandler) {
      window.removeEventListener('resize', this.scrollHandler);
    }
    this.resizeObserver?.disconnect();
  }

  private updateThumb() {
    const container = this.el.querySelector('.scrollbar-container') as HTMLElement | null;
    const content = this.contentEl;
    if (!container || !content) return;

    const cH = container.clientHeight;
    const cW = container.clientWidth;
    const sH = content.scrollHeight;
    const sW = content.scrollWidth;
    const st = content.scrollTop;
    const sl = content.scrollLeft;

    if (sH <= cH) {
      this.thumbHeight = 0;
    } else {
      const h = Math.max(20, cH * (cH / sH));
      this.thumbHeight = h;
      this.thumbTop = (st / (sH - cH)) * (cH - h);
    }

    if (sW <= cW) {
      this.thumbWidth = 0;
    } else {
      const w = Math.max(20, cW * (cW / sW));
      this.thumbWidth = w;
      this.thumbLeft = (sl / (sW - cW)) * (cW - w);
    }
  }

  private handleThumbMouseDown(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const content = this.contentEl;
    if (!content) return;

    this.isDragging = true;
    this.dragStartY = e.clientY;
    this.dragStartScrollTop = content.scrollTop;

    const container = this.el.querySelector('.scrollbar-container') as HTMLElement;

    const onMove = (ev: MouseEvent) => {
      const deltaY = ev.clientY - this.dragStartY;
      const scrollable = content.scrollHeight - container.clientHeight;
      const ratio = scrollable / (container.clientHeight - this.thumbHeight);
      content.scrollTop = Math.max(0, Math.min(scrollable, this.dragStartScrollTop + deltaY * ratio));
    };
    const onUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private handleThumbHMouseDown(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const content = this.contentEl;
    if (!content) return;

    this.isDraggingH = true;
    this.dragStartX = e.clientX;
    this.dragStartScrollLeft = content.scrollLeft;

    const container = this.el.querySelector('.scrollbar-container') as HTMLElement;

    const onMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - this.dragStartX;
      const scrollable = content.scrollWidth - container.clientWidth;
      const ratio = scrollable / (container.clientWidth - this.thumbWidth);
      content.scrollLeft = Math.max(0, Math.min(scrollable, this.dragStartScrollLeft + deltaX * ratio));
    };
    const onUp = () => {
      this.isDraggingH = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  render() {
    const showThumb  = this.thumbHeight > 0;
    const showThumbH = this.thumbWidth > 0;
    const isScrollable = showThumb || showThumbH;
    const showTrack = this.showTrackOnHover && (this.isPointerInside || this.isDragging || this.isDraggingH);

    return (
      <Host style={{ display: 'contents' }}>
        <div
          class={{
            'scrollbar-container': true,
            'scrollbar-container--thick': this.variant === 'thick',
          }}
          data-show-track={showTrack ? 'true' : 'false'}
          data-dragging={this.isDragging || this.isDraggingH}
          onMouseEnter={() => { if (this.showTrackOnHover) this.isPointerInside = true; }}
          onMouseLeave={() => { this.isPointerInside = false; }}
        >
          <div
            class="scrollbar-content"
            tabIndex={isScrollable ? 0 : undefined}
          >
            <slot />
          </div>

          {showThumb && (
            <div class="scrollbar-track" aria-hidden="true">
              <div
                class="scrollbar-thumb"
                style={{ height: `${this.thumbHeight}px`, top: `${this.thumbTop}px` }}
                onMouseDown={(e: MouseEvent) => this.handleThumbMouseDown(e)}
              />
            </div>
          )}

          {showThumbH && (
            <div class="scrollbar-track-h" aria-hidden="true">
              <div
                class="scrollbar-thumb-h"
                style={{ width: `${this.thumbWidth}px`, left: `${this.thumbLeft}px` }}
                onMouseDown={(e: MouseEvent) => this.handleThumbHMouseDown(e)}
              />
            </div>
          )}
        </div>
      </Host>
    );
  }
}

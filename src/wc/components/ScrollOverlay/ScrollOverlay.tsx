import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';
import { ScrollOverlayController } from '../../utils/scroll-overlay-controller';

export interface ScrollOverlayScrollDetail {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

@Component({
  tag: 'ds-scroll-overlay',
  styleUrl: 'ScrollOverlay.css',
  styleUrls: ['../../utils/scroll-edge-fade.css'],
  scoped: true,
})
export class ScrollOverlay {
  @Element() el!: HTMLElement;

  /** Optional accessible name. When provided, the scrollport is a focusable region. */
  @Prop() scrollLabel: string | undefined;

  /** Reports scroll position without exposing the internal scrollport element. */
  @Event() dsScroll!: EventEmitter<ScrollOverlayScrollDetail>;

  private viewport?: HTMLElement;
  private content?: HTMLElement;
  private overlay?: HTMLElement;
  private controller?: ScrollOverlayController;

  componentDidLoad(): void {
    if (!this.viewport || !this.content || !this.overlay) return;
    this.controller = new ScrollOverlayController({
      host: this.el,
      viewport: this.viewport,
      content: this.content,
      overlay: this.overlay,
    });
    this.controller.connect();
  }

  disconnectedCallback(): void {
    this.controller?.disconnect();
  }

  /** Move the owned scrollport to its beginning. */
  @Method()
  async scrollToStart(): Promise<void> {
    this.viewport?.scrollTo({ top: 0, behavior: 'auto' });
    this.controller?.sync();
  }

  /** Move the owned scrollport to its live end. */
  @Method()
  async scrollToEnd(): Promise<void> {
    this.viewport?.scrollTo({ top: this.viewport.scrollHeight, behavior: 'auto' });
    this.controller?.sync();
  }

  /** Re-measure footer geometry after an imperative slotted-content update. */
  @Method()
  async refreshOverlay(): Promise<void> {
    this.controller?.sync();
  }

  private handleScroll = (): void => {
    if (!this.viewport) return;
    this.controller?.sync();
    this.dsScroll.emit({
      scrollTop: this.viewport.scrollTop,
      scrollHeight: this.viewport.scrollHeight,
      clientHeight: this.viewport.clientHeight,
    });
  };

  render() {
    const labelled = Boolean(this.scrollLabel?.trim());
    return (
      <Host>
        <div class="scroll-overlay">
          <div
            class="scroll-overlay__viewport"
            ref={element => {
              this.viewport = element;
            }}
            role={labelled ? 'region' : undefined}
            aria-label={labelled ? this.scrollLabel : undefined}
            tabIndex={labelled ? 0 : undefined}
            onScroll={this.handleScroll}
          >
            <div
              class="scroll-overlay__content scroll-edge-fade--block-window"
              ref={element => {
                this.content = element;
              }}
            >
              <slot />
            </div>
          </div>
          <div
            class="scroll-overlay__overlay"
            ref={element => {
              this.overlay = element;
            }}
          >
            <slot name="overlay" />
          </div>
        </div>
      </Host>
    );
  }
}

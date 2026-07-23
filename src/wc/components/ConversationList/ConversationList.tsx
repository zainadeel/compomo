import { Component, Element, h, Host, Prop } from '@stencil/core';
import { ScrollOverlayController } from '../../utils/scroll-overlay-controller';

export type ConversationListActionLayout = 'floating' | 'footer';

@Component({
  tag: 'ds-conversation-list',
  styleUrl: 'ConversationList.css',
  styleUrls: ['../../utils/scroll-edge-fade.css'],
  scoped: true,
})
export class ConversationList {
  @Element() el!: HTMLElement;

  /** Corner icon action or full-width persistent footer action. */
  @Prop() actionLayout: ConversationListActionLayout = 'floating';

  private viewport?: HTMLElement;
  private content?: HTMLElement;
  private overlay?: HTMLElement;
  private scrollOverlayController?: ScrollOverlayController;
  private emptySlotObserver?: MutationObserver;

  componentDidLoad(): void {
    if (!this.viewport || !this.content || !this.overlay) return;
    this.scrollOverlayController = new ScrollOverlayController({
      host: this.el,
      viewport: this.viewport,
      content: this.content,
      overlay: this.overlay,
      overlayContentSelector: '[slot="actions"]',
    });
    this.scrollOverlayController.connect();
    this.syncEmptyStateLayout();
    this.emptySlotObserver = new MutationObserver(this.syncEmptyStateLayout);
    this.emptySlotObserver.observe(this.el, { childList: true, subtree: true });
  }

  disconnectedCallback(): void {
    this.scrollOverlayController?.disconnect();
    this.emptySlotObserver?.disconnect();
  }

  private syncEmptyStateLayout = (): void => {
    const emptyState = this.el.querySelector<HTMLElement>('[slot="empty"]');
    if (emptyState) {
      emptyState.style.setProperty('position', 'absolute');
      emptyState.style.setProperty('inset-block-start', '0');
      emptyState.style.setProperty('inset-inline', '0');
      emptyState.style.setProperty(
        'inset-block-end',
        'var(--ds-scroll-overlay-block-size, 0)',
      );
      emptyState.style.setProperty('height', 'auto');
      emptyState.style.setProperty('box-sizing', 'border-box');
    }
    this.scrollOverlayController?.sync();
  };

  render() {
    return (
      <Host>
        <div class="conversation-list">
          <div
            class="conversation-list__viewport"
            ref={element => {
              this.viewport = element;
            }}
            onScroll={() => this.scrollOverlayController?.sync()}
          >
            <div
              class="conversation-list__content"
              ref={element => {
                this.content = element;
              }}
            >
              <slot />
              <div class="conversation-list__empty">
                <slot name="empty" />
              </div>
            </div>
          </div>
          <div
            class="conversation-list__fade scroll-edge-fade scroll-edge-fade--top"
            aria-hidden="true"
          />
          <div
            class={{
              'conversation-list__actions': true,
              'conversation-list__actions--footer': this.actionLayout === 'footer',
            }}
            ref={element => {
              this.overlay = element;
            }}
          >
            <div class="conversation-list__actions-surface">
              <slot name="actions" />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}

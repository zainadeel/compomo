import { Component, Element, h, Host } from '@stencil/core';

@Component({
  tag: 'ds-conversation-list',
  styleUrl: 'ConversationList.css',
  scoped: true,
})
export class ConversationList {
  @Element() el!: HTMLElement;

  private empty?: HTMLElement;
  private emptySlotObserver?: MutationObserver;

  componentDidLoad(): void {
    this.syncEmptyStateLayout();
    this.emptySlotObserver = new MutationObserver(this.syncEmptyStateLayout);
    this.emptySlotObserver.observe(this.el, { childList: true, subtree: true });
  }

  disconnectedCallback(): void {
    this.emptySlotObserver?.disconnect();
  }

  private syncEmptyStateLayout = (): void => {
    const emptyState = this.el.querySelector<HTMLElement>('[slot="empty"]');
    if (emptyState && !this.empty?.contains(emptyState)) {
      // Stencil's scoped-slot runtime does not relocate nodes appended after
      // hydration. Keep that dynamic fallback aligned with the CSS-owned
      // wrapper used by declarative slot content.
      emptyState.style.setProperty('position', 'absolute');
      emptyState.style.setProperty('inset-block-start', '0');
      emptyState.style.setProperty('inset-inline', '0');
      emptyState.style.setProperty('inset-block-end', '0');
      emptyState.style.setProperty('height', 'auto');
      emptyState.style.setProperty('box-sizing', 'border-box');
    }
  };

  render() {
    return (
      <Host>
        <div class="conversation-list">
          <div class="conversation-list__viewport">
            <div class="conversation-list__content">
              <slot />
              <div
                class="conversation-list__empty"
                ref={element => {
                  this.empty = element;
                }}
              >
                <slot name="empty" />
              </div>
            </div>
          </div>
          <div class="conversation-list__actions">
            <div class="conversation-list__actions-surface ds-control-elevation ds-control-elevation--md ds-control-elevation--press-scale">
              <slot name="actions" />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}

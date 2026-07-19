import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'ds-conversation-list',
  styleUrl: 'ConversationList.css',
  scoped: true,
})
export class ConversationList {
  render() {
    return (
      <Host>
        <div class="conversation-list">
          <div class="conversation-list__content">
            <slot />
            <div class="conversation-list__empty">
              <slot name="empty" />
            </div>
          </div>
          <div class="conversation-list__actions">
            <div class="conversation-list__actions-surface">
              <slot name="actions" />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}

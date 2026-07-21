import { Component, h, Host, Prop } from '@stencil/core';

export type MessageBubbleVariant = 'user' | 'received';

@Component({
  tag: 'ds-message-bubble',
  styleUrl: 'MessageBubble.css',
  scoped: true,
})
export class MessageBubble {
  @Prop() variant: MessageBubbleVariant = 'received';

  render() {
    return (
      <Host class={`message-bubble--${this.variant}`}>
        <div class="message-bubble"><slot /></div>
      </Host>
    );
  }
}

import { Component, h, Host, Prop } from '@stencil/core';

export type MessageBubbleVariant = 'primary' | 'secondary' | 'ghost';

@Component({
  tag: 'ds-message-bubble',
  styleUrl: 'MessageBubble.css',
  scoped: true,
})
export class MessageBubble {
  @Prop() variant: MessageBubbleVariant = 'secondary';

  render() {
    return (
      <Host class={`message-bubble--${this.variant}`}>
        <div class="message-bubble"><slot /></div>
      </Host>
    );
  }
}

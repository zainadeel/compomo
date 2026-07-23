import { Component, h, Host, Prop } from '@stencil/core';
import type {
  MessageDeliveryState,
  MessageDirection,
  MessageGroupPosition,
} from '../conversation-types';

const DELIVERY_LABELS: Record<MessageDeliveryState, string> = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed to send',
};

@Component({
  tag: 'ds-message',
  styleUrl: 'Message.css',
  scoped: true,
})
export class Message {
  @Prop({ reflect: true }) messageId: string = '';
  @Prop({ reflect: true }) direction: MessageDirection = 'incoming';
  @Prop() groupPosition: MessageGroupPosition = 'single';
  @Prop() author: string = '';
  /** Keep author semantics while allowing products with self-evident roles to hide the visible label. */
  @Prop() showAuthor: boolean = true;
  /** ISO timestamp. */
  @Prop() timestamp: string = '';
  @Prop() deliveryState: MessageDeliveryState | undefined;
  @Prop() streaming: boolean = false;
  @Prop({ reflect: true }) scrollAnchor: boolean = false;

  private formattedTimestamp(): string {
    if (!this.timestamp) return '';
    const parsed = Date.parse(this.timestamp);
    if (Number.isNaN(parsed)) return this.timestamp;
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(parsed));
  }

  render() {
    const delivery = this.deliveryState ? DELIVERY_LABELS[this.deliveryState] : '';
    const formattedTimestamp = this.formattedTimestamp();
    return (
      <Host
        class={`message-host--group-${this.groupPosition}`}
        data-message-id={this.messageId || undefined}
        data-scroll-anchor={this.scrollAnchor ? 'true' : undefined}
        aria-busy={this.streaming ? 'true' : undefined}
      >
        <article
          class={{
            message: true,
            [`message--${this.direction}`]: true,
            [`message--group-${this.groupPosition}`]: true,
          }}
          aria-label={this.author ? `Message from ${this.author}` : 'Message'}
        >
          <div class="message__body">
            <div class="message__header">
              <slot name="header" />
              {this.author && this.showAuthor ? (
                <ds-text as="span" variant="text-body-small" emphasis color="primary">
                  {this.author}
                </ds-text>
              ) : null}
            </div>
            <div class="message__content">
              <slot />
            </div>
            <div class="message__footer">
              <slot name="footer" />
              {delivery ? (
                <ds-text
                  as="span"
                  variant="text-caption"
                  color={this.deliveryState === 'failed' ? 'negative' : 'secondary'}
                >
                  {delivery}
                </ds-text>
              ) : null}
              {this.deliveryState === 'failed' && formattedTimestamp ? (
                <ds-text as="span" variant="text-caption" color="tertiary" aria-hidden="true">
                  ·
                </ds-text>
              ) : null}
              {formattedTimestamp ? (
                <time dateTime={this.timestamp}>
                  <ds-text as="span" variant="text-caption" color="secondary">
                    {formattedTimestamp}
                  </ds-text>
                </time>
              ) : null}
            </div>
          </div>
          <div class="message__actions">
            <slot name="actions" />
          </div>
        </article>
      </Host>
    );
  }
}

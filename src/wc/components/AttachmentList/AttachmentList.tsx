import { Component, h, Host, Prop } from '@stencil/core';
import type { ConversationAttachment } from '../conversation-types';

function safeAttachmentUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, document.baseURI);
    return ['http:', 'https:', 'blob:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

@Component({
  tag: 'ds-attachment-list',
  styleUrl: 'AttachmentList.css',
  scoped: true,
})
export class AttachmentList {
  @Prop() items: ConversationAttachment[] = [];
  @Prop() label: string = 'Attachments';

  private renderItem(item: ConversationAttachment) {
    const url = safeAttachmentUrl(item.url);
    const content = (
      <span class="attachment-list__item-content">
        <ds-icon name="Document" size="sm" color="secondary" />
        <span class="attachment-list__copy">
          <ds-text as="span" variant="text-body-small" emphasis color="primary" lineTruncation={1}>{item.name}</ds-text>
          {item.mediaType || item.size ? (
            <ds-text as="span" variant="text-caption" color="secondary">
              {[item.mediaType, item.size].filter(Boolean).join(' · ')}
            </ds-text>
          ) : null}
        </span>
      </span>
    );
    return url ? (
      <a class="attachment-list__item" href={url} target="_blank" rel="noopener noreferrer">{content}</a>
    ) : (
      <div class="attachment-list__item">{content}</div>
    );
  }

  render() {
    return (
      <Host>
        <div class="attachment-list" role="list" aria-label={this.label}>
          {this.items.map(item => <div role="listitem" key={item.id}>{this.renderItem(item)}</div>)}
        </div>
      </Host>
    );
  }
}

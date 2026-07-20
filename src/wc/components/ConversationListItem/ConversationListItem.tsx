import { Component, Element, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import type { ConversationItemState } from '../conversation-types';

@Component({
  tag: 'ds-conversation-list-item',
  styleUrl: 'ConversationListItem.css',
  scoped: true,
})
export class ConversationListItem {
  @Element() el!: HTMLElement;

  @Prop() conversationId: string = '';
  /** Visible conversation title. Named to avoid the native HTMLElement.title contract. */
  @Prop() conversationTitle: string = '';
  @Prop() preview: string = '';
  /** ISO timestamp for semantic activity metadata. */
  @Prop() updatedAt: string = '';
  @Prop() selected: boolean = false;
  @Prop() state: ConversationItemState = 'default';
  @Prop() statusLabel: string = '';
  @Prop() unreadCount: number = 0;
  /** Keep the contextual-actions surface visible while its popup is open or closing. */
  @Prop({ reflect: true }) actionsOpen: boolean = false;

  @Event() dsSelect!: EventEmitter<{ id: string }>;

  private handleClick = () => this.dsSelect.emit({ id: this.conversationId });

  private handleActionsSlotChange = (event: Event) => {
    const slot = event.target as HTMLSlotElement;
    this.el.classList.toggle(
      'conversation-list-item--has-actions',
      slot.assignedElements({ flatten: true }).length > 0
    );
  };

  render() {
    const busy = this.state === 'busy';
    const subtext = busy && this.statusLabel ? this.statusLabel : this.preview;
    const accessibleName = [
      this.conversationTitle,
      subtext,
      this.unreadCount > 0 ? `${this.unreadCount} unread` : '',
    ]
      .filter(Boolean)
      .join('. ');

    return (
      <Host
        role="listitem"
        class={{ 'conversation-list-item--actions-open': this.actionsOpen }}
      >
        <div class="conversation-list-item__row">
          <button
            type="button"
            class={{
              'conversation-list-item': true,
              'ds-choice-item': true,
              'ds-control--md': true,
              'ds-focus-ring-inset': true,
              'ds-interaction-fill': true,
              'ds-interaction-fill--selected': this.selected,
              'conversation-list-item--error': this.state === 'error',
            }}
            aria-label={accessibleName}
            aria-current={this.selected ? 'true' : undefined}
            aria-busy={busy ? 'true' : undefined}
            onClick={this.handleClick}
          >
            <span class="conversation-list-item__leading ds-choice-item__icon ds-interaction-fill__content">
              <slot name="leading" />
            </span>
            <span class="conversation-list-item__content ds-choice-item__content ds-interaction-fill__content">
              <span class="conversation-list-item__title-row">
                <ds-text
                  class="conversation-list-item__title ds-choice-item__label"
                  as="span"
                  variant="text-body-medium"
                  emphasis
                  color={this.unreadCount > 0 ? 'primary' : 'secondary'}
                  lineTruncation={1}
                >
                  {this.conversationTitle}
                </ds-text>
                {this.unreadCount > 0 ? (
                  <span class="conversation-list-item__unread">
                    <ds-badge variant="dot" surface="secondary" />
                  </span>
                ) : null}
              </span>
              <span class="conversation-list-item__preview-row">
                {busy ? <ds-loader size="xs" color="secondary" /> : null}
                <ds-text
                  class="conversation-list-item__preview ds-choice-item__subtext"
                  as="span"
                  variant="text-body-small"
                  color={this.state === 'error' ? 'negative' : 'secondary'}
                  lineTruncation={1}
                >
                  {subtext}
                </ds-text>
              </span>
              {this.updatedAt ? (
                <time class="conversation-list-item__time" dateTime={this.updatedAt}>
                  {this.updatedAt}
                </time>
              ) : null}
            </span>
            <span class="conversation-list-item__trailing ds-interaction-fill__content">
              <slot name="trailing" />
            </span>
          </button>
          <div class="conversation-list-item__actions">
            <slot name="actions" onSlotchange={this.handleActionsSlotChange} />
          </div>
        </div>
      </Host>
    );
  }
}

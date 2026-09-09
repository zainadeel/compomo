import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import { resolveSafeUrl } from '../../utils';
import type { TagContrast, TagIntent } from '../Tag/Tag';

export interface CardActionCenterTag {
  intent?: TagIntent;
  contrast?: TagContrast;
}

export interface CardActionCenterItem {
  id: string;
  label: string;
  value?: string | number;
  tag?: CardActionCenterTag;
  href?: string;
  isInactive?: boolean;
}

export interface CardActionCenterSection {
  id: string;
  heading: string;
  items: ReadonlyArray<CardActionCenterItem>;
}

export interface CardActionCenterActionDetail {
  sectionId: string;
  itemId: string;
  item: CardActionCenterItem;
  href?: string;
  originalEvent: MouseEvent;
}

let nextCardActionCenterId = 0;

@Component({
  tag: 'ds-card-action-center',
  styleUrl: 'CardActionCenter.css',
  scoped: true,
})
export class CardActionCenter {
  /** Ordered groups of actions rendered in the card. Empty groups are omitted. */
  @Prop() sections: ReadonlyArray<CardActionCenterSection> = [];

  /** Copy shown when no section contains an action. */
  @Prop() emptyMessage: string = 'No actions available';

  /**
   * Emitted when an available row is activated. When a row has an `href`,
   * prevent this event to take over navigation with an application router.
   */
  @Event({ cancelable: true }) dsAction!: EventEmitter<CardActionCenterActionDetail>;

  private readonly instanceId = ++nextCardActionCenterId;

  private get visibleSections(): ReadonlyArray<CardActionCenterSection> {
    return this.sections.filter(section => section.items.length > 0);
  }

  private headingId(section: CardActionCenterSection, index: number): string {
    const sectionId = section.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    return `ds-card-action-center-${this.instanceId}-${index}-${sectionId}`;
  }

  private handleAction(
    section: CardActionCenterSection,
    item: CardActionCenterItem,
    href: string | undefined,
    originalEvent: MouseEvent
  ) {
    if (item.isInactive) return;

    const actionEvent = this.dsAction.emit({
      sectionId: section.id,
      itemId: item.id,
      item,
      href,
      originalEvent,
    });
    if (href && actionEvent.defaultPrevented) originalEvent.preventDefault();
  }

  private renderValue(item: CardActionCenterItem) {
    if (item.value === undefined || item.value === null) return null;
    const value = String(item.value);

    if (item.tag) {
      return (
        <ds-tag
          class="card-action-center__item-value ds-interaction-fill__content"
          label={value}
          intent={item.tag.intent ?? 'neutral'}
          contrast={item.tag.contrast ?? 'faint'}
          size="sm"
          isInset
          rounded
        ></ds-tag>
      );
    }

    return (
      <ds-text
        class="card-action-center__item-value ds-interaction-fill__content"
        variant="text-body-medium"
        color="secondary"
        emphasis
        wrap="nowrap"
        fontFeature="tabular-nums"
        as="span"
      >
        {value}
      </ds-text>
    );
  }

  private renderItem(section: CardActionCenterSection, item: CardActionCenterItem) {
    const href = item.isInactive ? undefined : resolveSafeUrl(item.href);
    const classes = {
      'card-action-center__item': true,
      'card-action-center__item--tagged': !!item.tag && item.value != null,
      'ds-interaction-fill': true,
      'ds-focus-ring-inset': true,
      'ds-control-inactive': !!item.isInactive,
    };
    const content = [
      <ds-text
        class="card-action-center__item-content card-action-center__item-label ds-interaction-fill__content"
        variant="text-body-medium"
        color="secondary"
        wrap="balance"
        as="span"
      >
        {item.label}
      </ds-text>,
      this.renderValue(item),
    ];

    if (href) {
      return (
        <a
          class={classes}
          href={href}
          onClick={(event: MouseEvent) => this.handleAction(section, item, href, event)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        type="button"
        class={classes}
        disabled={item.isInactive || undefined}
        onClick={(event: MouseEvent) => this.handleAction(section, item, undefined, event)}
      >
        {content}
      </button>
    );
  }

  render() {
    const sections = this.visibleSections;

    return (
      <Host>
        {sections.length ? (
          sections.map((section, sectionIndex) => (
            <div class="card-action-center__group">
              {sectionIndex > 0 ? (
                <div class="card-action-center__divider">
                  <ds-divider
                    inset="space-100"
                    length="calc(100% - var(--dimension-space-200))"
                  ></ds-divider>
                </div>
              ) : null}
              <section
                class="card-action-center__section"
                aria-labelledby={this.headingId(section, sectionIndex)}
              >
                <ds-text
                  id={this.headingId(section, sectionIndex)}
                  class="card-action-center__section-heading"
                  variant="text-title-small"
                  emphasis
                  color="primary"
                  wrap="balance"
                  as="h2"
                >
                  {section.heading}
                </ds-text>
                <ul class="card-action-center__list">
                  {section.items.map(item => (
                    <li>{this.renderItem(section, item)}</li>
                  ))}
                </ul>
              </section>
            </div>
          ))
        ) : (
          <ds-text
            class="card-action-center__empty"
            variant="text-body-medium"
            color="secondary"
            wrap="balance"
            as="p"
          >
            {this.emptyMessage}
          </ds-text>
        )}
      </Host>
    );
  }
}

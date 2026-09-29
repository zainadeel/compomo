import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import { resolveSafeUrl } from '../../utils';

export type CardNavigationWidth = 'sm' | 'md' | 'lg';
export type CardNavigationVariant = 'navigation-only' | 'content';

export interface CardNavigationDetail {
  href: string;
  originalEvent: MouseEvent;
}

const CARD_WIDTH_VARS: Record<CardNavigationWidth, string> = {
  sm: 'var(--dimension-card-width-sm)',
  md: 'var(--dimension-card-width-md)',
  lg: 'var(--dimension-card-width-lg)',
};

const CARD_HEIGHT_VARS: Record<CardNavigationWidth, string> = {
  sm: 'var(--dimension-card-height-sm)',
  md: 'var(--dimension-card-height-md)',
  lg: 'var(--dimension-card-height-lg)',
};

@Component({
  tag: 'ds-card-navigation',
  styleUrl: 'CardNavigation.css',
  scoped: true,
})
export class CardNavigation {
  /** Destination for the card's native link. */
  @Prop() href!: string;

  /** Section or destination heading shown in the card header. */
  @Prop() heading!: string;

  /** Optional supporting copy shown below the heading. */
  @Prop() description: string | undefined;
  /** Preserve the card layout while its copy and navigation affordance show skeletons. */
  @Prop() isLoading = false;

  /**
   * `navigation-only` makes the complete card the link. `content` keeps the
   * header as the link and exposes a non-interactive body slot below it.
   */
  @Prop() variant: CardNavigationVariant = 'navigation-only';

  /** Card width token (`sm` / `md` / `lg`). */
  @Prop() cardWidth: CardNavigationWidth = 'md';

  /**
   * Emits before native navigation. Prevent this event to take over routing;
   * the component will then prevent the original link navigation.
   */
  @Event({ cancelable: true }) dsNavigate!: EventEmitter<CardNavigationDetail>;

  private handleNavigation(href: string, originalEvent: MouseEvent) {
    const navigateEvent = this.dsNavigate.emit({ href, originalEvent });
    if (navigateEvent.defaultPrevented) originalEvent.preventDefault();
  }

  private renderHeader(href: string | undefined) {
    const Target = href ? 'a' : 'div';
    const description = this.description?.trim();

    return (
      <Target
        class={{
          'card-navigation__target': true,
          'card-navigation__header': true,
          'ds-chrome-header': true,
          'ds-interaction-fill': !!href,
          'ds-focus-ring-inset': !!href,
        }}
        href={href}
        inert={this.isLoading}
        onClick={href ? (event: MouseEvent) => this.handleNavigation(href, event) : undefined}
      >
        <div
          class={{
            'card-navigation__copy': true,
            'ds-chrome-header__copy': true,
            'ds-chrome-header__copy--stacked': true,
            'ds-control--md': true,
            'ds-interaction-fill__content': true,
          }}
        >
          <div class="card-navigation__line">
            <ds-text
              class="card-navigation__title ds-chrome-header__heading"
              variant="text-title-small"
              emphasis
              color="primary"
              as="h2"
            >
              {this.heading}
            </ds-text>
            {this.isLoading && (
              <ds-skeleton
                width="min(60%, calc(var(--dimension-size-800) * 2))"
                textVariant="text-title-small"
              />
            )}
          </div>
          {description ? (
            <div class="card-navigation__line">
              <ds-text
                class="card-navigation__description ds-chrome-header__description"
                variant="text-body-small"
                color="secondary"
                as="span"
              >
                {description}
              </ds-text>
              {this.isLoading && <ds-skeleton width="95%" textVariant="text-body-small" />}
            </div>
          ) : null}
        </div>
        <span class="card-navigation__chevron ds-chrome-header__trailing ds-interaction-fill__content">
          {this.isLoading ? (
            <ds-skeleton variant="icon" iconSize="md" />
          ) : (
            <ds-icon name="ChevronRight" size="md" color="inherit" aria-hidden="true" />
          )}
        </span>
      </Target>
    );
  }

  render() {
    const href = this.isLoading ? undefined : resolveSafeUrl(this.href);
    const hasContent = this.variant === 'content';

    return (
      <Host
        aria-busy={this.isLoading ? 'true' : undefined}
        class={{
          'card-navigation': true,
          'card-navigation--loading': this.isLoading,
          'card-navigation--navigation-only': !hasContent,
          'card-navigation--content': hasContent,
        }}
        style={{
          '--_card-navigation-width': CARD_WIDTH_VARS[this.cardWidth],
          '--_card-navigation-min-height': CARD_HEIGHT_VARS[this.cardWidth],
        }}
      >
        {this.renderHeader(href)}
        {hasContent ? (
          <div class="card-navigation__body">
            <slot />
          </div>
        ) : null}
      </Host>
    );
  }
}

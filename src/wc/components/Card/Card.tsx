import { Component, h, Host, Prop } from '@stencil/core';

export type CardWidth = 'sm' | 'md' | 'lg';

/** Visual chrome recipe — default app surface, or settings edit wash. */
export type CardAppearance = 'default' | 'editing';

const CARD_WIDTH_VARS: Record<CardWidth, string> = {
  sm: 'var(--dimension-card-width-sm)',
  md: 'var(--dimension-card-width-md)',
  lg: 'var(--dimension-card-width-lg)',
};

const CARD_HEIGHT_VARS: Record<CardWidth, string> = {
  sm: 'var(--dimension-card-height-sm)',
  md: 'var(--dimension-card-height-md)',
  lg: 'var(--dimension-card-height-lg)',
};

const FAINT_BRAND_TITLE_COLOR = 'var(--color-foreground-faint-brand)';

/**
 * Shared card chrome — width + matching min-height tokens, header (title + actions),
 * and a flex body that fills leftover space. Compose this from settings / data-viz cards.
 */
@Component({
  tag: 'ds-card',
  styleUrl: 'Card.css',
  scoped: true,
})
export class Card {
  /** Section heading shown in the card header. */
  @Prop() heading!: string;

  /**
   * Card width token (`sm` / `md` / `lg`). Also sets host `min-height` to the
   * matching `--dimension-card-height-*` so empty bodies still fill the card.
   */
  @Prop() cardWidth: CardWidth = 'md';

  /** Chrome recipe — `editing` applies the settings edit wash. */
  @Prop() appearance: CardAppearance = 'default';

  render() {
    const editing = this.appearance === 'editing';

    return (
      <Host
        class={{
          card: true,
          'card--editing': editing,
        }}
        style={{
          '--_card-width': CARD_WIDTH_VARS[this.cardWidth],
          '--_card-min-height': CARD_HEIGHT_VARS[this.cardWidth],
        }}
      >
        <header class="card__header">
          <ds-text
            class="card__title"
            variant="text-title-small"
            emphasis
            color={editing ? FAINT_BRAND_TITLE_COLOR : 'primary'}
            as="h2"
          >
            {this.heading}
          </ds-text>
          <div class="card__actions">
            <slot name="actions" />
          </div>
        </header>
        <div class="card__body">
          <slot />
        </div>
      </Host>
    );
  }
}

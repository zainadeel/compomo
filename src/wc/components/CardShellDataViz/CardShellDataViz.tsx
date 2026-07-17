import { Component, h, Host, Prop } from '@stencil/core';

export type CardShellDataVizWidth = 'sm' | 'md' | 'lg';

const CARD_WIDTH_VARS: Record<CardShellDataVizWidth, string> = {
  sm: 'var(--dimension-card-width-sm)',
  md: 'var(--dimension-card-width-md)',
  lg: 'var(--dimension-card-width-lg)',
};

const CARD_HEIGHT_VARS: Record<CardShellDataVizWidth, string> = {
  sm: 'var(--dimension-card-height-sm)',
  md: 'var(--dimension-card-height-md)',
  lg: 'var(--dimension-card-height-lg)',
};

/**
 * Dedicated shell chrome for data-visualization cards. Chart-specific layout,
 * legends, hover synchronization, and empty states belong to composing cards.
 */
@Component({
  tag: 'ds-card-shell-data-viz',
  styleUrl: 'CardShellDataViz.css',
  scoped: true,
})
export class CardShellDataViz {
  /** Data-visualization heading shown in the shell header. */
  @Prop() heading!: string;

  /** Width token with the matching data-visualization shell min-height. */
  @Prop() cardWidth: CardShellDataVizWidth = 'md';

  render() {
    return (
      <Host
        class="card-shell-data-viz"
        style={{
          '--_card-shell-data-viz-width': CARD_WIDTH_VARS[this.cardWidth],
          '--_card-shell-data-viz-min-height': CARD_HEIGHT_VARS[this.cardWidth],
        }}
      >
        <header class="card-shell-data-viz__header">
          <ds-text
            class="card-shell-data-viz__title"
            variant="text-title-small"
            emphasis
            color="primary"
            as="h2"
          >
            {this.heading}
          </ds-text>
          <div class="card-shell-data-viz__actions">
            <slot name="actions" />
          </div>
        </header>
        <div class="card-shell-data-viz__body">
          <slot />
        </div>
      </Host>
    );
  }
}

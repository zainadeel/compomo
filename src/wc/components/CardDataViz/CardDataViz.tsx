import { Component, Element, State, h, Host, Prop } from '@stencil/core';

export type CardDataVizWidth = 'xs' | 'sm' | 'md' | 'lg';

const CARD_WIDTH_VARS: Record<CardDataVizWidth, string> = {
  xs: 'var(--dimension-card-width-xs)',
  sm: 'var(--dimension-card-width-sm)',
  md: 'var(--dimension-card-width-md)',
  lg: 'var(--dimension-card-width-lg)',
};

/**
 * Copied from CardSetting as a starting scaffold — header edit affordance removed for now
 * (data-viz widgets don't have an obvious "edit" action the way settings fields do); revisit
 * once the data-viz card's real header actions (menu, caption, footer stat) are designed.
 */
@Component({
  tag: 'ds-card-data-viz',
  styleUrl: 'CardDataViz.css',
  scoped: true,
})
export class CardDataViz {
  @Element() el!: HTMLElement;

  /** Widget heading shown in the card header. */
  @Prop() heading!: string;

  /** Card width token. */
  @Prop() cardWidth: CardDataVizWidth = 'md';

  // Scoped (light-DOM) components have no native slot projection to detect emptiness from CSS —
  // check the actual children so an unused region (e.g. no legend) doesn't render a dangling
  // padded box plus a body gap next to nothing.
  @State() private hasChartSlot = false;
  @State() private hasLegendSlot = false;

  componentWillRender() {
    this.hasChartSlot = !!this.el.querySelector(':scope > [slot="chart"]');
    this.hasLegendSlot = !!this.el.querySelector(':scope > [slot="legend"]');
  }

  render() {
    return (
      <Host class="card-data-viz" style={{ '--_card-data-viz-width': CARD_WIDTH_VARS[this.cardWidth] }}>
        <header class="card-data-viz__header">
          <div class="card-data-viz__title-wrap">
            <ds-text class="card-data-viz__title" variant="text-title-small" color="primary" as="h2">
              {this.heading}
            </ds-text>
          </div>
        </header>
        <div class="card-data-viz__body">
          {this.hasChartSlot && (
            <div class="card-data-viz__chart-region">
              <slot name="chart" />
            </div>
          )}
          {this.hasLegendSlot && (
            <div class="card-data-viz__legend-region">
              <slot name="legend" />
            </div>
          )}
        </div>
      </Host>
    );
  }
}

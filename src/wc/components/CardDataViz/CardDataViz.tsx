import { Component, Element, State, h, Host, Prop } from '@stencil/core';

export type CardDataVizWidth = 'xs' | 'sm' | 'md' | 'lg';

/** Matches the `dsSliceHover`/`dsItemHover` detail shape emitted by `ds-chart-*` and `ds-chart-legend`. */
type HoveredDatum = { label: string } | null;

/** A slotted chart/legend that opts into hover sync by exposing an `activeLabel` prop. */
type SyncableSlot = HTMLElement & { activeLabel?: string | null };

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

  componentDidLoad() {
    // Sync the chart's and legend's `activeLabel` from each other's hover events, so any
    // ds-chart-* + ds-chart-legend pair cross-highlights without every consumer having to
    // wire it up by hand. Delegated on the host (rather than bound to the specific slotted
    // elements) since Stencil events bubble and the slot content can be swapped at runtime.
    this.el.addEventListener('dsSliceHover', this.handleChartHover);
    this.el.addEventListener('dsItemHover', this.handleLegendHover);
  }

  disconnectedCallback() {
    this.el.removeEventListener('dsSliceHover', this.handleChartHover);
    this.el.removeEventListener('dsItemHover', this.handleLegendHover);
  }

  private handleChartHover = (e: Event) => {
    // Not `:scope >` — Stencil's slot polyfill for scoped (non-shadow) components relocates
    // slotted children into an inner `.chart-region`/`.legend-region` wrapper on render, so
    // they're no longer direct children of the host by the time this fires.
    const legend = this.el.querySelector('[slot="legend"]') as SyncableSlot | null;
    if (!legend || !('activeLabel' in legend)) return;
    legend.activeLabel = (e as CustomEvent<HoveredDatum>).detail?.label ?? null;
  };

  private handleLegendHover = (e: Event) => {
    const chart = this.el.querySelector('[slot="chart"]') as SyncableSlot | null;
    if (!chart || !('activeLabel' in chart)) return;
    chart.activeLabel = (e as CustomEvent<HoveredDatum>).detail?.label ?? null;
  };

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

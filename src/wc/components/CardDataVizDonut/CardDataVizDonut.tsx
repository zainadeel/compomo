import { Component, Element, Event, EventEmitter, State, h, Host, Prop } from '@stencil/core';
import type { CardShellDataVizWidth } from '../CardShellDataViz/CardShellDataViz';

export type CardDataVizDonutWidth = CardShellDataVizWidth;

/** Matches the `dsSliceHover`/`dsItemHover` detail shape emitted by `ds-chart-*` and `ds-chart-legend`. */
type HoveredDatum = { label: string } | null;

/** A slotted chart/legend that opts into hover sync by exposing an `activeLabel` prop. */
type SyncableSlot = HTMLElement & { activeLabel?: string | null };

/**
 * Donut data-viz card — dedicated `ds-card-shell-data-viz` chrome with a fill chart region and
 * content-sized legend. Hover sync between chart and legend stays here.
 */
@Component({
  tag: 'ds-card-data-viz-donut',
  styleUrl: 'CardDataVizDonut.css',
  scoped: true,
})
export class CardDataVizDonut {
  @Element() el!: HTMLElement;

  /** Widget heading shown in the card header. */
  @Prop() heading!: string;

  /** Card width token — also sets matching min-height. */
  @Prop() cardWidth: CardDataVizDonutWidth = 'md';
  @Prop() filterLabel: string = 'Filter';

  /** Emits when the header filter control is activated. */
  @Event() dsFilterClick!: EventEmitter<void>;

  // Scoped (light-DOM) components have no native slot projection to detect emptiness from CSS —
  // check the actual children so an unused region (e.g. no legend) doesn't render a dangling
  // padded box plus a body gap next to nothing.
  @State() private hasChartSlot = false;
  @State() private hasLegendSlot = false;

  componentWillRender() {
    // Not `:scope >` — Stencil's scoped slot polyfill relocates slotted children into
    // region wrappers (and here into nested `ds-card`), so they may not stay direct
    // host children across renders.
    this.hasChartSlot = !!this.el.querySelector('[slot="chart"]');
    this.hasLegendSlot = !!this.el.querySelector('[slot="legend"]');
  }

  componentDidLoad() {
    // Sync the chart's and legend's `activeLabel` from each other's hover events, so any
    // ds-chart-donut + ds-chart-legend pair cross-highlights without every consumer having to
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
    // slotted children into an inner region wrapper on render, so they're no longer direct
    // children of the host by the time this fires.
    const legend = this.el.querySelector('[slot="legend"]') as SyncableSlot | null;
    if (!legend || !('activeLabel' in legend)) return;
    legend.activeLabel = (e as CustomEvent<HoveredDatum>).detail?.label ?? null;
  };

  private handleLegendHover = (e: Event) => {
    const chart = this.el.querySelector('[slot="chart"]') as SyncableSlot | null;
    if (!chart || !('activeLabel' in chart)) return;
    chart.activeLabel = (e as CustomEvent<HoveredDatum>).detail?.label ?? null;
  };

  private handleFilterClick = () => {
    this.dsFilterClick.emit();
  };

  render() {
    return (
      <Host class="card-data-viz-donut">
        <ds-card-shell-data-viz heading={this.heading} cardWidth={this.cardWidth}>
          <ds-button-unfilled
            slot="actions"
            variant="icon"
            type="button"
            icon="Filters"
            aria-label={this.filterLabel}
            onDsClick={this.handleFilterClick}
          />
          <div class="card-data-viz-donut__layout">
            {this.hasChartSlot && (
              <div class="card-data-viz-donut__chart-region">
                <slot name="chart" />
              </div>
            )}
            {this.hasLegendSlot && (
              <div class="card-data-viz-donut__legend-region">
                <slot name="legend" />
              </div>
            )}
          </div>
        </ds-card-shell-data-viz>
      </Host>
    );
  }
}

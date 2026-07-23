import { Component, Element, Event, EventEmitter, h, Host, Prop, State } from '@stencil/core';
import type { CardShellDataVizWidth } from '../CardShellDataViz/CardShellDataViz';

export type CardDataVizBarWidth = CardShellDataVizWidth;

type StaticLegendSlot = HTMLElement & {
  highlightOnHover?: boolean;
};

/**
 * Bar-chart data-viz card — dedicated `ds-card-shell-data-viz` chrome with a fill chart
 * region and an optional, content-sized static legend.
 */
@Component({
  tag: 'ds-card-data-viz-bar',
  styleUrl: 'CardDataVizBar.css',
  scoped: true,
})
export class CardDataVizBar {
  @Element() el!: HTMLElement;

  /** Widget heading shown in the card header. */
  @Prop() heading!: string;

  /** Card width token — also sets matching min-height. */
  @Prop() cardWidth: CardDataVizBarWidth = 'md';
  @Prop() filterLabel: string = 'Filter';

  /** Emits when the header filter control is activated. */
  @Event() dsFilterClick!: EventEmitter<void>;

  @State() private hasChartSlot = false;
  @State() private hasLegendSlot = false;

  componentWillRender() {
    this.hasChartSlot = !!this.el.querySelector('[slot="chart"]');
    this.hasLegendSlot = !!this.el.querySelector('[slot="legend"]');
  }

  componentDidRender() {
    const legend = this.el.querySelector(
      'ds-chart-legend[slot="legend"]'
    ) as StaticLegendSlot | null;
    if (!legend) return;
    legend.setAttribute('highlight-on-hover', 'false');
    if ('highlightOnHover' in legend) legend.highlightOnHover = false;
  }

  private handleFilterClick = () => {
    this.dsFilterClick.emit();
  };

  render() {
    return (
      <Host class="card-data-viz-bar">
        <ds-card-shell-data-viz heading={this.heading} cardWidth={this.cardWidth}>
          <ds-button-unfilled
            slot="actions"
            variant="icon"
            type="button"
            icon="Filters"
            aria-label={this.filterLabel}
            onDsClick={this.handleFilterClick}
          />
          <div class="card-data-viz-bar__layout">
            {this.hasChartSlot && (
              <div class="card-data-viz-bar__chart-region">
                <slot name="chart" />
              </div>
            )}
            {this.hasLegendSlot && (
              <div class="card-data-viz-bar__legend-region">
                <slot name="legend" />
              </div>
            )}
          </div>
        </ds-card-shell-data-viz>
      </Host>
    );
  }
}

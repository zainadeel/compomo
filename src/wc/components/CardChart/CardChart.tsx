import { Component, Element, Event, EventEmitter, h, Host, Prop, State } from '@stencil/core';

export type CardChartWidth = 'sm' | 'md' | 'lg';
export type CardChartVariant = 'custom' | 'chart';

type LegendSlot = HTMLElement & {
  activeLabel?: string | null;
  highlightOnHover?: boolean;
};

const CARD_WIDTH_VARS: Record<CardChartWidth, string> = {
  sm: 'var(--dimension-card-width-sm)',
  md: 'var(--dimension-card-width-md)',
  lg: 'var(--dimension-card-width-lg)',
};

const CARD_HEIGHT_VARS: Record<CardChartWidth, string> = {
  sm: 'var(--dimension-card-height-sm)',
  md: 'var(--dimension-card-height-md)',
  lg: 'var(--dimension-card-height-lg)',
};

/**
 * Standard chart card chrome and composition. The variant owns
 * only the chart/legend relationship; applications continue to own data.
 */
@Component({
  tag: 'ds-card-chart',
  styleUrl: 'CardChart.css',
  scoped: true,
})
export class CardChart {
  @Element() el!: HTMLElement;

  /** Chart heading shown in the card header. */
  @Prop() heading!: string;
  /** Chart composition behavior. */
  @Prop() variant: CardChartVariant = 'custom';
  /** Width token with the matching chart-card min-height. */
  @Prop() cardWidth: CardChartWidth = 'md';
  /** Renders the standard filter action before custom actions. */
  @Prop() showFilter: boolean = false;
  @Prop() filterLabel: string = 'Filter';

  /** Emits when the standard header filter control is activated. */
  @Event() dsFilterClick!: EventEmitter<void>;

  @State() private hasChartSlot = false;
  @State() private hasLegendSlot = false;

  componentWillRender() {
    this.hasChartSlot = !!this.el.querySelector('[slot="chart"]');
    this.hasLegendSlot = !!this.el.querySelector('[slot="legend"]');
  }

  componentDidRender() {
    const legend = this.el.querySelector('ds-chart-legend[slot="legend"]') as LegendSlot | null;
    if (this.variant === 'chart' && legend) {
      legend.setAttribute('highlight-on-hover', 'false');
      if ('highlightOnHover' in legend) legend.highlightOnHover = false;
    }
  }

  private handleFilterClick = () => {
    this.dsFilterClick.emit();
  };

  render() {
    const usesChartLayout = this.variant !== 'custom' || this.hasChartSlot;
    return (
      <Host
        class={{
          'card-chart': true,
          [`card-chart--${this.variant}`]: true,
        }}
        style={{
          '--_card-chart-width': CARD_WIDTH_VARS[this.cardWidth],
          '--_card-chart-min-height': CARD_HEIGHT_VARS[this.cardWidth],
        }}
      >
        <header class="card-chart__header ds-chrome-header">
          {/* eslint-disable-next-line local/prefer-direct-ds-text -- Shared header copy owns the control-density geometry around the semantic heading. */}
          <div class="card-chart__copy ds-chrome-header__copy ds-control--md">
            <ds-text
              class="card-chart__title ds-chrome-header__heading"
              variant="text-title-small"
              emphasis
              color="primary"
              as="h2"
            >
              {this.heading}
            </ds-text>
          </div>
          <div class="card-chart__actions ds-chrome-header__trailing">
            {this.showFilter ? (
              <ds-button-unfilled
                variant="icon"
                type="button"
                icon="Filters"
                aria-label={this.filterLabel}
                onDsClick={this.handleFilterClick}
              />
            ) : null}
            <slot name="actions" />
          </div>
        </header>
        <div class="card-chart__body">
          {usesChartLayout ? (
            <div class="card-chart__layout">
              {this.hasChartSlot ? (
                <div
                  class={{
                    'card-chart__chart': true,
                  }}
                >
                  <slot name="chart" />
                </div>
              ) : null}
              {this.hasLegendSlot ? (
                <div class="card-chart__legend">
                  <slot name="legend" />
                </div>
              ) : null}
              <slot />
            </div>
          ) : (
            <slot />
          )}
        </div>
      </Host>
    );
  }
}

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
  /** Skeletonize the header and chart canvas; custom body content owns its loading atoms. */
  @Prop() isLoading: boolean = false;

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
    if (this.isLoading) return;
    this.dsFilterClick.emit();
  };

  render() {
    const usesChartLayout = this.variant !== 'custom' || this.hasChartSlot;
    return (
      <Host
        class={{
          'card-chart': true,
          [`card-chart--${this.variant}`]: true,
          'card-chart--loading': this.isLoading,
        }}
        aria-busy={this.isLoading ? 'true' : undefined}
        style={{
          '--_card-chart-width': CARD_WIDTH_VARS[this.cardWidth],
          '--_card-chart-min-height': CARD_HEIGHT_VARS[this.cardWidth],
        }}
      >
        <header class="card-chart__header ds-chrome-header">
          <div class="card-chart__copy ds-chrome-header__copy ds-control--md">
            <ds-text
              class="card-chart__title ds-chrome-header__heading"
              variant="text-title-small"
              emphasis
              color="primary"
              as="h2"
              aria-hidden={this.isLoading ? 'true' : undefined}
            >
              {this.heading}
            </ds-text>
            {this.isLoading && (
              <ds-skeleton class="card-chart__heading-skeleton" textVariant="text-title-small" />
            )}
          </div>
          <div class="card-chart__actions ds-chrome-header__trailing">
            {this.showFilter ? (
              <ds-skeleton
                preserveLayout
                isLoading={this.isLoading}
                variant="control"
                controlAppearance="outlined"
                controlContent="icon"
              >
                <ds-button-unfilled
                  variant="icon"
                  type="button"
                  icon="Filters"
                  aria-label={this.filterLabel}
                  onDsClick={this.handleFilterClick}
                />
              </ds-skeleton>
            ) : null}
            <slot name="actions" />
          </div>
        </header>
        <div class="card-chart__body">
          {usesChartLayout ? (
            <div class="card-chart__layout">
              {this.hasChartSlot || this.isLoading ? (
                <div
                  class={{
                    'card-chart__chart': true,
                  }}
                >
                  <slot name="chart" />
                  {this.isLoading && (
                    <ds-skeleton class="card-chart__plot-skeleton" variant="control" />
                  )}
                </div>
              ) : null}
              {this.hasLegendSlot ? (
                <div class="card-chart__legend">
                  <slot name="legend" />
                  {this.isLoading && (
                    <ds-skeleton
                      class="card-chart__legend-skeleton"
                      width="min(60%, calc(var(--dimension-size-800) * 2))"
                    />
                  )}
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

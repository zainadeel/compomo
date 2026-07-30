import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
} from '@stencil/core';

export type CardDataVizWidth = 'sm' | 'md' | 'lg';
export type CardDataVizVariant = 'custom' | 'bar' | 'line' | 'donut';

type HoveredDatum = { label: string } | null;

type ChartSlot = HTMLElement & {
  activeLabel?: string | null;
  showTooltip?: boolean;
};

type LegendSlot = HTMLElement & {
  activeLabel?: string | null;
  highlightOnHover?: boolean;
};

const CARD_WIDTH_VARS: Record<CardDataVizWidth, string> = {
  sm: 'var(--dimension-card-width-sm)',
  md: 'var(--dimension-card-width-md)',
  lg: 'var(--dimension-card-width-lg)',
};

const CARD_HEIGHT_VARS: Record<CardDataVizWidth, string> = {
  sm: 'var(--dimension-card-height-sm)',
  md: 'var(--dimension-card-height-md)',
  lg: 'var(--dimension-card-height-lg)',
};

/**
 * Standard data-visualization card chrome and composition. The variant owns
 * only the chart/legend relationship; applications continue to own data.
 */
@Component({
  tag: 'ds-card-data-viz',
  styleUrl: 'CardDataViz.css',
  scoped: true,
})
export class CardDataViz {
  @Element() el!: HTMLElement;

  /** Data-visualization heading shown in the card header. */
  @Prop() heading!: string;
  /** Chart composition behavior. */
  @Prop() variant: CardDataVizVariant = 'custom';
  /** Width token with the matching data-visualization card min-height. */
  @Prop() cardWidth: CardDataVizWidth = 'md';
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

  componentDidLoad() {
    this.el.addEventListener('dsSliceHover', this.handleChartHover);
    this.el.addEventListener('dsItemHover', this.handleLegendHover);
  }

  componentDidRender() {
    const chart = this.el.querySelector('[slot="chart"]') as ChartSlot | null;
    const legend = this.el.querySelector(
      'ds-chart-legend[slot="legend"]'
    ) as LegendSlot | null;

    if (this.variant === 'donut') {
      if (chart && 'showTooltip' in chart) {
        chart.showTooltip = !this.hasLegendSlot;
      }
      return;
    }

    if (
      (this.variant === 'bar' || this.variant === 'line') &&
      legend
    ) {
      legend.setAttribute('highlight-on-hover', 'false');
      if ('highlightOnHover' in legend) legend.highlightOnHover = false;
    }
  }

  disconnectedCallback() {
    this.el.removeEventListener('dsSliceHover', this.handleChartHover);
    this.el.removeEventListener('dsItemHover', this.handleLegendHover);
  }

  private handleChartHover = (event: Event) => {
    if (this.variant !== 'donut') return;
    const legend = this.el.querySelector('[slot="legend"]') as LegendSlot | null;
    if (!legend || !('activeLabel' in legend)) return;
    legend.activeLabel =
      (event as CustomEvent<HoveredDatum>).detail?.label ?? null;
  };

  private handleLegendHover = (event: Event) => {
    if (this.variant !== 'donut') return;
    const chart = this.el.querySelector('[slot="chart"]') as ChartSlot | null;
    if (!chart || !('activeLabel' in chart)) return;
    chart.activeLabel =
      (event as CustomEvent<HoveredDatum>).detail?.label ?? null;
  };

  private handleFilterClick = () => {
    this.dsFilterClick.emit();
  };

  render() {
    const usesChartLayout = this.variant !== 'custom' || this.hasChartSlot;
    return (
      <Host
        class={{
          'card-data-viz': true,
          [`card-data-viz--${this.variant}`]: true,
        }}
        style={{
          '--_card-data-viz-width': CARD_WIDTH_VARS[this.cardWidth],
          '--_card-data-viz-min-height': CARD_HEIGHT_VARS[this.cardWidth],
        }}
      >
        <header class="card-data-viz__header ds-chrome-row ds-chrome-space--md">
          <ds-text
            class="card-data-viz__title"
            variant="text-title-small"
            emphasis
            color="primary"
            as="h2"
          >
            {this.heading}
          </ds-text>
          <div class="card-data-viz__actions">
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
        <div class="card-data-viz__body">
          {usesChartLayout ? (
            <div class="card-data-viz__layout">
              {this.hasChartSlot ? (
                <div
                  class={{
                    'card-data-viz__chart': true,
                    'card-data-viz__chart--fill': this.variant === 'donut',
                  }}
                >
                  <slot name="chart" />
                </div>
              ) : null}
              {this.hasLegendSlot ? (
                <div class="card-data-viz__legend">
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

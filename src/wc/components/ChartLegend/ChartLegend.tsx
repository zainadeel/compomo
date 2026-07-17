import { Component, Prop, State, Event, EventEmitter, h, Host } from '@stencil/core';
import { categoryColor } from '../../utils/chart-colors';
import { formatCompactNumber, formatPercentage } from '../../utils';
import type { ChartLegendItem } from '../../utils/chart-types';

export type ChartLegendDirection = 'vertical' | 'horizontal';
export type ChartLegendPercentageDecimals = 1 | 2;

const DIMMED_OPACITY = 0.25;

/**
 * Base legend for `ds-chart-*` components. Webapp's Overview widgets each style
 * legends differently (list w/ values, compact chips, bare swatches, external
 * stat callouts) — this covers the common "swatch + label + optional value" case.
 * Consumers who need a different treatment skip this component entirely and
 * render their own markup against the same `ChartDatum[]` data.
 */
@Component({
  tag: 'ds-chart-legend',
  styleUrl: 'ChartLegend.css',
  scoped: true,
})
export class ChartLegend {
  @Prop() locale: string | undefined;
  /** Legend entries. Set as a JS property (not an HTML attribute). */
  @Prop() items: ChartLegendItem[] = [];
  @Prop() direction: ChartLegendDirection = 'vertical';
  /** Show each item's share of the total (of items with a `value`) alongside its count. */
  @Prop() showPercentage: boolean = true;
  /** Fixed number of decimal places shown for percentages. */
  @Prop() percentageDecimals: ChartLegendPercentageDecimals = 1;
  /**
   * Externally controlled highlight, matched by `label` — e.g. drive this from a sibling
   * chart's `dsSliceHover` event to keep chart and legend hover in sync. Only dims the other
   * rows' opacity (like a chart dimming its other slices) — it never shows the hover-fill,
   * since that's reserved for a real pointer/keyboard interaction on this row.
   */
  @Prop() activeLabel: string | null = null;

  /** Own pointer/focus hover, kept separate from `activeLabel` so the hover-fill (a "you can
   * click here" affordance) never shows just because an external row was synced in. */
  @State() private hoveredLabel: string | null = null;

  /** Fires on row hover/focus with the item, or `null` on leave/blur. */
  @Event() dsItemHover!: EventEmitter<ChartLegendItem | null>;
  /** Fires when a deep-linkable row (`item.href` set) is activated. */
  @Event() dsItemClick!: EventEmitter<{ item: ChartLegendItem; originalEvent: MouseEvent }>;

  private handleHover(item: ChartLegendItem | null) {
    this.hoveredLabel = item?.label ?? null;
    this.dsItemHover.emit(item);
  }

  private handleClick = (item: ChartLegendItem, originalEvent: MouseEvent) => {
    this.dsItemClick.emit({ item, originalEvent });
  };

  render() {
    const total = this.items.reduce((sum, item) => sum + (item.value ?? 0), 0);
    // Highlight/dim from either this component's own hover or an externally-synced label
    // (e.g. a sibling ds-chart-donut slice) — same mechanism ds-chart-donut uses for its slices.
    const highlightLabel = this.activeLabel ?? this.hoveredLabel;

    return (
      <Host
        class={{
          'chart-legend': true,
          [`chart-legend--${this.direction}`]: true,
          'chart-legend--show-percentage': this.showPercentage,
        }}
      >
        {/* mouseleave lives on the list, not each row — the row-gap between items is still
            inside the list's box, so crossing it while moving between rows never fires this.
            Only actually leaving the whole list does, and that clears with no delay. */}
        <ul class="chart-legend__list" onMouseLeave={() => this.handleHover(null)}>
          {this.items.map((item, i) => {
            const isDimmed = highlightLabel != null && item.label !== highlightLabel;
            const RowTag = item.href ? 'a' : 'div';
            const percentage = item.value != null
              ? formatPercentage(total ? item.value / total : 0, this.percentageDecimals, this.locale)
              : '';

            return (
              <li class="chart-legend__list-item" key={item.label}>
                <RowTag
                  class={{
                    'chart-legend__item': true,
                    'chart-legend__item--interactive': !!item.href,
                    'ds-control--md': true,
                    'ds-interaction-fill': true,
                    'ds-focus-ring-inset': !!item.href,
                  }}
                  style={{ opacity: isDimmed ? String(DIMMED_OPACITY) : '1' }}
                  href={item.href}
                  onClick={item.href ? (e: MouseEvent) => this.handleClick(item, e) : undefined}
                  onMouseEnter={() => this.handleHover(item)}
                  onFocus={() => this.handleHover(item)}
                  onBlur={() => this.handleHover(null)}
                >
                  <span class="chart-legend__swatch-box">
                    <span class="chart-legend__swatch" style={{ backgroundColor: item.color ?? categoryColor(i) }} />
                  </span>
                  <ds-text
                    class="chart-legend__label"
                    as="span"
                    variant="text-body-medium"
                    color="secondary"
                    lineTruncation={1}
                    title={item.label}
                  >
                    {item.label}
                  </ds-text>
                  {item.value != null && (
                    <ds-text
                      class="chart-legend__value"
                      as="span"
                      variant="text-body-medium"
                      color="primary"
                      lineTruncation={1}
                      align="right"
                      fontFeature="tabular-nums"
                      title={String(item.value)}
                    >
                      {formatCompactNumber(item.value, this.locale)}
                    </ds-text>
                  )}
                  {item.value != null && this.showPercentage && (
                    <ds-text
                      class="chart-legend__percentage"
                      as="span"
                      variant="text-body-medium"
                      color="primary"
                      lineTruncation={1}
                      align="right"
                      fontFeature="tabular-nums"
                      title={percentage}
                    >
                      {percentage}
                    </ds-text>
                  )}
                </RowTag>
              </li>
            );
          })}
        </ul>
      </Host>
    );
  }
}

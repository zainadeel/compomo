import { Component, Prop, h, Host } from '@stencil/core';
import { scaleBand, scaleLinear } from 'd3-scale';
import { categoryColor } from '../../utils/chart-colors';
import { formatPercentage } from '../../utils';
import type { ChartSeries } from '../../utils/chart-types';

export type ChartBarStackedVariant = 'stacked' | 'percentage';

const MARGIN = { top: 16, right: 16, bottom: 24, left: 32 };
const PERCENTAGE_TICKS = [0, 25, 50, 75, 100];

@Component({
  tag: 'ds-chart-bar-stacked',
  styleUrl: 'ChartBarStacked.css',
  scoped: true,
})
export class ChartBarStacked {
  /** Ordered stack series. Set as a JS property (not an HTML attribute). */
  @Prop() series: ChartSeries[] = [];
  /** X-axis labels — must match each series' `data` length. Set as a JS property. */
  @Prop() categories: string[] = [];
  @Prop() variant: ChartBarStackedVariant = 'stacked';
  @Prop() width: number = 480;
  @Prop() height: number = 240;

  private valuesForCategory(categoryIndex: number) {
    return this.series.map(series => Math.max(0, series.data[categoryIndex] ?? 0));
  }

  private accessibleLabel() {
    return this.categories
      .map((category, categoryIndex) => {
        const values = this.valuesForCategory(categoryIndex);
        const total = values.reduce((sum, value) => sum + value, 0);
        const details = this.series
          .map((series, seriesIndex) => {
            const value = values[seriesIndex];
            const visibleValue = this.variant === 'percentage'
              ? formatPercentage(total ? value / total : 0, 1)
              : String(value);
            return `${series.name}: ${visibleValue}`;
          })
          .join(', ');
        return `${category}: ${details}`;
      })
      .join('; ');
  }

  render() {
    const innerWidth = this.width - MARGIN.left - MARGIN.right;
    const innerHeight = this.height - MARGIN.top - MARGIN.bottom;
    const categoryValues = this.categories.map((_, index) => this.valuesForCategory(index));
    const totals = categoryValues.map(values =>
      values.reduce((sum, value) => sum + value, 0)
    );
    const yMax = this.variant === 'percentage' ? 100 : Math.max(0, ...totals);

    const xScale = scaleBand()
      .domain(this.categories)
      .range([0, innerWidth])
      .padding(0.35);

    const yScale = scaleLinear()
      .domain([0, yMax || 1])
      .range([innerHeight, 0])
      .nice();

    const yTicks = this.variant === 'percentage' ? PERCENTAGE_TICKS : yScale.ticks(4);

    return (
      <Host class="chart-bar-stacked">
        <svg
          class="chart-bar-stacked__svg"
          viewBox={`0 0 ${this.width} ${this.height}`}
          width={this.width}
          height={this.height}
          role="img"
          aria-label={this.accessibleLabel()}
        >
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {yTicks.map(tick => (
              <g key={`grid-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
                <line class="chart-bar-stacked__gridline" x1={0} x2={innerWidth} />
                <text
                  class="chart-bar-stacked__axis-label"
                  x={-8}
                  text-anchor="end"
                  dominant-baseline="middle"
                >
                  {this.variant === 'percentage' ? `${tick}%` : tick}
                </text>
              </g>
            ))}

            {this.categories.map((category, categoryIndex) => {
              const barWidth = xScale.bandwidth();
              const barX = xScale(category) ?? 0;
              const values = categoryValues[categoryIndex];
              const total = totals[categoryIndex];
              const topSeriesIndex = values.reduce(
                (topIndex, value, seriesIndex) => (value > 0 ? seriesIndex : topIndex),
                -1
              );
              let cumulativeValue = 0;

              return (
                <g class="chart-bar-stacked__stack" data-category={category} key={category}>
                  {this.series.map((series, seriesIndex) => {
                    const rawValue = values[seriesIndex];
                    const value = this.variant === 'percentage'
                      ? total
                        ? (rawValue / total) * 100
                        : 0
                      : rawValue;
                    const segmentStart = cumulativeValue;
                    const segmentEnd = cumulativeValue + value;
                    cumulativeValue = segmentEnd;

                    const segmentY = yScale(segmentEnd);
                    const segmentBottom = yScale(segmentStart);
                    const segmentHeight = Math.max(0, segmentBottom - segmentY);
                    if (!segmentHeight) return null;

                    const fill = series.color ?? categoryColor(seriesIndex);
                    const isTopSegment = seriesIndex === topSeriesIndex;
                    const hasRoundedTop =
                      this.variant === 'stacked' && isTopSegment;
                    const squareBaseY = segmentY + segmentHeight / 2;
                    const squareBaseHeight = segmentHeight / 2;

                    return (
                      <g
                        class="chart-bar-stacked__segment"
                        data-series={series.name}
                        key={series.name}
                      >
                        <rect
                          class={{
                            'chart-bar-stacked__segment-shape': true,
                            'chart-bar-stacked__segment-shape--rounded': hasRoundedTop,
                          }}
                          x={barX}
                          y={segmentY}
                          width={barWidth}
                          height={segmentHeight}
                          fill={fill}
                        />
                        {hasRoundedTop ? (
                          <rect
                            class="chart-bar-stacked__segment-square-base"
                            x={barX}
                            y={squareBaseY}
                            width={barWidth}
                            height={squareBaseHeight}
                            fill={fill}
                          />
                        ) : null}
                        {segmentStart > 0 ? (
                          <line
                            class="chart-bar-stacked__segment-separator"
                            x1={barX}
                            x2={barX + barWidth}
                            y1={segmentBottom}
                            y2={segmentBottom}
                            vector-effect="non-scaling-stroke"
                          />
                        ) : null}
                      </g>
                    );
                  })}
                  <text
                    class="chart-bar-stacked__axis-label"
                    x={barX + barWidth / 2}
                    y={innerHeight + 16}
                    text-anchor="middle"
                  >
                    {category}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </Host>
    );
  }
}

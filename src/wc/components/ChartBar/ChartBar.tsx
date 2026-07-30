import { Component, Prop, State, Watch, h, Host } from '@stencil/core';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { categoryColor } from '../../utils/chart-colors';
import { formatPercentage } from '../../utils';
import { resolveCartesianChartLayout } from '../../utils/cartesian-chart-layout';
import {
  ChartViewportController,
  type ChartViewportSize,
} from '../../utils/chart-viewport-controller';
import type { ChartDatum, ChartSeries } from '../../utils/chart-types';

export type ChartBarVariant = 'single' | 'stacked' | 'percentage';

const PERCENTAGE_TICKS = [0, 25, 50, 75, 100];

@Component({
  tag: 'ds-chart-bar',
  styleUrl: 'ChartBar.css',
  scoped: true,
})
export class ChartBar {
  /** Rendering model. Single uses `data`; stacked and percentage use `series` and `categories`. */
  @Prop() variant: ChartBarVariant = 'single';
  /** Bars to render. Set as a JS property (not an HTML attribute). */
  @Prop() data: ChartDatum[] = [];
  /** Ordered stack series for stacked and percentage variants. Set as a JS property. */
  @Prop() series: ChartSeries[] = [];
  /** X-axis labels for stacked and percentage variants. Set as a JS property. */
  @Prop() categories: string[] = [];
  /** Standalone intrinsic width. Container constraints reflow the plot at rendered pixel size. */
  @Prop() width: number = 480;
  /** Standalone intrinsic height. Container constraints reflow the plot at rendered pixel size. */
  @Prop() height: number = 240;

  @State() private viewport: ChartViewportSize | undefined;

  private viewportController: ChartViewportController | null = null;
  private svgEl: SVGElement | null = null;

  componentDidLoad() {
    this.connectViewportController();
  }

  connectedCallback() {
    if (this.svgEl && !this.viewportController) this.connectViewportController();
  }

  componentDidRender() {
    if (!this.viewportController) this.connectViewportController();
  }

  private connectViewportController() {
    if (!this.svgEl) return;
    this.viewportController = new ChartViewportController(this.svgEl, viewport => {
      if (
        viewport.width !== this.viewport?.width ||
        viewport.height !== this.viewport?.height
      ) {
        this.viewport = viewport;
      }
    });
    this.viewportController.connect();
  }

  disconnectedCallback() {
    this.viewportController?.disconnect();
    this.viewportController = null;
  }

  @Watch('width')
  @Watch('height')
  handleIntrinsicSizeChange() {
    this.viewport = undefined;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => this.viewportController?.measure());
    }
  }

  private renderSingle(
    innerWidth: number,
    innerHeight: number,
    axisLabelGap: number,
    categoryLabelOffset: number
  ) {
    const yMax = max(this.data, d => d.value) ?? 0;
    const xScale = scaleBand()
      .domain(this.data.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.35);
    const yScale = scaleLinear()
      .domain([0, yMax || 1])
      .range([innerHeight, 0])
      .nice();
    const yTicks = yScale.ticks(4);

    return (
      <g>
        {yTicks.map(tick => (
          <g key={`grid-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
            <line class="chart-bar__gridline" x1={0} x2={innerWidth} />
            <text
              class="chart-bar__axis-label"
              x={-axisLabelGap}
              text-anchor="end"
              dominant-baseline="middle"
            >
              {tick}
            </text>
          </g>
        ))}

        {this.data.map((datum, index) => {
          const barWidth = xScale.bandwidth();
          const barX = xScale(datum.label) ?? 0;
          const barY = yScale(datum.value);
          const barHeight = innerHeight - barY;
          const squareBaseY = barY + barHeight / 2;
          const squareBaseHeight = barHeight / 2;
          const fill = datum.color ?? categoryColor(index);
          return (
            <g key={datum.label}>
              <rect
                class="chart-bar__bar chart-bar__bar--rounded"
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={fill}
              />
              <rect
                class="chart-bar__bar chart-bar__bar--square-base"
                x={barX}
                y={squareBaseY}
                width={barWidth}
                height={squareBaseHeight}
                fill={fill}
              />
              <text
                class="chart-bar__axis-label"
                x={barX + barWidth / 2}
                y={innerHeight + categoryLabelOffset}
                text-anchor="middle"
              >
                {datum.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  private valuesForCategory(categoryIndex: number) {
    return this.series.map(series => Math.max(0, series.data[categoryIndex] ?? 0));
  }

  private stackedAccessibleLabel() {
    return this.categories
      .map((category, categoryIndex) => {
        const values = this.valuesForCategory(categoryIndex);
        const total = values.reduce((sum, value) => sum + value, 0);
        const details = this.series
          .map((series, seriesIndex) => {
            const value = values[seriesIndex];
            const visibleValue =
              this.variant === 'percentage'
                ? formatPercentage(total ? value / total : 0, 1)
                : String(value);
            return `${series.name}: ${visibleValue}`;
          })
          .join(', ');
        return `${category}: ${details}`;
      })
      .join('; ');
  }

  private renderStacked(
    innerWidth: number,
    innerHeight: number,
    axisLabelGap: number,
    categoryLabelOffset: number
  ) {
    const categoryValues = this.categories.map((_, index) =>
      this.valuesForCategory(index)
    );
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
    const yTicks =
      this.variant === 'percentage' ? PERCENTAGE_TICKS : yScale.ticks(4);

    return (
      <g>
        {yTicks.map(tick => (
          <g key={`grid-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
            <line class="chart-bar__gridline" x1={0} x2={innerWidth} />
            <text
              class="chart-bar__axis-label"
              x={-axisLabelGap}
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
            (topIndex, value, seriesIndex) =>
              value > 0 ? seriesIndex : topIndex,
            -1
          );
          let cumulativeValue = 0;

          return (
            <g class="chart-bar__stack" data-category={category} key={category}>
              {this.series.map((series, seriesIndex) => {
                const rawValue = values[seriesIndex];
                const value =
                  this.variant === 'percentage'
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
                const hasRoundedTop =
                  this.variant === 'stacked' && seriesIndex === topSeriesIndex;
                const squareBaseY = segmentY + segmentHeight / 2;
                const squareBaseHeight = segmentHeight / 2;

                return (
                  <g
                    class="chart-bar__segment"
                    data-series={series.name}
                    key={series.name}
                  >
                    <rect
                      class={{
                        'chart-bar__segment-shape': true,
                        'chart-bar__segment-shape--rounded': hasRoundedTop,
                      }}
                      x={barX}
                      y={segmentY}
                      width={barWidth}
                      height={segmentHeight}
                      fill={fill}
                    />
                    {hasRoundedTop ? (
                      <rect
                        class="chart-bar__segment-square-base"
                        x={barX}
                        y={squareBaseY}
                        width={barWidth}
                        height={squareBaseHeight}
                        fill={fill}
                      />
                    ) : null}
                    {segmentStart > 0 ? (
                      <line
                        class="chart-bar__segment-separator"
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
                class="chart-bar__axis-label"
                x={barX + barWidth / 2}
                y={innerHeight + categoryLabelOffset}
                text-anchor="middle"
              >
                {category}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  render() {
    const viewportWidth = this.viewport?.width ?? this.width;
    const viewportHeight = this.viewport?.height ?? this.height;
    const { margin, axisLabelGap, categoryLabelOffset } =
      resolveCartesianChartLayout();
    const innerWidth = Math.max(0, viewportWidth - margin.left - margin.right);
    const innerHeight = Math.max(0, viewportHeight - margin.top - margin.bottom);
    const isSingle = this.variant === 'single';
    const accessibleLabel = isSingle
      ? this.data.map(datum => `${datum.label}: ${datum.value}`).join(', ')
      : this.stackedAccessibleLabel();

    return (
      <Host
        class={{
          'chart-bar': true,
          [`chart-bar--${this.variant}`]: true,
        }}
      >
        <svg
          class="chart-bar__svg"
          ref={element => {
            this.svgEl = element ?? null;
          }}
          width={viewportWidth}
          height={viewportHeight}
          role="img"
          aria-label={accessibleLabel}
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {isSingle
              ? this.renderSingle(
                  innerWidth,
                  innerHeight,
                  axisLabelGap,
                  categoryLabelOffset
                )
              : this.renderStacked(
                  innerWidth,
                  innerHeight,
                  axisLabelGap,
                  categoryLabelOffset
                )}
          </g>
        </svg>
      </Host>
    );
  }
}

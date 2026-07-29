import { Component, Prop, State, Watch, h, Host } from '@stencil/core';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { categoryColor } from '../../utils/chart-colors';
import { resolveCartesianChartLayout } from '../../utils/cartesian-chart-layout';
import {
  ChartViewportController,
  type ChartViewportSize,
} from '../../utils/chart-viewport-controller';
import type { ChartDatum } from '../../utils/chart-types';

@Component({
  tag: 'ds-chart-bar',
  styleUrl: 'ChartBar.css',
  scoped: true,
})
export class ChartBar {
  /** Bars to render. Set as a JS property (not an HTML attribute). */
  @Prop() data: ChartDatum[] = [];
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

  render() {
    const viewportWidth = this.viewport?.width ?? this.width;
    const viewportHeight = this.viewport?.height ?? this.height;
    const { margin, axisLabelGap, categoryLabelOffset } =
      resolveCartesianChartLayout();
    const innerWidth = Math.max(0, viewportWidth - margin.left - margin.right);
    const innerHeight = Math.max(0, viewportHeight - margin.top - margin.bottom);

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
      <Host class="chart-bar">
        <svg
          class="chart-bar__svg"
          ref={element => {
            this.svgEl = element ?? null;
          }}
          width={viewportWidth}
          height={viewportHeight}
          role="img"
          aria-label={this.data.map(d => `${d.label}: ${d.value}`).join(', ')}
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
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

            {this.data.map((d, i) => {
              const barWidth = xScale.bandwidth();
              const barX = xScale(d.label) ?? 0;
              const barY = yScale(d.value);
              const barHeight = innerHeight - barY;
              const squareBaseY = barY + barHeight / 2;
              const squareBaseHeight = barHeight / 2;
              const fill = d.color ?? categoryColor(i);
              return (
                <g key={d.label}>
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
                    {d.label}
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

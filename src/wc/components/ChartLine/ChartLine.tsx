import { Component, Prop, State, Watch, h, Host } from '@stencil/core';
import { line as lineShape } from 'd3-shape';
import { scaleLinear, scalePoint } from 'd3-scale';
import { max } from 'd3-array';
import { categoryColor } from '../../utils/chart-colors';
import { resolveCartesianChartLayout } from '../../utils/cartesian-chart-layout';
import {
  ChartViewportController,
  type ChartViewportSize,
} from '../../utils/chart-viewport-controller';
import type { ChartSeries } from '../../utils/chart-types';

@Component({
  tag: 'ds-chart-line',
  styleUrl: 'ChartLine.css',
  scoped: true,
})
export class ChartLine {
  /** One or more series to plot. Set as a JS property (not an HTML attribute). */
  @Prop() series: ChartSeries[] = [];
  /** X-axis labels — must match each series' `data` length. Set as a JS property. */
  @Prop() categories: string[] = [];
  /** Standalone intrinsic width. Container constraints reflow the plot at rendered pixel size. */
  @Prop() width: number = 480;
  /** Standalone intrinsic height. Container constraints reflow the plot at rendered pixel size. */
  @Prop() height: number = 240;
  @Prop() showPoints: boolean = true;

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

    const allValues = this.series.flatMap(s => s.data);
    const yMax = max(allValues) ?? 0;

    const xScale = scalePoint<number>()
      .domain(this.categories.map((_, i) => i))
      .range([0, innerWidth]);

    const yScale = scaleLinear()
      .domain([0, yMax || 1])
      .range([innerHeight, 0])
      .nice();

    const lineGenerator = lineShape<number>()
      .x((_, i) => xScale(i) ?? 0)
      .y(d => yScale(d));

    const yTicks = yScale.ticks(4);

    return (
      <Host class="chart-line">
        <svg
          class="chart-line__svg"
          ref={element => {
            this.svgEl = element ?? null;
          }}
          width={viewportWidth}
          height={viewportHeight}
          role="img"
          aria-label={this.series.map(s => s.name).join(', ')}
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {yTicks.map(tick => (
              <g key={`grid-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
                <line class="chart-line__gridline" x1={0} x2={innerWidth} />
                <text
                  class="chart-line__axis-label"
                  x={-axisLabelGap}
                  text-anchor="end"
                  dominant-baseline="middle"
                >
                  {tick}
                </text>
              </g>
            ))}

            {this.categories.map((label, i) => (
              <text
                key={`x-${label}`}
                class="chart-line__axis-label"
                x={xScale(i) ?? 0}
                y={innerHeight + categoryLabelOffset}
                text-anchor="middle"
              >
                {label}
              </text>
            ))}

            {this.series.map((s, si) => {
              const color = s.color ?? categoryColor(si);
              return (
                <g key={s.name}>
                  <path class="chart-line__path" d={lineGenerator(s.data) ?? undefined} stroke={color} />
                  {this.showPoints &&
                    s.data.map((d, i) => (
                      <circle
                        key={`${s.name}-${i}`}
                        class="chart-line__point"
                        cx={xScale(i) ?? 0}
                        cy={yScale(d)}
                        fill={color}
                      />
                    ))}
                </g>
              );
            })}
          </g>
        </svg>
      </Host>
    );
  }
}

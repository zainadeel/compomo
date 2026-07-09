import { Component, Prop, h, Host } from '@stencil/core';
import { line as lineShape } from 'd3-shape';
import { scaleLinear, scalePoint } from 'd3-scale';
import { max } from 'd3-array';
import { categoryColor } from '../../utils/chart-colors';
import type { ChartSeries } from '../../utils/chart-types';

const MARGIN = { top: 16, right: 16, bottom: 24, left: 32 };

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
  @Prop() width: number = 480;
  @Prop() height: number = 240;
  @Prop() showPoints: boolean = true;

  render() {
    const innerWidth = this.width - MARGIN.left - MARGIN.right;
    const innerHeight = this.height - MARGIN.top - MARGIN.bottom;

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
          viewBox={`0 0 ${this.width} ${this.height}`}
          width={this.width}
          height={this.height}
          role="img"
          aria-label={this.series.map(s => s.name).join(', ')}
        >
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {yTicks.map(tick => (
              <g key={`grid-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
                <line class="chart-line__gridline" x1={0} x2={innerWidth} />
                <text class="chart-line__axis-label" x={-8} text-anchor="end" dominant-baseline="middle">
                  {tick}
                </text>
              </g>
            ))}

            {this.categories.map((label, i) => (
              <text
                key={`x-${label}`}
                class="chart-line__axis-label"
                x={xScale(i) ?? 0}
                y={innerHeight + 16}
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
                        r={3}
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

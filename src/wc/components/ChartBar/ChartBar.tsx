import { Component, Prop, h, Host } from '@stencil/core';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { categoryColor } from '../../utils/chart-colors';
import type { ChartDatum } from '../../utils/chart-types';

const MARGIN = { top: 16, right: 16, bottom: 24, left: 32 };

@Component({
  tag: 'ds-chart-bar',
  styleUrl: 'ChartBar.css',
  scoped: true,
})
export class ChartBar {
  /** Bars to render. Set as a JS property (not an HTML attribute). */
  @Prop() data: ChartDatum[] = [];
  @Prop() width: number = 480;
  @Prop() height: number = 240;

  render() {
    const innerWidth = this.width - MARGIN.left - MARGIN.right;
    const innerHeight = this.height - MARGIN.top - MARGIN.bottom;

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
          viewBox={`0 0 ${this.width} ${this.height}`}
          width={this.width}
          height={this.height}
          role="img"
          aria-label={this.data.map(d => `${d.label}: ${d.value}`).join(', ')}
        >
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            {yTicks.map(tick => (
              <g key={`grid-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
                <line class="chart-bar__gridline" x1={0} x2={innerWidth} />
                <text class="chart-bar__axis-label" x={-8} text-anchor="end" dominant-baseline="middle">
                  {tick}
                </text>
              </g>
            ))}

            {this.data.map((d, i) => {
              const barWidth = xScale.bandwidth();
              const barX = xScale(d.label) ?? 0;
              const barY = yScale(d.value);
              return (
                <g key={d.label}>
                  <rect
                    class="chart-bar__bar"
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={innerHeight - barY}
                    fill={d.color ?? categoryColor(i)}
                  />
                  <text
                    class="chart-bar__axis-label"
                    x={barX + barWidth / 2}
                    y={innerHeight + 16}
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

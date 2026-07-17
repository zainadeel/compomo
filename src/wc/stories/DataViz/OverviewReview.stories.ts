import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-card-shell-data-viz.js';
import '../../../../dist/components/ds-card-data-viz-donut.js';
import '../../../../dist/components/ds-chart-donut.js';
import '../../../../dist/components/ds-chart-line.js';
import '../../../../dist/components/ds-chart-bar.js';
import '../../../../dist/components/ds-chart-legend.js';
import type { ChartDatum, ChartSeries, ChartLegendItem } from '../../utils/chart-types';

/**
 * Mock datasets modeled on real Motive Webapp Overview screens, so review happens
 * against realistic shapes rather than generic placeholder numbers. Scaffold only —
 * visual design (card layout, chart styling, legend treatment) is intentionally undecided.
 *
 * Donut uses `ds-card-data-viz-donut`. Bar/line compose `ds-card-shell-data-viz`
 * directly until their dedicated data-viz card compositions land.
 */

const AVAILABILITY_STATUS: ChartDatum[] = [
  { label: 'In Service', value: 100 },
  { label: 'In Shop', value: 50 },
  { label: 'Missing', value: 25 },
  { label: 'Out of Service', value: 25 },
];

const FUEL_TREND_CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const FUEL_TREND_SERIES: ChartSeries[] = [
  { name: 'Fuel score', data: [72, 75, 74, 79, 81, 84] },
  { name: 'Idling %', data: [18, 16, 17, 14, 12, 11] },
];
const FUEL_TREND_LEGEND: ChartLegendItem[] = FUEL_TREND_SERIES.map(s => ({ label: s.name, color: s.color }));

const SAFETY_RISK_FACTORS: ChartDatum[] = [
  { label: 'Hard brake', value: 14 },
  { label: 'Speeding', value: 22 },
  { label: 'Distraction', value: 9 },
  { label: 'Seatbelt', value: 4 },
  { label: 'Following dist.', value: 11 },
];

const meta: Meta = {
  title: 'Data Viz/Overview Review',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Review: Story = {
  render: () => html`
    <div
      style="display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:var(--dimension-space-300);padding:var(--dimension-space-400);background:var(--color-background-secondary);font-family:var(--typography-font-family, system-ui)"
    >
      <ds-card-data-viz-donut heading="Availability status" card-width="lg">
        <ds-chart-donut
          slot="chart"
          ${ref(el => {
            if (!el) return;
            (el as any).data = AVAILABILITY_STATUS;
          })}
          center-caption="Total vehicles"
        ></ds-chart-donut>
        <ds-chart-legend
          slot="legend"
          ${ref(el => {
            if (!el) return;
            (el as any).items = AVAILABILITY_STATUS;
          })}
        ></ds-chart-legend>
      </ds-card-data-viz-donut>

      <ds-card-shell-data-viz heading="Fuel trend" card-width="lg">
        <div style="display:flex;flex-direction:column;gap:var(--dimension-space-200);padding:var(--dimension-space-400);box-sizing:border-box;flex:1;min-height:0">
          <ds-chart-line
            ${ref(el => {
              if (!el) return;
              (el as any).series = FUEL_TREND_SERIES;
              (el as any).categories = FUEL_TREND_CATEGORIES;
            })}
            width="380"
            height="200"
          ></ds-chart-line>
          <ds-chart-legend
            ${ref(el => {
              if (!el) return;
              (el as any).items = FUEL_TREND_LEGEND;
            })}
            direction="horizontal"
          ></ds-chart-legend>
        </div>
      </ds-card-shell-data-viz>

      <ds-card-shell-data-viz heading="Safety risk factors" card-width="lg">
        <div style="padding:var(--dimension-space-400);box-sizing:border-box;flex:1;min-height:0">
          <ds-chart-bar
            ${ref(el => {
              if (!el) return;
              (el as any).data = SAFETY_RISK_FACTORS;
            })}
            width="380"
            height="200"
          ></ds-chart-bar>
        </div>
      </ds-card-shell-data-viz>
    </div>
  `,
};

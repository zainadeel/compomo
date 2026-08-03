import type { Meta, StoryObj } from '@storybook/web-components';
import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-card-chart.js';
import '../../../../dist/components/ds-chart.js';
import '../../../../dist/components/ds-chart-legend.js';
import { arcMark, barY, defineChart, dot, lineY, pieLayout, polar } from '../../utils/chart-grammar';
import type { ChartLegendItem } from '../../utils/chart-types';

const AVAILABILITY_STATUS: ChartLegendItem[] = [
  { label: 'In Service', value: 100 },
  { label: 'In Shop', value: 50 },
  { label: 'Missing', value: 25 },
  { label: 'Out of Service', value: 25 },
];
const availabilitySlices = pieLayout(AVAILABILITY_STATUS, { value: row => row.value ?? 0, key: 'label', label: 'label' });
const AVAILABILITY_DEFINITION = defineChart({
  marks: [polar({ innerRadius: 0.75, grid: 'none', marks: [arcMark(availabilitySlices, { id: 'availability', key: 'key', theta1: 'theta1', theta2: 'theta2', z: 'label', value: 'value', label: 'label' })], center: { value: '200', caption: 'Total vehicles' } })],
  focus: 'nearest',
  tooltip: true,
});

const FUEL_TREND = [
  { id: 'fuel-jan', month: 'Jan', series: 'Fuel score', value: 72 },
  { id: 'fuel-feb', month: 'Feb', series: 'Fuel score', value: 75 },
  { id: 'fuel-mar', month: 'Mar', series: 'Fuel score', value: 74 },
  { id: 'fuel-apr', month: 'Apr', series: 'Fuel score', value: 79 },
  { id: 'idle-jan', month: 'Jan', series: 'Idling %', value: 18 },
  { id: 'idle-feb', month: 'Feb', series: 'Idling %', value: 16 },
  { id: 'idle-mar', month: 'Mar', series: 'Idling %', value: 17 },
  { id: 'idle-apr', month: 'Apr', series: 'Idling %', value: 14 },
];
const FUEL_TREND_DEFINITION = defineChart({
  marks: [
    lineY(FUEL_TREND, { id: 'fuel-trend', key: 'id', x: 'month', y: 'value', z: 'series', interactive: false }),
    dot(FUEL_TREND, { id: 'fuel-points', key: 'id', x: 'month', y: 'value', z: 'series' }),
  ],
  x: { scale: scalePoint },
  y: { scale: scaleLinear, nice: true, grid: true },
  focus: 'group-x',
  tooltip: true,
});
const FUEL_TREND_LEGEND: ChartLegendItem[] = [
  { label: 'Fuel score', color: 'var(--color-data-category-1)' },
  { label: 'Idling %', color: 'var(--color-data-category-2)' },
];

const SAFETY_RISK_FACTORS = [
  { id: 'brake', label: 'Hard brake', value: 14 },
  { id: 'speeding', label: 'Speeding', value: 22 },
  { id: 'distraction', label: 'Distraction', value: 9 },
  { id: 'seatbelt', label: 'Seatbelt', value: 4 },
  { id: 'following', label: 'Following dist.', value: 11 },
];
const SAFETY_DEFINITION = defineChart({
  marks: [barY(SAFETY_RISK_FACTORS, { id: 'risk', key: 'id', x: 'label', y: 'value' })],
  x: { scale: scaleBand },
  y: { scale: scaleLinear, nice: true, grid: true },
  tooltip: true,
});

const meta: Meta = {
  title: 'Charts/Overview Review',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const assign = (property: 'items' | 'definition', value: unknown) =>
  ref((element: Element | undefined) => {
    if (element) (element as unknown as Record<string, unknown>)[property] = value;
  });

export const Review: Story = {
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(360px, 1fr));gap:var(--dimension-space-300);padding:var(--dimension-space-400);background:var(--color-background-secondary);font-family:var(--typography-font-family, system-ui)">
      <ds-card-chart heading="Availability status" card-width="lg" variant="chart">
        <ds-chart slot="chart" ${assign('definition', AVAILABILITY_DEFINITION)} label="Availability status" height="240"></ds-chart>
        <ds-chart-legend slot="legend" ${assign('items', AVAILABILITY_STATUS)}></ds-chart-legend>
      </ds-card-chart>

      <ds-card-chart heading="Fuel trend" card-width="lg" variant="chart">
        <ds-chart slot="chart" ${assign('definition', FUEL_TREND_DEFINITION)} label="Fuel score and idling trend" height="240"></ds-chart>
        <ds-chart-legend slot="legend" ${assign('items', FUEL_TREND_LEGEND)} direction="horizontal"></ds-chart-legend>
      </ds-card-chart>

      <ds-card-chart heading="Safety risk factors" card-width="lg" variant="chart">
        <ds-chart slot="chart" ${assign('definition', SAFETY_DEFINITION)} label="Safety risk factors" height="200"></ds-chart>
      </ds-card-chart>
    </div>
  `,
};

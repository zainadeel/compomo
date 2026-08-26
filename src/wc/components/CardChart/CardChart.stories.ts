import type { Meta, StoryObj } from '@storybook/web-components';
import { scaleLinear, scalePoint } from 'd3-scale';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-card-chart.js';
import '../../../../dist/components/ds-chart.js';
import '../../../../dist/components/ds-chart-legend.js';
import { arcMark, defineChart, dot, lineY, pieLayout, polar } from '../../utils/chart-grammar';
import type { ChartLegendItem } from '../../utils/chart-types';

const WIDTHS = ['sm', 'md', 'lg'] as const;
const DONUT_DATA: ChartLegendItem[] = [
  { label: 'Online', value: 412 },
  { label: 'Offline', value: 31 },
  { label: 'Needs attention', value: 12 },
];
const DONUT_SLICES = pieLayout(DONUT_DATA, {
  value: row => row.value ?? 0,
  key: 'label',
  label: 'label',
});
const DONUT_DEFINITION = defineChart({
  marks: [
    polar({
      innerRadius: 0.75,
      grid: 'none',
      marks: [
        arcMark(DONUT_SLICES, {
          id: 'status',
          key: 'key',
          theta1: 'theta1',
          theta2: 'theta2',
          z: 'label',
          value: 'value',
          label: 'label',
        }),
      ],
      center: {
        value: String(DONUT_DATA.reduce((total, row) => total + (row.value ?? 0), 0)),
        caption: 'Total devices',
      },
    }),
  ],
  focus: 'nearest',
  tooltip: true,
});
const CHART_ROWS = [
  { id: 'fuel-jan', month: 'Jan', series: 'Fuel score', value: 72 },
  { id: 'fuel-feb', month: 'Feb', series: 'Fuel score', value: 75 },
  { id: 'fuel-mar', month: 'Mar', series: 'Fuel score', value: 74 },
  { id: 'fuel-apr', month: 'Apr', series: 'Fuel score', value: 79 },
  { id: 'idle-jan', month: 'Jan', series: 'Idling %', value: 18 },
  { id: 'idle-feb', month: 'Feb', series: 'Idling %', value: 16 },
  { id: 'idle-mar', month: 'Mar', series: 'Idling %', value: 17 },
  { id: 'idle-apr', month: 'Apr', series: 'Idling %', value: 14 },
];
const CHART_DEFINITION = defineChart({
  marks: [
    lineY(CHART_ROWS, {
      id: 'trend',
      key: 'id',
      x: 'month',
      y: 'value',
      z: 'series',
      interactive: false,
    }),
    dot(CHART_ROWS, { id: 'points', key: 'id', x: 'month', y: 'value', z: 'series' }),
  ],
  x: { scale: scalePoint },
  y: { scale: scaleLinear, nice: true, grid: true },
  focus: 'group-x',
  tooltip: true,
});
const LEGEND_ITEMS: ChartLegendItem[] = [
  { label: 'Fuel score', color: 'var(--color-data-category-1)' },
  { label: 'Idling %', color: 'var(--color-data-category-2)' },
];

const meta: Meta = {
  title: 'Cards/CardChart',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: [...WIDTHS] },
  },
  args: { heading: 'Fleet performance', cardWidth: 'md' },
};

export default meta;
type Story = StoryObj;

export const Donut: Story = {
  render: args => html`
    <ds-card-chart
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      variant="chart"
      show-filter
    >
      <ds-chart
        slot="chart"
        label="Device status distribution"
        ${ref(element => {
          if (element)
            (element as HTMLElement & { definition: unknown }).definition = DONUT_DEFINITION;
        })}
      ></ds-chart>
      <ds-chart-legend
        slot="legend"
        ${ref(element => {
          if (element) (element as HTMLElement & { items: ChartLegendItem[] }).items = DONUT_DATA;
        })}
      ></ds-chart-legend>
    </ds-card-chart>
  `,
};

export const Chart: Story = {
  render: args => html`
    <ds-card-chart
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      variant="chart"
      show-filter
    >
      <ds-chart
        slot="chart"
        label="Fuel score and idling by month"
        ${ref(element => {
          if (element)
            (element as HTMLElement & { definition: unknown }).definition = CHART_DEFINITION;
        })}
      ></ds-chart>
      <ds-chart-legend
        slot="legend"
        direction="horizontal"
        ${ref(element => {
          if (element) (element as HTMLElement & { items: ChartLegendItem[] }).items = LEGEND_ITEMS;
        })}
      ></ds-chart-legend>
    </ds-card-chart>
  `,
};

export const Custom: Story = {
  render: args => html`
    <ds-card-chart heading=${args['heading']} card-width=${args['cardWidth']}>
      <ds-button-unfilled
        slot="actions"
        variant="icon"
        icon="Filters"
        aria-label="Filter data"
      ></ds-button-unfilled>
      <div style="padding:var(--dimension-space-400);box-sizing:border-box;">
        <ds-text variant="text-body-medium" color="secondary"
          >Application-owned chart content.</ds-text
        >
      </div>
    </ds-card-chart>
  `,
};

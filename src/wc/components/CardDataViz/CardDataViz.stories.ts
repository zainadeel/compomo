import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-card-data-viz.js';
import '../../../../dist/components/ds-chart-bar.js';
import '../../../../dist/components/ds-chart-donut.js';
import '../../../../dist/components/ds-chart-line.js';
import '../../../../dist/components/ds-chart-legend.js';
import type {
  ChartDatum,
  ChartLegendItem,
  ChartSeries,
} from '../../utils/chart-types';

const WIDTHS = ['sm', 'md', 'lg'] as const;
const DONUT_DATA: ChartDatum[] = [
  { label: 'Online', value: 412 },
  { label: 'Offline', value: 31 },
  { label: 'Needs attention', value: 12 },
];
const CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const SERIES: ChartSeries[] = [
  { name: 'Fuel score', data: [72, 75, 74, 79, 81, 84] },
  { name: 'Idling %', data: [18, 16, 17, 14, 12, 11] },
];
const LEGEND_ITEMS: ChartLegendItem[] = SERIES.map(series => ({
  label: series.name,
  color: series.color,
}));

const meta: Meta = {
  title: 'Data Viz/CardDataViz',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: [...WIDTHS] },
  },
  args: {
    heading: 'Data visualization',
    cardWidth: 'md',
  },
};

export default meta;
type Story = StoryObj;

export const Donut: Story = {
  render: args => html`
    <ds-card-data-viz
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      variant="donut"
      show-filter
    >
      <ds-chart-donut
        slot="chart"
        ${ref(el => {
          if (!el) return;
          (el as any).data = DONUT_DATA;
        })}
        center-caption="Total devices"
      ></ds-chart-donut>
      <ds-chart-legend
        slot="legend"
        ${ref(el => {
          if (!el) return;
          (el as any).items = DONUT_DATA;
        })}
      ></ds-chart-legend>
    </ds-card-data-viz>
  `,
};

export const Line: Story = {
  render: args => html`
    <ds-card-data-viz
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      variant="line"
      show-filter
    >
      <ds-chart-line
        slot="chart"
        ${ref(el => {
          if (!el) return;
          (el as any).series = SERIES;
          (el as any).categories = CATEGORIES;
        })}
        width="480"
        height="240"
      ></ds-chart-line>
      <ds-chart-legend
        slot="legend"
        ${ref(el => {
          if (!el) return;
          (el as any).items = LEGEND_ITEMS;
        })}
        direction="horizontal"
      ></ds-chart-legend>
    </ds-card-data-viz>
  `,
};

export const Bar: Story = {
  render: args => html`
    <ds-card-data-viz
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      variant="bar"
      show-filter
    >
      <ds-chart-bar
        slot="chart"
        ${ref(el => {
          if (!el) return;
          (el as any).data = CATEGORIES.map((label, index) => ({
            label,
            value: SERIES[0].data[index],
            color: 'var(--color-data-category-1)',
          }));
        })}
        width="480"
        height="240"
      ></ds-chart-bar>
    </ds-card-data-viz>
  `,
};

export const Custom: Story = {
  render: args => html`
    <ds-card-data-viz
      heading=${args['heading']}
      card-width=${args['cardWidth']}
    >
      <ds-button-unfilled
        slot="actions"
        variant="icon"
        icon="Filters"
        aria-label="Filter data"
      ></ds-button-unfilled>
      <div style="padding:var(--dimension-space-400);box-sizing:border-box;">
        <ds-text variant="text-body-medium" color="secondary">
          Application-owned data visualization content.
        </ds-text>
      </div>
    </ds-card-data-viz>
  `,
};

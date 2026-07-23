import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-card-data-viz-bar.js';
import '../../../../dist/components/ds-chart-bar.js';
import '../../../../dist/components/ds-chart-bar-stacked.js';
import '../../../../dist/components/ds-chart-legend.js';
import type { ChartDatum, ChartLegendItem, ChartSeries } from '../../utils/chart-types';

const DAILY_ACTIVITY_COLOR = 'var(--color-data-category-1)';
const DAILY_ACTIVITY: ChartDatum[] = [
  { label: 'Mon', value: 118, color: DAILY_ACTIVITY_COLOR },
  { label: 'Tue', value: 136, color: DAILY_ACTIVITY_COLOR },
  { label: 'Wed', value: 124, color: DAILY_ACTIVITY_COLOR },
  { label: 'Thu', value: 151, color: DAILY_ACTIVITY_COLOR },
  { label: 'Fri', value: 143, color: DAILY_ACTIVITY_COLOR },
  { label: 'Sat', value: 82, color: DAILY_ACTIVITY_COLOR },
  { label: 'Sun', value: 67, color: DAILY_ACTIVITY_COLOR },
];
const CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const STACKED_SERIES: ChartSeries[] = [
  {
    name: 'Driving',
    data: [420, 460, 445, 510, 535, 550],
    color: 'var(--color-data-category-1)',
  },
  {
    name: 'Idling',
    data: [95, 82, 88, 76, 70, 65],
    color: 'var(--color-data-category-2)',
  },
  {
    name: 'Stopped',
    data: [130, 118, 125, 105, 98, 92],
    color: 'var(--color-data-category-3)',
  },
];
const LEGEND_ITEMS: ChartLegendItem[] = STACKED_SERIES.map(series => ({
  label: series.name,
  color: series.color,
}));
const WIDTHS = ['sm', 'md', 'lg'] as const;

const meta: Meta = {
  title: 'Data Viz/CardDataVizBar',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: [...WIDTHS] },
  },
  args: {
    heading: 'Daily activity',
    cardWidth: 'md',
  },
};

export default meta;
type Story = StoryObj;

const renderRegularCard = (heading: string, cardWidth: string) => html`
  <ds-card-data-viz-bar heading=${heading} card-width=${cardWidth}>
    <ds-chart-bar
      slot="chart"
      ${ref(el => {
        if (!el) return;
        (el as any).data = DAILY_ACTIVITY;
      })}
      width="560"
      height="240"
    ></ds-chart-bar>
  </ds-card-data-viz-bar>
`;

const renderStackedCard = (
  heading: string,
  cardWidth: string,
  variant: 'stacked' | 'percentage'
) => html`
  <ds-card-data-viz-bar heading=${heading} card-width=${cardWidth}>
    <ds-chart-bar-stacked
      slot="chart"
      ${ref(el => {
        if (!el) return;
        (el as any).series = STACKED_SERIES;
        (el as any).categories = CATEGORIES;
      })}
      variant=${variant}
      width="560"
      height="240"
    ></ds-chart-bar-stacked>
    <ds-chart-legend
      slot="legend"
      ${ref(el => {
        if (!el) return;
        (el as any).items = LEGEND_ITEMS;
      })}
      direction="horizontal"
    ></ds-chart-legend>
  </ds-card-data-viz-bar>
`;

export const Regular: Story = {
  render: args => renderRegularCard(args['heading'], args['cardWidth']),
};

export const Stacked: Story = {
  render: args => renderStackedCard(args['heading'], args['cardWidth'], 'stacked'),
};

export const Percentage: Story = {
  render: args => renderStackedCard(args['heading'], args['cardWidth'], 'percentage'),
};

export const Widths: Story = {
  parameters: { controls: { exclude: ['cardWidth'] } },
  render: args => html`
    <div
      style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--dimension-space-300);"
    >
      ${WIDTHS.map(width => renderRegularCard(`${args['heading']} (${width})`, width))}
    </div>
  `,
};

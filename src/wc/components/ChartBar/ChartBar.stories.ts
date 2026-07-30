import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-chart-bar.js';
import '../../../../dist/components/ds-chart-legend.js';
import type {
  ChartDatum,
  ChartLegendItem,
  ChartSeries,
} from '../../utils/chart-types';

const MOCK_DATA: ChartDatum[] = [
  { label: 'Hard brake', value: 14 },
  { label: 'Speeding', value: 22 },
  { label: 'Distraction', value: 9 },
  { label: 'Seatbelt', value: 4 },
];

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
const STACK_CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const STACK_SERIES: ChartSeries[] = [
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
const STACK_LEGEND: ChartLegendItem[] = STACK_SERIES.map(series => ({
  label: series.name,
  color: series.color,
}));

const meta: Meta = {
  title: 'Data Viz/Chart Bar',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: () => html`
    <ds-chart-bar
      ${ref(el => {
        if (!el) return;
        (el as any).data = MOCK_DATA;
      })}
      width="480"
      height="240"
    ></ds-chart-bar>
  `,
};

/** Ordered time buckets use equal band spacing; labels are preformatted by the application. */
export const TimeBuckets: Story = {
  render: () => html`
    <ds-chart-bar
      ${ref(el => {
        if (!el) return;
        (el as any).data = DAILY_ACTIVITY;
      })}
      width="560"
      height="240"
    ></ds-chart-bar>
  `,
};

const renderStackedChart = (variant: 'stacked' | 'percentage') => html`
  <div style="display:flex;flex-direction:column;gap:var(--dimension-space-200);width:min(560px, 100%);">
    <ds-chart-bar
      ${ref(el => {
        if (!el) return;
        (el as any).series = STACK_SERIES;
        (el as any).categories = STACK_CATEGORIES;
      })}
      variant=${variant}
      width="560"
      height="240"
    ></ds-chart-bar>
    <ds-chart-legend
      ${ref(el => {
        if (!el) return;
        (el as any).items = STACK_LEGEND;
      })}
      direction="horizontal"
      .highlightOnHover=${false}
    ></ds-chart-legend>
  </div>
`;

export const Stacked: Story = {
  render: () => renderStackedChart('stacked'),
};

export const PercentageTimeSeries: Story = {
  name: 'Percentage time series',
  render: () => renderStackedChart('percentage'),
};

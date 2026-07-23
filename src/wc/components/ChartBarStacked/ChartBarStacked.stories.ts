import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-chart-bar-stacked.js';
import '../../../../dist/components/ds-chart-legend.js';
import type { ChartLegendItem, ChartSeries } from '../../utils/chart-types';

const CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const SERIES: ChartSeries[] = [
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
const LEGEND_ITEMS: ChartLegendItem[] = SERIES.map(series => ({
  label: series.name,
  color: series.color,
}));

const meta: Meta = {
  title: 'Data Viz/Chart Bar Stacked',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const renderChart = (variant: 'stacked' | 'percentage') => html`
  <div style="display:flex;flex-direction:column;gap:var(--dimension-space-200);width:min(560px, 100%);">
    <ds-chart-bar-stacked
      ${ref(el => {
        if (!el) return;
        (el as any).series = SERIES;
        (el as any).categories = CATEGORIES;
      })}
      variant=${variant}
      width="560"
      height="240"
    ></ds-chart-bar-stacked>
    <ds-chart-legend
      ${ref(el => {
        if (!el) return;
        (el as any).items = LEGEND_ITEMS;
      })}
      direction="horizontal"
      .highlightOnHover=${false}
    ></ds-chart-legend>
  </div>
`;

export const Stacked: Story = {
  render: () => renderChart('stacked'),
};

export const PercentageTimeSeries: Story = {
  name: 'Percentage time series',
  render: () => renderChart('percentage'),
};

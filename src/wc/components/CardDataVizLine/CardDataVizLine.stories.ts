import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-card-data-viz-line.js';
import '../../../../dist/components/ds-chart-line.js';
import '../../../../dist/components/ds-chart-legend.js';
import type { ChartLegendItem, ChartSeries } from '../../utils/chart-types';

const CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const SERIES: ChartSeries[] = [
  { name: 'Fuel score', data: [72, 75, 74, 79, 81, 84] },
  { name: 'Idling %', data: [18, 16, 17, 14, 12, 11] },
];
const LEGEND_ITEMS: ChartLegendItem[] = SERIES.map(series => ({
  label: series.name,
  color: series.color,
}));
const WIDTHS = ['sm', 'md', 'lg'] as const;

const meta: Meta = {
  title: 'Data Viz/CardDataVizLine',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: [...WIDTHS] },
  },
  args: {
    heading: 'Fuel trend',
    cardWidth: 'md',
  },
};

export default meta;
type Story = StoryObj;

const renderCard = (heading: string, cardWidth: string) => html`
  <ds-card-data-viz-line heading=${heading} card-width=${cardWidth}>
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
  </ds-card-data-viz-line>
`;

export const View: Story = {
  render: args => renderCard(args['heading'], args['cardWidth']),
};

export const Widths: Story = {
  parameters: { controls: { exclude: ['cardWidth'] } },
  render: args => html`
    <div
      style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--dimension-space-300);"
    >
      ${WIDTHS.map(width => renderCard(`${args['heading']} (${width})`, width))}
    </div>
  `,
};

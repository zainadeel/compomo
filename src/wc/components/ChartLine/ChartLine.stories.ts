import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-chart-line.js';
import '../../../../dist/components/ds-chart-legend.js';
import type { ChartSeries, ChartLegendItem } from '../../utils/chart-types';

const CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const MOCK_SERIES: ChartSeries[] = [
  { name: 'Fuel score', data: [72, 75, 74, 79, 81, 84] },
  { name: 'Idling %', data: [18, 16, 17, 14, 12, 11] },
];

const meta: Meta = {
  title: 'Data Viz/Chart Line',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: () => html`
    <ds-chart-line
      ${ref(el => {
        if (!el) return;
        (el as any).series = MOCK_SERIES;
        (el as any).categories = CATEGORIES;
      })}
      width="480"
      height="240"
    ></ds-chart-line>
  `,
};

export const WithLegend: Story = {
  render: () => {
    const legendItems: ChartLegendItem[] = MOCK_SERIES.map(s => ({ label: s.name, color: s.color }));
    return html`
      <div style="display:flex;flex-direction:column;gap:var(--dimension-space-200)">
        <ds-chart-line
          ${ref(el => {
            if (!el) return;
            (el as any).series = MOCK_SERIES;
            (el as any).categories = CATEGORIES;
          })}
          width="480"
          height="240"
        ></ds-chart-line>
        <ds-chart-legend
          ${ref(el => {
            if (!el) return;
            (el as any).items = legendItems;
          })}
          direction="horizontal"
          .highlightOnHover=${false}
        ></ds-chart-legend>
      </div>
    `;
  },
};

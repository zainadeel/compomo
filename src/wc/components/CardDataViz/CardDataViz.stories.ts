import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-card-data-viz.js';
import '../../../../dist/components/ds-chart-donut.js';
import '../../../../dist/components/ds-chart-legend.js';
import type { ChartDatum } from '../../utils/chart-types';

const MOCK_DATA: ChartDatum[] = [
  { label: 'Online', value: 412 },
  { label: 'Offline', value: 31 },
  { label: 'Needs attention', value: 12 },
];

const WIDTHS = ['sm', 'md', 'lg'] as const;

const meta: Meta = {
  title: 'Layout/CardDataViz',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: [...WIDTHS] },
  },
  args: {
    heading: 'Device status',
    cardWidth: 'md',
  },
};

export default meta;
type Story = StoryObj;

const renderCard = (heading: string, cardWidth: string) => html`
  <ds-card-data-viz heading=${heading} card-width=${cardWidth}>
    <ds-chart-donut
      slot="chart"
      ${ref(el => {
        if (!el) return;
        (el as any).data = MOCK_DATA;
      })}
      center-caption="Total devices"
    ></ds-chart-donut>
    <ds-chart-legend
      slot="legend"
      ${ref(el => {
        if (!el) return;
        (el as any).items = MOCK_DATA;
      })}
    ></ds-chart-legend>
  </ds-card-data-viz>
`;

export const View: Story = {
  render: args => renderCard(args['heading'], args['cardWidth']),
};

/** Side-by-side sm / md / lg — check header, chart, and legend hold at each width. */
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

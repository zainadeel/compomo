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

const meta: Meta = {
  title: 'Layout/CardDataViz',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
  },
  args: {
    heading: 'Device status',
    cardWidth: 'md',
  },
};

export default meta;
type Story = StoryObj;

export const View: Story = {
  render: args => html`
    <ds-card-data-viz
      heading=${args['heading']}
      card-width=${args['cardWidth']}
    >
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
  `,
};

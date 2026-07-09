import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-chart-bar.js';
import type { ChartDatum } from '../../utils/chart-types';

const MOCK_DATA: ChartDatum[] = [
  { label: 'Hard brake', value: 14 },
  { label: 'Speeding', value: 22 },
  { label: 'Distraction', value: 9 },
  { label: 'Seatbelt', value: 4 },
];

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

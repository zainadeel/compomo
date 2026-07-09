import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-tooltip-data-viz.js';

const meta: Meta = {
  title: 'Data Viz/Tooltip Data Viz',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    label: { control: 'text' },
    x: { control: 'number' },
    y: { control: 'number' },
    delay: {
      control: 'text',
      description: 'Show delay after mount (ms number or TokoMo time). Default instant = 0ms.',
    },
  },
  args: {
    value: '185',
    label: 'In Service',
    x: 140,
    y: 100,
    delay: 0,
  },
};
export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="position:relative;width:280px;height:200px;background:var(--color-background-secondary);border-radius:var(--dimension-radius-100)">
      <ds-tooltip-data-viz
        value=${args['value']}
        label=${args['label']}
        x=${args['x']}
        y=${args['y']}
        delay=${args['delay']}
      ></ds-tooltip-data-viz>
    </div>
  `,
};

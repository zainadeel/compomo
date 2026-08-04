import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-tooltip-chart.js';

const meta: Meta = {
  title: 'Charts/Tooltip Chart',
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
      <ds-tooltip-chart
        value=${args['value']}
        label=${args['label']}
        x=${args['x']}
        y=${args['y']}
        delay=${args['delay']}
      ></ds-tooltip-chart>
    </div>
  `,
};

export const GroupedRows: Story = {
  render: () => html`
    <div style="position:relative;width:320px;height:220px;background:var(--color-background-secondary);border-radius:var(--dimension-radius-100)">
      <ds-tooltip-chart
        heading="March"
        x="140"
        y="80"
        ${ref(element => {
          if (!element) return;
          (element as HTMLElement & { items: unknown[] }).items = [
            { label: 'Driving', value: '4:45 min', color: 'var(--color-data-category-1)' },
            { label: 'Idling', value: '88 min', color: 'var(--color-data-category-2)' },
          ];
        })}
      ></ds-tooltip-chart>
    </div>
  `,
};

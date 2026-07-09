import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-slider.js';

const meta: Meta = {
  title: 'Form/Slider',
  tags: ['autodocs'],
  argTypes: {
    value:    { control: 'number' },
    min:      { control: 'number' },
    max:      { control: 'number' },
    step:     { control: 'number' },
    label:    { control: 'text' },
    isInactive: { control: 'boolean' },
  },
  args: { value: 40, min: 0, max: 100, step: 1, label: 'Volume', isInactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width: 320px">
      <ds-slider
        value=${args['value'] ?? 40}
        min=${args['min'] ?? 0}
        max=${args['max'] ?? 100}
        step=${args['step'] ?? 1}
        label=${args['label'] ?? 'Volume'}
        ?is-inactive=${args['isInactive']}
      ></ds-slider>
    </div>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px; width: 320px">
      <ds-slider value="0"  min="0" max="100" label="At minimum"></ds-slider>
      <ds-slider value="40" min="0" max="100" label="Mid value"></ds-slider>
      <ds-slider value="100" min="0" max="100" label="At maximum"></ds-slider>
      <ds-slider value="5" min="0" max="10" step="1" label="Custom range (0–10)"></ds-slider>
      <ds-slider value="50" min="0" max="100" is-inactive label="Inactive"></ds-slider>
    </div>
  `,
};

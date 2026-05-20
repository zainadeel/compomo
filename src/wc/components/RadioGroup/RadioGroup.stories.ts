import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-radio-group.js';

const defaultOptions = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
];

const meta: Meta = {
  title: 'Form/RadioGroup',
  tags: ['autodocs'],
  argTypes: {
    value:     { control: 'text' },
    direction: { control: 'radio', options: ['vertical', 'horizontal'] },
    inactive:  { control: 'boolean' },
  },
  args: { value: 'a', direction: 'vertical', inactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-radio-group
      .options=${defaultOptions}
      value=${args['value'] ?? 'a'}
      direction=${args['direction'] ?? 'vertical'}
      ?inactive=${args['inactive']}
      aria-label="Playground radio group"
    ></ds-radio-group>
  `,
};

export const Vertical: Story = {
  render: () => html`
    <ds-radio-group
      .options=${defaultOptions}
      value="b"
      aria-label="Vertical example"
    ></ds-radio-group>
  `,
};

export const Horizontal: Story = {
  render: () => html`
    <ds-radio-group
      .options=${defaultOptions}
      value="a"
      direction="horizontal"
      aria-label="Horizontal example"
    ></ds-radio-group>
  `,
};

export const WithInactiveItem: Story = {
  render: () => html`
    <ds-radio-group
      .options=${[
        { label: 'Option A', value: 'a' },
        { label: 'Option B (inactive)', value: 'b', inactive: true },
        { label: 'Option C', value: 'c' },
      ]}
      value="a"
      aria-label="With inactive item"
    ></ds-radio-group>
  `,
};

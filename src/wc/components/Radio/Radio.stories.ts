import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-radio.js';

const defaultOptions = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
];

const meta: Meta = {
  title: 'Form/Radio',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    size: { control: 'radio', options: ['md', 'sm', 'xs'] },
    direction: { control: 'radio', options: ['vertical', 'horizontal'] },
    isInactive: { control: 'boolean' },
  },
  args: { value: 'a', size: 'md', direction: 'vertical', isInactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-radio
      .options=${defaultOptions}
      value=${args['value'] ?? 'a'}
      size=${args['size'] ?? 'md'}
      direction=${args['direction'] ?? 'vertical'}
      ?is-inactive=${args['isInactive']}
      aria-label="Playground radio"
    ></ds-radio>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: grid; gap: var(--dimension-space-200);">
      ${(['md', 'sm', 'xs'] as const).map(size => html`
        <ds-radio
          .options=${[
            { label: `${size.toUpperCase()} selected`, value: 'selected' },
            { label: `${size.toUpperCase()} unselected`, value: 'unselected' },
          ]}
          value="selected"
          size=${size}
          aria-label=${`${size} radio size`}
        ></ds-radio>
      `)}
    </div>
  `,
};

export const Horizontal: Story = {
  render: () => html`
    <ds-radio
      .options=${defaultOptions}
      value="a"
      direction="horizontal"
      aria-label="Horizontal example"
    ></ds-radio>
  `,
};

export const WithInactiveItem: Story = {
  render: () => html`
    <ds-radio
      .options=${[
        { label: 'Option A', value: 'a' },
        { label: 'Option B (inactive)', value: 'b', isInactive: true },
        { label: 'Option C', value: 'c' },
      ]}
      value="a"
      aria-label="With inactive item"
    ></ds-radio>
  `,
};

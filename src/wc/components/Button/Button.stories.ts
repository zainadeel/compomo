import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-button.js';
import '../../../../dist/components/ds-loader.js';

const meta: Meta = {
  title: 'Actions/Button',
  tags: ['autodocs'],
  argTypes: {
    variant:    { control: 'radio', options: ['primary', 'secondary'] },
    intent:     { control: 'select', options: ['none', 'neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'] },
    size:       { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    contrast:   { control: 'select', options: ['strong', 'bold', 'medium', 'faint'] },
    elevation:  { control: 'select', options: ['none', 'flat', 'elevated', 'floating'] },
    label:      { control: 'text' },
    rounded:    { control: 'boolean' },
    fullWidth:  { control: 'boolean' },
    dropdown:   { control: 'boolean' },
    loading:    { control: 'boolean' },
    inactive:   { control: 'boolean' },
  },
  args: { variant: 'primary', intent: 'brand', size: 'md', label: 'Button', rounded: false, fullWidth: false, dropdown: false, loading: false, inactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-button
      variant=${args['variant'] ?? 'primary'}
      intent=${args['intent'] ?? 'brand'}
      size=${args['size'] ?? 'md'}
      contrast=${args['contrast'] ?? 'bold'}
      label=${args['label'] ?? 'Button'}
      ?rounded=${args['rounded']}
      ?fullWidth=${args['fullWidth']}
      ?dropdown=${args['dropdown']}
      ?loading=${args['loading']}
      ?inactive=${args['inactive']}
    ></ds-button>
  `,
};

export const Intents: Story = {
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; gap: 8px">
      <ds-button intent="brand"    label="Brand"></ds-button>
      <ds-button intent="neutral"  label="Neutral"></ds-button>
      <ds-button intent="positive" label="Positive"></ds-button>
      <ds-button intent="negative" label="Negative"></ds-button>
      <ds-button intent="warning"  label="Warning"></ds-button>
      <ds-button intent="caution"  label="Caution"></ds-button>
      <ds-button intent="ai"       label="AI"></ds-button>
      <ds-button intent="none"     label="None"></ds-button>
    </div>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px">
      <div style="display: flex; gap: 8px; align-items: center">
        <ds-button variant="primary" intent="brand" label="Primary"></ds-button>
        <ds-button variant="secondary" intent="brand" label="Secondary ghost"></ds-button>
        <ds-button variant="secondary" elevation="flat" intent="brand" label="Secondary flat"></ds-button>
        <ds-button variant="secondary" elevation="elevated" label="Secondary elevated"></ds-button>
      </div>
      <div style="display: flex; gap: 8px; align-items: center">
        <ds-button size="xs" label="XS"></ds-button>
        <ds-button size="sm" label="SM"></ds-button>
        <ds-button size="md" label="MD"></ds-button>
        <ds-button size="lg" label="LG"></ds-button>
      </div>
      <div style="display: flex; gap: 8px; align-items: center">
        <ds-button rounded label="Rounded"></ds-button>
        <ds-button dropdown label="Dropdown"></ds-button>
        <ds-button loading label="Loading"></ds-button>
        <ds-button inactive label="Inactive"></ds-button>
      </div>
    </div>
  `,
};

export const WithIcon: Story = {
  render: () => html`
    <div style="display: flex; gap: 8px; align-items: center">
      <ds-button label="With icon" intent="brand">
        <svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 7v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </ds-button>
      <ds-button intent="brand" aria-label="Icon only">
        <svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </ds-button>
    </div>
  `,
};

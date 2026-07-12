import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-shell-gradient-swatch.js';

const meta: Meta = {
  title: 'Navigation/ShellGradientSwatch',
  tags: ['autodocs'],
  args: { preset: 'cool', selected: false },
  argTypes: {
    preset: { control: 'select', options: ['none', 'cool', 'neutral', 'warm', 'fresh'] },
    selected: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj;

export const Cool: Story = {
  render: args => html`
    <ds-shell-gradient-swatch
      preset=${args['preset']}
      ?selected=${args['selected']}
    ></ds-shell-gradient-swatch>
  `,
};

export const AllPresets: Story = {
  name: 'All presets',
  render: () => html`
    <div
      style="display: flex; align-items: center; gap: var(--dimension-space-100); padding: var(--dimension-space-200); background: var(--color-background-primary); border-radius: var(--dimension-radius-075);"
    >
      <ds-shell-gradient-swatch preset="none"></ds-shell-gradient-swatch>
      <div
        style="align-self: stretch; width: var(--dimension-stroke-width-012); margin: 0 var(--dimension-space-025); background: var(--color-border-tertiary);"
        aria-hidden="true"
      ></div>
      <ds-shell-gradient-swatch preset="cool" selected></ds-shell-gradient-swatch>
      <ds-shell-gradient-swatch preset="neutral"></ds-shell-gradient-swatch>
      <ds-shell-gradient-swatch preset="warm"></ds-shell-gradient-swatch>
      <ds-shell-gradient-swatch preset="fresh"></ds-shell-gradient-swatch>
    </div>
  `,
};

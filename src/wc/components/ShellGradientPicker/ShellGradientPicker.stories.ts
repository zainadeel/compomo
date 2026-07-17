import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-shell-gradient-picker.js';

const meta: Meta = {
  title: 'Compatibility/ShellGradientPicker',
  tags: ['!autodocs', '!dev', '!test'],
};

export default meta;
type Story = StoryObj;

/** Deprecated compatibility coverage. Use the visible SwatchPicker stories. */
export const Compatibility: Story = {
  render: () => html`
    <ds-shell-gradient-picker value="neutral"></ds-shell-gradient-picker>
  `,
};

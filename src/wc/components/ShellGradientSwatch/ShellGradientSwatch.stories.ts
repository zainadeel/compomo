import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-shell-gradient-swatch.js';

const meta: Meta = {
  title: 'Compatibility/ShellGradientSwatch',
  tags: ['!autodocs', '!dev', '!test'],
};

export default meta;
type Story = StoryObj;

/** Deprecated compatibility coverage. SwatchPicker now renders options internally. */
export const Compatibility: Story = {
  render: () => html`
    <ds-shell-gradient-swatch preset="neutral" selected></ds-shell-gradient-swatch>
  `,
};

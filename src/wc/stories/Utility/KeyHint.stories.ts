import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-text.js';
import '../../utils/key-hint.css';

const SIZES = ['md', 'sm', 'xs'] as const;

const meta: Meta = {
  title: 'Utility/KeyHint',
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj;

const keyHint = (label: string, size: (typeof SIZES)[number]) => html`
  <span class=${`key-hint ds-control--${size}`} aria-label=${`${label} key`}>
    <ds-text as="span" variant="text-caption" emphasis color="inherit">${label}</ds-text>
  </span>
`;

export const Sizes: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: auto auto auto; align-items: center; gap: var(--dimension-space-200);">
      ${SIZES.map(size => html`
        <div style="display: flex; align-items: center; gap: var(--dimension-space-100);">
          ${keyHint('K', size)}
          ${keyHint('?', size)}
          ${keyHint('⌘S', size)}
        </div>
      `)}
    </div>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-text.js';
import '../../utils/key-hint.css';
import { shortcutKeyLabels } from '../../utils/shortcut-key';

const SIZES = ['md', 'sm', 'xs'] as const;

const meta: Meta = {
  title: 'Utility/KeyHint',
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj;

const keyHint = (shortcut: string, size: (typeof SIZES)[number]) => html`
  <span class=${`key-hint-group ds-control--${size}`} aria-label=${`${shortcut} shortcut`}>
    ${shortcutKeyLabels(shortcut).map(label => html`
      <span class="key-hint" aria-hidden="true">
        <ds-text as="span" variant="text-caption" emphasis color="inherit">${label}</ds-text>
      </span>
    `)}
  </span>
`;

export const Sizes: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: auto auto auto; align-items: center; gap: var(--dimension-space-200);">
      ${SIZES.map(size => html`
        <div style="display: flex; align-items: center; gap: var(--dimension-space-100);">
          ${keyHint('K', size)}
          ${keyHint('⌘S', size)}
          ${keyHint('⌘⇧S', size)}
        </div>
      `)}
    </div>
  `,
};

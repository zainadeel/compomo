import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
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
      <span class=${`key-hint${Array.from(label).length > 1 ? ' key-hint--wide' : ''}`} aria-hidden="true">
        <span class="key-hint__label">${label}</span>
      </span>
    `)}
  </span>
`;

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: var(--dimension-space-200);">
      ${SIZES.map(size => html`
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--dimension-space-100);">
          ${keyHint('K', size)}
          ${keyHint('⌘S', size)}
          ${keyHint('⌘⇧S', size)}
          ${keyHint('Ctrl+Shift+K', size)}
        </div>
      `)}
    </div>
  `,
};

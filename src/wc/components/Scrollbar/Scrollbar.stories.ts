import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-scrollbar.js';

const meta: Meta = {
  title: 'Layout/Scrollbar',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'thick'] },
    showTrackOnHover: { control: 'boolean' },
  },
  args: { variant: 'default', showTrackOnHover: true },
};

export default meta;
type Story = StoryObj;

export const Vertical: Story = {
  render: args => html`
    <div style="padding: 16px; height: 200px; width: 300px">
      <ds-scrollbar variant=${args['variant'] ?? 'default'} ?show-track-on-hover=${args['showTrackOnHover'] ?? true}>
        ${Array.from({ length: 20 }, (_, i) => html`<div style="padding: 8px; border-bottom: 1px solid var(--color-border-primary)">Row ${i + 1}</div>`)}
      </ds-scrollbar>
    </div>
  `,
};

export const Horizontal: Story = {
  render: () => html`
    <div style="padding: 16px; height: 120px; width: 300px">
      <ds-scrollbar>
        <div style="white-space: nowrap; display: flex; gap: 8px">
          ${Array.from({ length: 20 }, (_, i) => html`<div style="padding: 8px 16px; background: var(--color-background-secondary); border-radius: 4px; flex-shrink: 0">Item ${i + 1}</div>`)}
        </div>
      </ds-scrollbar>
    </div>
  `,
};

export const Thick: Story = {
  render: () => html`
    <div style="padding: 16px; height: 200px; width: 300px">
      <ds-scrollbar variant="thick">
        ${Array.from({ length: 20 }, (_, i) => html`<div style="padding: 8px; border-bottom: 1px solid var(--color-border-primary)">Row ${i + 1}</div>`)}
      </ds-scrollbar>
    </div>
  `,
};

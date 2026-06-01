import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-label-wrap.js';

const meta: Meta = {
  title: 'Internal/LabelWrap',
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    truncate: { control: 'boolean' },
  },
  args: { size: 'md', truncate: false },
};

export default meta;
type Story = StoryObj;

const LABEL_STYLE = `
  font-family: var(--typography-font-family, sans-serif);
  font-size: var(--typography-fontsize-md, 14px);
  line-height: var(--typography-lineheight-md, 1.5);
  color: var(--color-foreground-primary);
`;

export const Playground: Story = {
  render: args => html`
    <div style="display: inline-flex; align-items: center; padding: 8px; border: 1px solid var(--color-border-tertiary); border-radius: 4px;">
      <ds-label-wrap size=${args['size'] ?? 'md'} ?truncate=${args['truncate']}>
        <span style="${LABEL_STYLE}">Label text</span>
      </ds-label-wrap>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 12px; font-family: var(--typography-font-family, sans-serif);">
      ${(['xs', 'sm', 'md', 'lg'] as const).map(size => html`
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary); width: 32px;">${size}</span>
          <div style="display: inline-flex; align-items: center; border: 1px dashed var(--color-border-tertiary); border-radius: 4px; padding: 2px;">
            <ds-label-wrap size=${size}>
              <span style="${LABEL_STYLE} font-size: var(--typography-fontsize-${size}, 14px);">Button label</span>
            </ds-label-wrap>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const Truncation: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 12px; font-family: var(--typography-font-family, sans-serif);">
      <div style="width: 160px; display: inline-flex; align-items: center; border: 1px solid var(--color-border-tertiary); border-radius: 4px; padding: 4px 8px; overflow: hidden;">
        <ds-label-wrap truncate>
          <span style="${LABEL_STYLE}">Very long label that should be truncated with ellipsis</span>
        </ds-label-wrap>
      </div>
      <div style="display: inline-flex; align-items: center; border: 1px solid var(--color-border-tertiary); border-radius: 4px; padding: 4px 8px;">
        <ds-label-wrap>
          <span style="${LABEL_STYLE}">Normal label without truncation</span>
        </ds-label-wrap>
      </div>
    </div>
  `,
};

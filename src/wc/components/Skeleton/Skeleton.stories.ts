import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-skeleton.js';

const meta: Meta = {
  title: 'Primitives/Skeleton',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['text', 'circular', 'rectangular'] },
    shimmer: { control: 'boolean' },
    width:   { control: 'text' },
    height:  { control: 'text' },
    lines:   { control: 'number' },
  },
  args: { variant: 'text', shimmer: true },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`<ds-skeleton variant=${args['variant']} ?shimmer=${args['shimmer']}></ds-skeleton>`,
};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 24px">
      <div>
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #555; margin-bottom: 8px">Text</div>
        <ds-skeleton variant="text" width="240px"></ds-skeleton>
      </div>
      <div>
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #555; margin-bottom: 8px">Text (3 lines)</div>
        <ds-skeleton variant="text" lines="3" width="320px"></ds-skeleton>
      </div>
      <div>
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #555; margin-bottom: 8px">Circular</div>
        <div style="display: flex; gap: 12px; align-items: center">
          <ds-skeleton variant="circular" width="32px" height="32px"></ds-skeleton>
          <ds-skeleton variant="circular" width="40px" height="40px"></ds-skeleton>
          <ds-skeleton variant="circular" width="56px" height="56px"></ds-skeleton>
        </div>
      </div>
      <div>
        <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #555; margin-bottom: 8px">Rectangular</div>
        <ds-skeleton variant="rectangular" width="320px" height="120px"></ds-skeleton>
      </div>
    </div>
  `,
};

export const CardSkeleton: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; padding: 16px; border: 1px solid var(--color-border-secondary); border-radius: 12px; width: 320px">
      <ds-skeleton variant="circular" width="48px" height="48px"></ds-skeleton>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px">
        <ds-skeleton variant="text" width="180px"></ds-skeleton>
        <ds-skeleton variant="text" width="120px"></ds-skeleton>
      </div>
    </div>
  `,
};

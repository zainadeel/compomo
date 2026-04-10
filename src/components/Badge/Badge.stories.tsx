import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  argTypes: {
    count: { control: 'number' },
    isSelected: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    count: 3,
  },
};

export const Counts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Badge count={1} />
      <Badge count={5} />
      <Badge count={9} />
      <Badge count={10} />
      <Badge count={99} />
    </div>
  ),
};

export const ZeroCount: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span>Badge with count 0 renders null:</span>
      <Badge count={0} />
      <span>(nothing should appear before this text)</span>
    </div>
  ),
};

export const Selected: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Badge count={5} />
      <Badge count={5} isSelected />
    </div>
  ),
};

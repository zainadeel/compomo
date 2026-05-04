import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Loader } from './Loader';

const meta: Meta<typeof Loader> = {
  title: 'Primitives/Loader',
  component: Loader,
  args: { size: 20 },
  argTypes: { size: { control: 'number' } },
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Default: Story = {};

/**
 * Standalone usage with an accessible label. Wraps the spinner in a
 * `role="status"` live region and renders a visually-hidden label so
 * screen readers announce the loading state on mount.
 */
export const WithLabel: Story = {
  args: { label: 'Loading' },
};

/** Shows how stroke weight scales naturally with size — same as icon strokes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      {([12, 16, 20, 24, 32, 48] as const).map(size => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Loader size={size} />
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#888' }}>{size}px</span>
        </div>
      ))}
    </div>
  ),
};

/** Inherits currentColor — works on any background. */
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Loader size={20} />
      <span style={{ color: '#2563eb' }}><Loader size={20} /></span>
      <span style={{ color: '#16a34a' }}><Loader size={20} /></span>
      <span style={{ color: '#dc2626' }}><Loader size={20} /></span>
      <span style={{ padding: '6px', background: '#1e293b', borderRadius: 6, display: 'flex' }}>
        <span style={{ color: '#fff' }}><Loader size={20} /></span>
      </span>
    </div>
  ),
};

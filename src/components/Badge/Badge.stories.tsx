import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  args: {
    count: 3,
    isSelected: false,
  },
  argTypes: {
    count: { control: 'number' },
    isSelected: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Playground: Story = {};

// ─── Matrix ───────────────────────────────────────────────────────────────────

const COUNTS = [1, 5, 9, 10, 99];

const row: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'center' };
const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const labelStyle: React.CSSProperties = { fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 72, flexShrink: 0 };

export const Matrix: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ ...col, fontFamily: 'sans-serif' }}>
      {/* Header row */}
      <div style={row}>
        <span style={labelStyle}></span>
        {COUNTS.map(c => (
          <span key={c} style={{ ...labelStyle, textAlign: 'center' }}>{c}</span>
        ))}
      </div>
      {/* Normal */}
      <div style={row}>
        <span style={labelStyle}>normal</span>
        {COUNTS.map(c => (
          <div key={c} style={{ minWidth: 72, display: 'flex', justifyContent: 'center' }}>
            <Badge count={c} />
          </div>
        ))}
      </div>
      {/* Selected */}
      <div style={row}>
        <span style={labelStyle}>selected</span>
        {COUNTS.map(c => (
          <div key={c} style={{ minWidth: 72, display: 'flex', justifyContent: 'center' }}>
            <Badge count={c} isSelected />
          </div>
        ))}
      </div>
      {/* Zero renders nothing */}
      <div style={row}>
        <span style={labelStyle}>zero</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Badge count={0} />
          <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>(renders null)</span>
        </div>
      </div>
    </div>
  ),
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const Counts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      {COUNTS.map(c => <Badge key={c} count={c} />)}
    </div>
  ),
};

export const Selected: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Badge count={5} />
      <Badge count={5} isSelected />
    </div>
  ),
};

export const ZeroCount: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'sans-serif', fontSize: 12 }}>
      <span>count=0 renders null:</span>
      <Badge count={0} />
      <span style={{ color: '#888' }}>(nothing between these spans)</span>
    </div>
  ),
};

export const AccessibleLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Inspect the rendered HTML to see how the accessible name is composed. ' +
          'Default is just the count. Pass `aria-label` for an explicit string, ' +
          'or `labelFormat` for a count-aware formatter.',
      },
    },
  },
  render: () => (
    <div style={{ ...col, fontFamily: 'sans-serif', fontSize: 12 }}>
      <div style={row}>
        <span style={{ ...labelStyle, minWidth: 220 }}>default (just count)</span>
        <Badge count={3} />
        <code style={{ color: '#888' }}>aria-label="3"</code>
      </div>
      <div style={row}>
        <span style={{ ...labelStyle, minWidth: 220 }}>aria-label override</span>
        <Badge count={3} aria-label="3 new notifications" />
        <code style={{ color: '#888' }}>aria-label="3 new notifications"</code>
      </div>
      <div style={row}>
        <span style={{ ...labelStyle, minWidth: 220 }}>labelFormat callback</span>
        <Badge count={3} labelFormat={n => `${n} unread messages`} />
        <code style={{ color: '#888' }}>aria-label="3 unread messages"</code>
      </div>
    </div>
  ),
};

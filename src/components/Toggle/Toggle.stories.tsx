import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Primitives/Toggle',
  component: Toggle,
  args: {
    checked: false,
    inactive: false,
    'aria-label': 'Toggle',
  },
  argTypes: {
    checked: { control: 'boolean' },
    inactive: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

const Controlled = (props: React.ComponentProps<typeof Toggle>) => {
  const [checked, setChecked] = useState(props.checked ?? false);
  return <Toggle {...props} checked={checked} onChange={setChecked} />;
};

export const Playground: Story = {
  render: (args) => <Controlled {...args} />,
};

// ─── Matrix ───────────────────────────────────────────────────────────────────

const row: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'center' };
const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const labelStyle: React.CSSProperties = { fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 80, flexShrink: 0 };

export const Matrix: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ ...col, fontFamily: 'sans-serif' }}>
      <div style={row}>
        <span style={labelStyle}></span>
        <span style={{ ...labelStyle, textAlign: 'center' }}>off</span>
        <span style={{ ...labelStyle, textAlign: 'center' }}>on</span>
      </div>
      <div style={row}>
        <span style={labelStyle}>enabled</span>
        <div style={{ minWidth: 80, display: 'flex', justifyContent: 'center' }}>
          <Controlled aria-label="Toggle" checked={false} />
        </div>
        <div style={{ minWidth: 80, display: 'flex', justifyContent: 'center' }}>
          <Controlled aria-label="Toggle" checked={true} />
        </div>
      </div>
      <div style={row}>
        <span style={labelStyle}>Inactive</span>
        <div style={{ minWidth: 80, display: 'flex', justifyContent: 'center' }}>
          <Toggle aria-label="Toggle" checked={false} inactive onChange={() => {}} />
        </div>
        <div style={{ minWidth: 80, display: 'flex', justifyContent: 'center' }}>
          <Toggle aria-label="Toggle" checked={true} inactive onChange={() => {}} />
        </div>
      </div>
    </div>
  ),
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const Default: Story = {
  render: () => <Controlled aria-label="Toggle" />,
};

export const Checked: Story = {
  render: () => <Controlled aria-label="Toggle" checked />,
};

export const Inactive: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Toggle aria-label="Off disabled" checked={false} inactive onChange={() => {}} />
      <Toggle aria-label="On disabled" checked={true} inactive onChange={() => {}} />
    </div>
  ),
};

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  args: {
    label: 'Accept terms',
    checked: false,
    indeterminate: false,
    inactive: false,
  },
  argTypes: {
    label: { control: 'text' },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    inactive: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

const Controlled = (props: React.ComponentProps<typeof Checkbox>) => {
  const [checked, setChecked] = useState(props.checked ?? false);
  return <Checkbox {...props} checked={checked} onChange={setChecked} />;
};

export const Playground: Story = {
  render: (args) => <Controlled {...args} />,
};

// ─── Matrix ───────────────────────────────────────────────────────────────────

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 };
const row: React.CSSProperties = { display: 'flex', gap: 32, alignItems: 'center' };
const labelStyle: React.CSSProperties = { fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 80, flexShrink: 0 };
const section = (text: string) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#555', marginTop: 8 }}>
    {text}
  </div>
);

export const Matrix: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ ...col, fontFamily: 'sans-serif', gap: 0 }}>
      {section('States × Enabled / Disabled')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={labelStyle}></span>
          <span style={{ ...labelStyle, textAlign: 'center' }}>enabled</span>
          <span style={{ ...labelStyle, textAlign: 'center' }}>disabled</span>
        </div>
        <div style={row}>
          <span style={labelStyle}>unchecked</span>
          <Controlled label="Option" checked={false} />
          <Checkbox label="Option" checked={false} inactive onChange={() => {}} />
        </div>
        <div style={row}>
          <span style={labelStyle}>checked</span>
          <Controlled label="Option" checked={true} />
          <Checkbox label="Option" checked={true} inactive onChange={() => {}} />
        </div>
        <div style={row}>
          <span style={labelStyle}>indeterminate</span>
          <Checkbox label="Select all" checked={false} indeterminate onChange={() => {}} />
          <Checkbox label="Select all" checked={false} indeterminate inactive onChange={() => {}} />
        </div>
      </div>
    </div>
  ),
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const Default: Story = {
  render: () => <Controlled label="Accept terms and conditions" />,
};

export const Checked: Story = {
  render: () => <Controlled label="Checked option" checked />,
};

export const Indeterminate: Story = {
  render: () => (
    <Checkbox
      label="Select all (3 of 5 selected)"
      checked={false}
      indeterminate
      onChange={() => {}}
    />
  ),
};

export const Inactive: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Checkbox label="Disabled unchecked" checked={false} inactive onChange={() => {}} />
      <Checkbox label="Disabled checked" checked={true} inactive onChange={() => {}} />
      <Checkbox label="Disabled indeterminate" checked={false} indeterminate inactive onChange={() => {}} />
    </div>
  ),
};

export const Group: Story = {
  render: () => {
    const [selected, setSelected] = useState<Set<string>>(new Set(['option-b']));
    const toggle = (key: string) => setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    const options = ['Option A', 'Option B', 'Option C', 'Option D'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map(opt => (
          <Checkbox
            key={opt}
            label={opt}
            checked={selected.has(opt.toLowerCase().replace(' ', '-'))}
            onChange={() => toggle(opt.toLowerCase().replace(' ', '-'))}
          />
        ))}
      </div>
    );
  },
};

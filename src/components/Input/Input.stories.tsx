import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';
import type { InputType } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  args: {
    placeholder: 'Enter text…',
    inactive: false,
    type: 'text',
  },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'tel', 'url', 'search', 'password'] },
    inactive: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

const Controlled = (props: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> & { initialValue?: string }) => {
  const [value, setValue] = useState(props.initialValue ?? '');
  return <Input {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
};

export const Playground: Story = {
  render: (args) => <Controlled {...args} />,
};

// ─── Matrix ───────────────────────────────────────────────────────────────────

const TYPES: InputType[] = ['text', 'email', 'search', 'password'];

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 };
const row: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'center' };
const labelStyle: React.CSSProperties = { fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 72, flexShrink: 0 };
const inputCell: React.CSSProperties = { width: 200, flexShrink: 0 };
const section = (text: string) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#555', marginTop: 8 }}>
    {text}
  </div>
);
const divider = <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '16px 0' }} />;

export const Matrix: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ ...col, fontFamily: 'sans-serif', gap: 0 }}>

      {section('Types × Empty / Filled')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={labelStyle}></span>
          <span style={{ ...inputCell, fontSize: 10, fontFamily: 'monospace', color: '#888', textAlign: 'center' }}>empty</span>
          <span style={{ ...inputCell, fontSize: 10, fontFamily: 'monospace', color: '#888', textAlign: 'center' }}>filled</span>
        </div>
        {TYPES.map(type => (
          <div key={type} style={row}>
            <span style={labelStyle}>{type}</span>
            <div style={inputCell}>
              <Controlled type={type} placeholder={`${type}…`} />
            </div>
            <div style={inputCell}>
              <Controlled type={type} initialValue={type === 'email' ? 'user@example.com' : type === 'password' ? 'secret123' : 'Hello, world'} />
            </div>
          </div>
        ))}
      </div>

      {divider}

      {section('States')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={labelStyle}>default</span>
          <div style={inputCell}><Controlled placeholder="Enter text…" /></div>
        </div>
        <div style={row}>
          <span style={labelStyle}>with value</span>
          <div style={inputCell}><Controlled initialValue="Some value" /></div>
        </div>
        <div style={row}>
          <span style={labelStyle}>Inactive</span>
          <div style={inputCell}><Input value="Disabled value" inactive onChange={() => {}} /></div>
        </div>
        <div style={row}>
          <span style={labelStyle}>Inactive empty</span>
          <div style={inputCell}><Input value="" placeholder="Disabled…" inactive onChange={() => {}} /></div>
        </div>
      </div>

    </div>
  ),
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const Default: Story = {
  render: () => <Controlled placeholder="Enter text…" style={{ width: 260 }} />,
};

export const Search: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 260 }}>
      <Controlled type="search" placeholder="Search…" />
      <Controlled type="search" placeholder="Search…" initialValue="Some query" />
    </div>
  ),
};

export const Password: Story = {
  render: () => <Controlled type="password" placeholder="Enter password…" style={{ width: 260 }} />,
};

export const Inactive: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 260 }}>
      <Input value="" placeholder="Disabled empty" inactive onChange={() => {}} />
      <Input value="Disabled with value" inactive onChange={() => {}} />
    </div>
  ),
};

export const WithSuffix: Story = {
  render: () => (
    <Controlled
      placeholder="Enter amount…"
      suffix={<span style={{ fontSize: 12, color: '#888', paddingRight: 4 }}>USD</span>}
      style={{ width: 260 }}
    />
  ),
};

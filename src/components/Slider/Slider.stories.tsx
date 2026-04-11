import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'Primitives/Slider',
  component: Slider,
  args: {
    label: 'Value',
    min: 0,
    max: 100,
    step: 1,
    inactive: false,
  },
  argTypes: {
    label: { control: 'text' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    inactive: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

const Controlled = (props: Omit<React.ComponentProps<typeof Slider>, 'value' | 'onChange'> & { initialValue?: number }) => {
  const [value, setValue] = useState(props.initialValue ?? 50);
  return <Slider {...props} value={value} onChange={setValue} />;
};

export const Playground: Story = {
  render: (args) => <Controlled {...args} />,
};

// ─── Matrix ───────────────────────────────────────────────────────────────────

const SNAPSHOTS = [0, 25, 50, 75, 100];

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };
const row: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'center' };
const labelStyle: React.CSSProperties = { fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 72, flexShrink: 0 };
const sliderCell: React.CSSProperties = { width: 200, flexShrink: 0 };
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

      {section('Values (0–100)')}
      <div style={{ ...col, marginTop: 12 }}>
        {SNAPSHOTS.map(v => (
          <div key={v} style={row}>
            <span style={labelStyle}>{v}%</span>
            <div style={sliderCell}>
              <Slider label="Volume" value={v} onChange={() => {}} />
            </div>
          </div>
        ))}
      </div>

      {divider}

      {section('States')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={labelStyle}>enabled</span>
          <div style={sliderCell}><Controlled label="Brightness" initialValue={60} /></div>
        </div>
        <div style={row}>
          <span style={labelStyle}>Inactive</span>
          <div style={sliderCell}><Slider label="Brightness" value={60} inactive onChange={() => {}} /></div>
        </div>
        <div style={row}>
          <span style={labelStyle}>at min</span>
          <div style={sliderCell}><Slider label="Brightness" value={0} onChange={() => {}} /></div>
        </div>
        <div style={row}>
          <span style={labelStyle}>at max</span>
          <div style={sliderCell}><Slider label="Brightness" value={100} onChange={() => {}} /></div>
        </div>
      </div>

    </div>
  ),
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <Controlled label="Volume" initialValue={50} />
    </div>
  ),
};

export const CustomRange: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 280 }}>
      <Controlled label="Rating (0–10)" min={0} max={10} step={1} initialValue={7} />
      <Controlled label="Opacity (0–1)" min={0} max={1} step={0.1} initialValue={0.8} />
    </div>
  ),
};

export const Inactive: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 280 }}>
      <Slider label="Brightness" value={30} inactive onChange={() => {}} />
      <Slider label="Contrast" value={70} inactive onChange={() => {}} />
    </div>
  ),
};

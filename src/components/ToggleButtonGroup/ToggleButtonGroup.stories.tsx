import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { ToggleButtonGroup } from './ToggleButtonGroup';
import { ToggleButton } from '@/components/ToggleButton';
import type { ToggleButtonElevation } from '@/components/ToggleButton';
import type { IconComponent } from '@/types/icons';

const PlaceholderIcon: IconComponent = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="6" />
  </svg>
);

interface PlaygroundArgs {
  elevation: ToggleButtonElevation;
  size:      'xs' | 'sm' | 'md';
  rounded:   boolean;
  showIcon:  boolean;
}

const meta: Meta<typeof ToggleButtonGroup> = {
  title: 'Primitives (Reviewed)/ToggleButtonGroup',
  component: ToggleButtonGroup,
  args: {
    elevation: 'elevated',
    size:      'md',
    rounded:   false,
    showIcon:  false,
  } as PlaygroundArgs,
  argTypes: {
    elevation: { control: 'select', options: ['elevated', 'flat', 'none', 'floating'] },
    size:      { control: 'select', options: ['xs', 'sm', 'md'] },
    rounded:   { control: 'boolean' },
    showIcon:  { control: 'boolean' },
  } as Record<string, unknown>,
};

export default meta;
type Story = StoryObj<typeof ToggleButtonGroup>;

// ─── Matrix ───────────────────────────────────────────────────────────────────

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' };
const row: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'center' };
const labelStyle: React.CSSProperties = { fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 120, flexShrink: 0 };
const section = (text: string) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#555', marginTop: 8 }}>
    {text}
  </div>
);
const divider = <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '8px 0 16px' }} />;

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const a = args as unknown as PlaygroundArgs;
    const opts = ['First', 'Second', 'Third'] as const;
    const [selected, setSelected] = useState<string>('Second');
    return (
      <ToggleButtonGroup>
        {opts.map(opt => (
          <ToggleButton
            key={opt}
            elevation={a.elevation}
            size={a.size}
            rounded={a.rounded}
            icon={a.showIcon ? PlaceholderIcon : undefined}
            label={opt}
            pressed={selected === opt}
            onPressedChange={() => setSelected(opt)}
          />
        ))}
      </ToggleButtonGroup>
    );
  },
};

// ─── Matrix ───────────────────────────────────────────────────────────────────

export const Matrix: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    const [view, setView] = useState<'grid' | 'list' | 'table'>('grid');
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [multi, setMulti] = useState<Set<string>>(new Set(['b']));
    const toggleMulti = (key: string) => setMulti(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

    return (
      <div style={{ ...col, fontFamily: 'sans-serif', gap: 0 }}>

        {section('Elevation — full-height vs short divider')}
        {divider}
        <div style={col}>
          <div style={row}>
            <span style={labelStyle}>elevated ↓ full</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" label="Day"   pressed={period === 'day'}   onPressedChange={() => setPeriod('day')} />
              <ToggleButton elevation="elevated" label="Week"  pressed={period === 'week'}  onPressedChange={() => setPeriod('week')} />
              <ToggleButton elevation="elevated" label="Month" pressed={period === 'month'} onPressedChange={() => setPeriod('month')} />
            </ToggleButtonGroup>
          </div>
          <div style={row}>
            <span style={labelStyle}>flat ↓ full</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="flat" label="Day"   pressed={period === 'day'}   onPressedChange={() => setPeriod('day')} />
              <ToggleButton elevation="flat" label="Week"  pressed={period === 'week'}  onPressedChange={() => setPeriod('week')} />
              <ToggleButton elevation="flat" label="Month" pressed={period === 'month'} onPressedChange={() => setPeriod('month')} />
            </ToggleButtonGroup>
          </div>
          <div style={row}>
            <span style={labelStyle}>none ↓ short</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="none" label="Day"   pressed={period === 'day'}   onPressedChange={() => setPeriod('day')} />
              <ToggleButton elevation="none" label="Week"  pressed={period === 'week'}  onPressedChange={() => setPeriod('week')} />
              <ToggleButton elevation="none" label="Month" pressed={period === 'month'} onPressedChange={() => setPeriod('month')} />
            </ToggleButtonGroup>
          </div>
        </div>

        {section('Sizes')}
        {divider}
        <div style={col}>
          {(['md', 'sm', 'xs'] as const).map(size => (
            <div key={size} style={row}>
              <span style={labelStyle}>{size}</span>
              <ToggleButtonGroup>
                <ToggleButton elevation="elevated" size={size} label="Day"   pressed={false} onPressedChange={() => {}} />
                <ToggleButton elevation="elevated" size={size} label="Week"  pressed={true}  onPressedChange={() => {}} />
                <ToggleButton elevation="elevated" size={size} label="Month" pressed={false} onPressedChange={() => {}} />
              </ToggleButtonGroup>
            </div>
          ))}
        </div>

        {section('Rounded — outer pill padding, inner base padding')}
        {divider}
        <div style={col}>
          <div style={row}>
            <span style={labelStyle}>elevated label</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" label="Day"   rounded pressed={period === 'day'}   onPressedChange={() => setPeriod('day')} />
              <ToggleButton elevation="elevated" label="Week"  rounded pressed={period === 'week'}  onPressedChange={() => setPeriod('week')} />
              <ToggleButton elevation="elevated" label="Month" rounded pressed={period === 'month'} onPressedChange={() => setPeriod('month')} />
            </ToggleButtonGroup>
          </div>
          <div style={row}>
            <span style={labelStyle}>none label</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="none" label="Day"   rounded pressed={period === 'day'}   onPressedChange={() => setPeriod('day')} />
              <ToggleButton elevation="none" label="Week"  rounded pressed={period === 'week'}  onPressedChange={() => setPeriod('week')} />
              <ToggleButton elevation="none" label="Month" rounded pressed={period === 'month'} onPressedChange={() => setPeriod('month')} />
            </ToggleButtonGroup>
          </div>
          <div style={row}>
            <span style={labelStyle}>icon only</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} rounded aria-label="Grid"  pressed={view === 'grid'}  onPressedChange={() => setView('grid')} />
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} rounded aria-label="List"  pressed={view === 'list'}  onPressedChange={() => setView('list')} />
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} rounded aria-label="Table" pressed={view === 'table'} onPressedChange={() => setView('table')} />
            </ToggleButtonGroup>
          </div>
        </div>

        {section('With Icons')}
        {divider}
        <div style={col}>
          <div style={row}>
            <span style={labelStyle}>icon + label</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} label="Grid"  pressed={view === 'grid'}  onPressedChange={() => setView('grid')} />
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} label="List"  pressed={view === 'list'}  onPressedChange={() => setView('list')} />
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} label="Table" pressed={view === 'table'} onPressedChange={() => setView('table')} />
            </ToggleButtonGroup>
          </div>
          <div style={row}>
            <span style={labelStyle}>icon only</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} aria-label="Grid"  pressed={view === 'grid'}  onPressedChange={() => setView('grid')} />
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} aria-label="List"  pressed={view === 'list'}  onPressedChange={() => setView('list')} />
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} aria-label="Table" pressed={view === 'table'} onPressedChange={() => setView('table')} />
            </ToggleButtonGroup>
          </div>
          <div style={row}>
            <span style={labelStyle}>icon only rounded</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} rounded aria-label="Grid"  pressed={view === 'grid'}  onPressedChange={() => setView('grid')} />
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} rounded aria-label="List"  pressed={view === 'list'}  onPressedChange={() => setView('list')} />
              <ToggleButton elevation="elevated" icon={PlaceholderIcon} rounded aria-label="Table" pressed={view === 'table'} onPressedChange={() => setView('table')} />
            </ToggleButtonGroup>
          </div>
        </div>

        {section('Multi-select')}
        {divider}
        <div style={col}>
          <div style={row}>
            <span style={labelStyle}>independent</span>
            <ToggleButtonGroup>
              {(['a', 'b', 'c'] as const).map(key => (
                <ToggleButton
                  key={key}
                  elevation="elevated"
                  label={key.toUpperCase()}
                  pressed={multi.has(key)}
                  onPressedChange={() => toggleMulti(key)}
                />
              ))}
            </ToggleButtonGroup>
          </div>
        </div>

        {section('States')}
        {divider}
        <div style={col}>
          <div style={row}>
            <span style={labelStyle}>none pressed</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" label="One"   pressed={false} onPressedChange={() => {}} />
              <ToggleButton elevation="elevated" label="Two"   pressed={false} onPressedChange={() => {}} />
              <ToggleButton elevation="elevated" label="Three" pressed={false} onPressedChange={() => {}} />
            </ToggleButtonGroup>
          </div>
          <div style={row}>
            <span style={labelStyle}>all pressed</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" label="One"   pressed={true} onPressedChange={() => {}} />
              <ToggleButton elevation="elevated" label="Two"   pressed={true} onPressedChange={() => {}} />
              <ToggleButton elevation="elevated" label="Three" pressed={true} onPressedChange={() => {}} />
            </ToggleButtonGroup>
          </div>
          <div style={row}>
            <span style={labelStyle}>with inactive</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" label="One"   pressed={false} onPressedChange={() => {}} />
              <ToggleButton elevation="elevated" label="Two"   pressed={true}  onPressedChange={() => {}} inactive />
              <ToggleButton elevation="elevated" label="Three" pressed={false} onPressedChange={() => {}} />
            </ToggleButtonGroup>
          </div>
          <div style={row}>
            <span style={labelStyle}>two items</span>
            <ToggleButtonGroup>
              <ToggleButton elevation="elevated" label="Left"  pressed={false} onPressedChange={() => {}} />
              <ToggleButton elevation="elevated" label="Right" pressed={true}  onPressedChange={() => {}} />
            </ToggleButtonGroup>
          </div>
        </div>

      </div>
    );
  },
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const SingleSelect: Story = {
  render: () => {
    const [selected, setSelected] = useState<'day' | 'week' | 'month'>('week');
    return (
      <ToggleButtonGroup>
        {(['day', 'week', 'month'] as const).map(opt => (
          <ToggleButton
            key={opt}
            elevation="elevated"
            label={opt.charAt(0).toUpperCase() + opt.slice(1)}
            pressed={selected === opt}
            onPressedChange={() => setSelected(opt)}
          />
        ))}
      </ToggleButtonGroup>
    );
  },
};

export const MultiSelect: Story = {
  render: () => {
    const [active, setActive] = useState(new Set(['bold']));
    const toggle = (key: string) => setActive(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    return (
      <ToggleButtonGroup>
        {(['Bold', 'Italic', 'Underline'] as const).map(opt => (
          <ToggleButton
            key={opt}
            elevation="elevated"
            label={opt}
            pressed={active.has(opt.toLowerCase())}
            onPressedChange={() => toggle(opt.toLowerCase())}
          />
        ))}
      </ToggleButtonGroup>
    );
  },
};

export const IconOnly: Story = {
  render: () => {
    const [view, setView] = useState<'grid' | 'list' | 'table'>('grid');
    return (
      <ToggleButtonGroup>
        <ToggleButton elevation="elevated" icon={PlaceholderIcon} aria-label="Grid"  pressed={view === 'grid'}  onPressedChange={() => setView('grid')} />
        <ToggleButton elevation="elevated" icon={PlaceholderIcon} aria-label="List"  pressed={view === 'list'}  onPressedChange={() => setView('list')} />
        <ToggleButton elevation="elevated" icon={PlaceholderIcon} aria-label="Table" pressed={view === 'table'} onPressedChange={() => setView('table')} />
      </ToggleButtonGroup>
    );
  },
};

export const Rounded: Story = {
  render: () => {
    const [selected, setSelected] = useState<'day' | 'week' | 'month'>('week');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        <ToggleButtonGroup>
          {(['day', 'week', 'month'] as const).map(opt => (
            <ToggleButton
              key={opt}
              elevation="elevated"
              label={opt.charAt(0).toUpperCase() + opt.slice(1)}
              rounded
              pressed={selected === opt}
              onPressedChange={() => setSelected(opt)}
            />
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup>
          <ToggleButton elevation="elevated" icon={PlaceholderIcon} rounded aria-label="Grid"  pressed={false} onPressedChange={() => {}} />
          <ToggleButton elevation="elevated" icon={PlaceholderIcon} rounded aria-label="List"  pressed={true}  onPressedChange={() => {}} />
          <ToggleButton elevation="elevated" icon={PlaceholderIcon} rounded aria-label="Table" pressed={false} onPressedChange={() => {}} />
        </ToggleButtonGroup>
      </div>
    );
  },
};

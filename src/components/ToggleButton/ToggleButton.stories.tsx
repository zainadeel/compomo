import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { ToggleButton } from './ToggleButton';
import type { ToggleButtonElevation, ToggleButtonSize } from './ToggleButton';
import type { IconComponent } from '@/types/icons';

const PlaceholderIcon: IconComponent = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="6" />
  </svg>
);

const meta: Meta<typeof ToggleButton> = {
  title: 'Primitives (Reviewed)/ToggleButton',
  component: ToggleButton,
  args: {
    label:     'Toggle',
    elevation: 'elevated',
    size:      'md',
    rounded:   false,
    pressed:   false,
    inactive:  false,
  },
  argTypes: {
    elevation: { control: 'select', options: ['elevated', 'flat', 'none', 'floating'] },
    size:      { control: 'select', options: ['md', 'sm', 'xs'] },
    label:     { control: 'text' },
    rounded:   { control: 'boolean' },
    pressed:   { control: 'boolean' },
    inactive:  { control: 'boolean' },
    icon: {
      control: 'boolean',
      mapping: { true: PlaceholderIcon, false: undefined },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleButton>;

const Controlled = (props: Omit<React.ComponentProps<typeof ToggleButton>, 'pressed' | 'onPressedChange'> & { pressed?: boolean }) => {
  const [pressed, setPressed] = useState(props.pressed ?? false);
  return <ToggleButton {...props} pressed={pressed} onPressedChange={setPressed} />;
};

export const Playground: Story = {
  render: (args) => <Controlled {...args} />,
};

// ─── Matrix ───────────────────────────────────────────────────────────────────

const ELEVATIONS: ToggleButtonElevation[] = ['elevated', 'flat', 'none', 'floating'];
const SIZES: ToggleButtonSize[] = ['md', 'sm', 'xs'];

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' };
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' };
const lbl = (): React.CSSProperties => ({ fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 100, flexShrink: 0 });
const cell = (w = 110): React.CSSProperties => ({ minWidth: w, display: 'flex', justifyContent: 'center' });
const section = (text: string) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#555', marginTop: 8 }}>
    {text}
  </div>
);
const divider = <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '16px 0' }} />;

export const Matrix: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, fontFamily: 'sans-serif' }}>

      {/* ── Elevation levels × States ── */}
      {section('Elevation × States')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={lbl()}></span>
          {ELEVATIONS.map(e => (
            <span key={e} style={{ ...lbl(), textAlign: 'center' }}>{e}</span>
          ))}
        </div>
        {(['unpressed', 'pressed'] as const).map(state => (
          <div key={state} style={row}>
            <span style={lbl()}>{state}</span>
            {ELEVATIONS.map(e => (
              <div key={e} style={cell()}>
                <Controlled elevation={e} label="Label" pressed={state === 'pressed'} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── Sizes × Elevations ── */}
      {section('Sizes × Elevations')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={lbl()}></span>
          {ELEVATIONS.map(e => (
            <span key={e} style={{ ...lbl(), textAlign: 'center' }}>{e}</span>
          ))}
        </div>
        {SIZES.flatMap(size => ([
          { key: `${size} label`,      size, hasIcon: false, hasLabel: true  },
          { key: `${size} icon`,       size, hasIcon: true,  hasLabel: false },
          { key: `${size} icon+label`, size, hasIcon: true,  hasLabel: true  },
        ])).map(({ key, size, hasIcon, hasLabel }) => (
          <div key={key} style={row}>
            <span style={lbl()}>{key}</span>
            {ELEVATIONS.map(e => (
              <div key={e} style={cell()}>
                <Controlled
                  elevation={e}
                  size={size}
                  label={hasLabel ? 'Label' : undefined}
                  icon={hasIcon ? PlaceholderIcon : undefined}
                  aria-label="toggle"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── Rounded ── */}
      {section('Rounded')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={lbl()}></span>
          {ELEVATIONS.map(e => (
            <span key={e} style={{ ...lbl(), textAlign: 'center' }}>{e}</span>
          ))}
        </div>
        {([
          { key: 'label',      hasIcon: false, hasLabel: true  },
          { key: 'icon',       hasIcon: true,  hasLabel: false },
          { key: 'icon+label', hasIcon: true,  hasLabel: true  },
        ] as const).map(({ key, hasIcon, hasLabel }) => (
          <div key={key} style={row}>
            <span style={lbl()}>{key}</span>
            {ELEVATIONS.map(e => (
              <div key={e} style={cell()}>
                <Controlled
                  elevation={e}
                  rounded
                  label={hasLabel ? 'Label' : undefined}
                  icon={hasIcon ? PlaceholderIcon : undefined}
                  aria-label="toggle"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── States ── */}
      {section('States')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={lbl()}></span>
          {ELEVATIONS.map(e => (
            <span key={e} style={{ ...lbl(), textAlign: 'center' }}>{e}</span>
          ))}
        </div>
        {([
          { key: 'default',           pressed: false, inactive: false },
          { key: 'pressed',           pressed: true,  inactive: false },
          { key: 'Inactive',          pressed: false, inactive: true  },
          { key: 'Inactive+pressed',  pressed: true,  inactive: true  },
        ] as const).map(({ key, pressed, inactive }) => (
          <div key={key} style={row}>
            <span style={lbl()}>{key}</span>
            {ELEVATIONS.map(e => (
              <div key={e} style={cell()}>
                <Controlled elevation={e} label="Label" pressed={pressed} inactive={inactive} />
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  ),
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const ElevationLevels: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Controlled elevation="elevated" label="Elevated" />
      <Controlled elevation="flat"     label="Flat" />
      <Controlled elevation="none"     label="Ghost" />
      <Controlled elevation="floating" label="Floating" />
    </div>
  ),
};

export const Pressed: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Controlled elevation="elevated" label="Elevated" pressed />
      <Controlled elevation="flat"     label="Flat"     pressed />
      <Controlled elevation="none"     label="Ghost"    pressed />
      <Controlled elevation="floating" label="Floating" pressed />
    </div>
  ),
};

export const Rounded: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Controlled elevation="elevated" label="Label" rounded />
      <Controlled elevation="flat"     label="Label" rounded />
      <Controlled elevation="none"     label="Label" rounded />
      <Controlled elevation="elevated" icon={PlaceholderIcon} rounded aria-label="Toggle" />
      <Controlled elevation="flat"     icon={PlaceholderIcon} rounded aria-label="Toggle" />
      <Controlled elevation="none"     icon={PlaceholderIcon} rounded aria-label="Toggle" />
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Controlled elevation="elevated" icon={PlaceholderIcon} aria-label="Toggle" />
      <Controlled elevation="flat"     icon={PlaceholderIcon} aria-label="Toggle" />
      <Controlled elevation="none"     icon={PlaceholderIcon} aria-label="Toggle" />
      <Controlled elevation="elevated" icon={PlaceholderIcon} rounded aria-label="Toggle" />
      <Controlled elevation="none"     icon={PlaceholderIcon} rounded aria-label="Toggle" />
    </div>
  ),
};

export const Inactive: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Controlled elevation="elevated" label="Elevated" inactive />
      <Controlled elevation="flat"     label="Flat"     inactive />
      <Controlled elevation="none"     label="Ghost"    inactive />
      <Controlled elevation="elevated" label="Pressed"  inactive pressed />
      <Controlled elevation="none"     label="Pressed"  inactive pressed />
    </div>
  ),
};

export const FAB: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Controlled elevation="floating" icon={PlaceholderIcon} rounded aria-label="FAB" />
      <Controlled elevation="floating" icon={PlaceholderIcon} rounded aria-label="FAB" pressed />
    </div>
  ),
};

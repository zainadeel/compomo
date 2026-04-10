import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { ToggleButton } from './ToggleButton';
import type { ToggleButtonVariant, ToggleButtonSize } from './ToggleButton';
import type { IconComponent } from '@/types/icons';

const PlaceholderIcon: IconComponent = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="6" />
  </svg>
);

const meta: Meta<typeof ToggleButton> = {
  title: 'Primitives/ToggleButton',
  component: ToggleButton,
  args: {
    label: 'Toggle',
    variant: 'primary',
    size: 'md',
    rounded: false,
    pressed: false,
    disabled: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary'] },
    size: { control: 'select', options: ['md', 'sm', 'xs'] },
    label: { control: 'text' },
    rounded: { control: 'boolean' },
    pressed: { control: 'boolean' },
    disabled: { control: 'boolean' },
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

const VARIANTS: ToggleButtonVariant[] = ['primary', 'secondary'];
const SIZES: ToggleButtonSize[] = ['md', 'sm', 'xs'];

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' };
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' };
const labelStyle = (): React.CSSProperties => ({ fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 80, flexShrink: 0 });
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

      {/* ── SECTION 1: Variants × States ── */}
      {section('Variants × States')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={labelStyle()}></span>
          {VARIANTS.map(v => (
            <span key={v} style={{ ...labelStyle(), minWidth: 100, textAlign: 'center' }}>{v}</span>
          ))}
        </div>
        {(['unpressed', 'pressed'] as const).map(state => (
          <div key={state} style={row}>
            <span style={labelStyle()}>{state}</span>
            {VARIANTS.map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Controlled variant={v} label="Label" pressed={state === 'pressed'} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── SECTION 2: Sizes ── */}
      {section('Sizes')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={labelStyle()}></span>
          {VARIANTS.map(v => (
            <span key={v} style={{ ...labelStyle(), minWidth: 100, textAlign: 'center' }}>{v}</span>
          ))}
        </div>
        {SIZES.flatMap(size => ([
          { key: `${size} label`,     size, iconProp: false, labelProp: true  },
          { key: `${size} icon`,      size, iconProp: true,  labelProp: false },
          { key: `${size} icon+label`,size, iconProp: true,  labelProp: true  },
        ])).map(({ key, size, iconProp, labelProp }) => (
          <div key={key} style={row}>
            <span style={labelStyle()}>{key}</span>
            {VARIANTS.map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Controlled
                  variant={v}
                  size={size}
                  label={labelProp ? 'Label' : undefined}
                  icon={iconProp ? PlaceholderIcon : undefined}
                  aria-label="toggle"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── SECTION 3: Icon states ── */}
      {section('Icon states')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { combo: 'icon only',        iconProp: true,  labelProp: false, roundedProp: false },
          { combo: 'icon only rounded', iconProp: true,  labelProp: false, roundedProp: true  },
          { combo: 'icon + label',      iconProp: true,  labelProp: true,  roundedProp: false },
          { combo: 'label only',        iconProp: false, labelProp: true,  roundedProp: false },
          { combo: 'label rounded',     iconProp: false, labelProp: true,  roundedProp: true  },
        ] as const).map(({ combo, iconProp, labelProp, roundedProp }) => (
          <div key={combo} style={row}>
            <span style={labelStyle()}>{combo}</span>
            {VARIANTS.map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Controlled
                  variant={v}
                  label={labelProp ? 'Label' : undefined}
                  icon={iconProp ? PlaceholderIcon : undefined}
                  rounded={roundedProp}
                  aria-label="toggle"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── SECTION 4: Other states ── */}
      {section('Other states')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { label: 'default',  props: { pressed: false } },
          { label: 'pressed',  props: { pressed: true  } },
          { label: 'disabled', props: { pressed: false, disabled: true } },
          { label: 'disabled pressed', props: { pressed: true, disabled: true } },
          { label: 'rounded',  props: { pressed: false, rounded: true } },
        ] as const).map(({ label: stateLabel, props }) => (
          <div key={stateLabel} style={row}>
            <span style={labelStyle()}>{stateLabel}</span>
            {VARIANTS.map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Controlled variant={v} label="Label" {...(props as object)} />
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Controlled variant="primary" label="Primary" />
      <Controlled variant="secondary" label="Secondary" />
    </div>
  ),
};

export const Pressed: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Controlled variant="primary" label="Primary" pressed />
      <Controlled variant="secondary" label="Secondary" pressed />
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Controlled variant="primary" icon={PlaceholderIcon} aria-label="Toggle" />
      <Controlled variant="secondary" icon={PlaceholderIcon} aria-label="Toggle" />
      <Controlled variant="primary" icon={PlaceholderIcon} rounded aria-label="Toggle" />
      <Controlled variant="secondary" icon={PlaceholderIcon} rounded aria-label="Toggle" />
    </div>
  ),
};

export const Group: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<'day' | 'week' | 'month'>('week');
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        {(['day', 'week', 'month'] as const).map(opt => (
          <ToggleButton
            key={opt}
            variant="primary"
            label={opt.charAt(0).toUpperCase() + opt.slice(1)}
            pressed={selected === opt}
            onPressedChange={() => setSelected(opt)}
          />
        ))}
      </div>
    );
  },
};

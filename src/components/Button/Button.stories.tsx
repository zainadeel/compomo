import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from './Button';
import type { ButtonVariant, ButtonIntent, ButtonContrast, ButtonSize } from './Button';
// Note: toggle/selected state → use ToggleButton component
import type { IconComponent } from '@/types/icons';

/** Placeholder icon component for stories (no real icon dependency). */
const PlaceholderIcon: IconComponent = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="6" />
  </svg>
);

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  args: {
    label: 'Button',
    variant: 'primary',
    intent: 'brand',
    size: 'md',
    contrast: 'bold',
    rounded: false,
    elevation: true,
    disabled: false,
    loading: false,
    dropdown: false,
    fullWidth: false,
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary'] },
    intent: { control: 'select', options: ['none', 'neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    contrast: { control: 'select', options: ['strong', 'bold', 'medium', 'faint'] },
    label: { control: 'text' },
    rounded: { control: 'boolean' },
    elevation: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    dropdown: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    badgeCount: { control: 'number' },
    width: { control: 'text' },
    icon: {
      control: 'boolean',
      mapping: { true: PlaceholderIcon, false: undefined },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

// ─── Matrix ───────────────────────────────────────────────────────────────────

const INTENTS: ButtonIntent[] = ['none', 'neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'];
const CONTRASTS: ButtonContrast[] = ['strong', 'bold', 'medium', 'faint'];
const SIZES: ButtonSize[] = ['lg', 'md', 'sm', 'xs'];

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' };
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' };
const label = (text: string): React.CSSProperties => ({ fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 64, flexShrink: 0 });
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

      {/* ── SECTION 1: Variants × Intent (md size, bold contrast) ── */}
      {section('Variants × Intent — md, bold contrast, elevation on')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={label('')}></span>
          {(['primary', 'secondary', 'tertiary'] as ButtonVariant[]).map(v => (
            <span key={v} style={{ ...label(''), minWidth: 100, textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: '#888' }}>{v}</span>
          ))}
        </div>
        {INTENTS.map(intent => (
          <div key={intent} style={row}>
            <span style={label(intent)}>{intent}</span>
            {(['primary', 'secondary', 'tertiary'] as ButtonVariant[]).map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Button key={v} variant={v} intent={intent} label="Label" size="md" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── SECTION 2: Contrast × Intent (primary only, elevation off) ── */}
      {section('Primary × Contrast × Intent — md, elevation off')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={label('')}></span>
          {CONTRASTS.map(c => (
            <span key={c} style={{ ...label(''), minWidth: 90, textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: '#888' }}>{c}</span>
          ))}
        </div>
        {INTENTS.filter(i => i !== 'none').map(intent => (
          <div key={intent} style={row}>
            <span style={label(intent)}>{intent}</span>
            {CONTRASTS.map(contrast => (
              <div key={contrast} style={{ minWidth: 90, display: 'flex', justifyContent: 'center' }}>
                <Button variant="primary" intent={intent} contrast={contrast} label="Label" size="md" elevation={false} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── SECTION 3: Sizes × Variants ── */}
      {section('Sizes × Variants')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={label('')}></span>
          {(['primary', 'secondary', 'tertiary'] as ButtonVariant[]).map(v => (
            <span key={v} style={{ ...label(''), minWidth: 100, textAlign: 'center', fontSize: 10, fontFamily: 'monospace', color: '#888' }}>{v}</span>
          ))}
        </div>
        {SIZES.flatMap(size => ([
          { key: `${size}-label`,    size, iconProp: false, labelProp: true  },
          { key: `${size}-icon`,     size, iconProp: true,  labelProp: false },
          { key: `${size}-iconlabel`,size, iconProp: true,  labelProp: true  },
        ])).map(({ key, size, iconProp, labelProp }) => (
          <div key={key} style={row}>
            <span style={label(key.replace('-', ' '))}>{key.replace('-', ' ')}</span>
            {(['primary', 'secondary', 'tertiary'] as ButtonVariant[]).map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant={v}
                  size={size}
                  label={labelProp ? 'Label' : undefined}
                  icon={iconProp ? PlaceholderIcon : undefined}
                  aria-label="action"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── SECTION 4: Icon states ── */}
      {section('Icon states — md')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { combo: 'icon only',         iconProp: true,  labelProp: false, roundedProp: false, dropdownProp: false },
          { combo: 'icon only rounded',  iconProp: true,  labelProp: false, roundedProp: true,  dropdownProp: false },
          { combo: 'icon + label',       iconProp: true,  labelProp: true,  roundedProp: false, dropdownProp: false },
          { combo: 'label only',         iconProp: false, labelProp: true,  roundedProp: false, dropdownProp: false },
          { combo: 'dropdown',           iconProp: false, labelProp: true,  roundedProp: false, dropdownProp: true  },
          { combo: 'icon + dropdown',    iconProp: true,  labelProp: true,  roundedProp: false, dropdownProp: true  },
        ] as const).map(({ combo, iconProp, labelProp, roundedProp, dropdownProp }) => (
          <div key={combo} style={row}>
            <span style={label(combo)}>{combo}</span>
            {(['primary', 'secondary', 'tertiary'] as ButtonVariant[]).map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant={v}
                  label={labelProp ? 'Label' : undefined}
                  icon={iconProp ? PlaceholderIcon : undefined}
                  rounded={roundedProp}
                  dropdown={dropdownProp}
                  aria-label="action"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── SECTION 5: States ── */}
      {section('States')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { label: 'default', props: {} },
          { label: 'disabled', props: { disabled: true } },
          { label: 'rounded', props: { rounded: true } },
        ] as const).map(({ label: stateLabel, props }) => (
          <div key={stateLabel} style={row}>
            <span style={label(stateLabel)}>{stateLabel}</span>
            {(['primary', 'secondary', 'tertiary'] as ButtonVariant[]).map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Button variant={v} label="Label" {...(props as object)} />
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
      <Button variant="primary" label="Primary" />
      <Button variant="secondary" label="Secondary" />
      <Button variant="tertiary" label="Tertiary" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button size="lg" label="Large" />
      <Button size="md" label="Medium" />
      <Button size="sm" label="Small" />
      <Button size="xs" label="Extra Small" />
    </div>
  ),
};

export const Intents: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button intent="none" label="None" />
      <Button intent="neutral" label="Neutral" />
      <Button intent="brand" label="Brand" />
      <Button intent="ai" label="AI" />
      <Button intent="negative" label="Negative" />
      <Button intent="warning" label="Warning" />
      <Button intent="caution" label="Caution" />
      <Button intent="positive" label="Positive" />
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" icon={PlaceholderIcon} aria-label="Action" />
      <Button variant="secondary" icon={PlaceholderIcon} aria-label="Action" />
      <Button variant="tertiary" icon={PlaceholderIcon} aria-label="Action" />
    </div>
  ),
};

export const IconAndLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" icon={PlaceholderIcon} label="Primary" />
      <Button variant="secondary" icon={PlaceholderIcon} label="Secondary" />
      <Button variant="tertiary" icon={PlaceholderIcon} label="Tertiary" />
    </div>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="secondary" label="Messages" badgeCount={3} />
      <Button variant="secondary" label="Notifications" badgeCount={9} />
      <Button variant="secondary" label="Alerts" badgeCount={12} />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" label="Primary" disabled />
      <Button variant="secondary" label="Secondary" disabled />
      <Button variant="tertiary" label="Tertiary" disabled />
    </div>
  ),
};

export const Rounded: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" label="Rounded" rounded />
      <Button variant="secondary" label="Rounded" rounded />
      <Button variant="tertiary" label="Rounded" rounded />
    </div>
  ),
};

export const Contrasts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" label="Strong" contrast="strong" elevation={false} />
      <Button variant="primary" label="Bold" contrast="bold" elevation={false} />
      <Button variant="primary" label="Medium" contrast="medium" elevation={false} />
      <Button variant="primary" label="Faint" contrast="faint" elevation={false} />
    </div>
  ),
};

export const Elevation: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button variant="primary" label="Elevated" elevation />
        <Button variant="primary" label="Flat" elevation={false} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button variant="secondary" label="Elevated" elevation />
        <Button variant="secondary" label="Bordered" elevation={false} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button variant="primary" intent="none" label="None Elevated" elevation />
        <Button variant="primary" intent="none" label="None Flat" elevation={false} />
      </div>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" label="Saving" loading />
      <Button variant="secondary" label="Saving" loading />
      <Button variant="tertiary" label="Saving" loading />
      <Button variant="primary" icon={PlaceholderIcon} label="Saving" loading />
      <Button variant="primary" icon={PlaceholderIcon} loading aria-label="Loading" />
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300 }}>
      <Button variant="primary" label="Full Width Button" fullWidth />
      <Button variant="secondary" icon={PlaceholderIcon} label="Full Width with Icon" fullWidth />
      <Button variant="primary" label="This label is very long and should truncate gracefully" fullWidth />
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button as="a" href="#" variant="primary" label="Link button" />
      <Button as="a" href="#" variant="secondary" label="Link button" />
      <Button as="a" href="#" variant="tertiary" label="Link button" />
    </div>
  ),
};


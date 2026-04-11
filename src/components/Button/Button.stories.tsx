import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from './Button';
import type { ButtonVariant, ButtonElevation, ButtonIntent, ButtonContrast, ButtonSize } from './Button';
import type { IconComponent } from '@/types/icons';

/** Placeholder icon component for stories (no real icon dependency). */
const PlaceholderIcon: IconComponent = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="6" />
  </svg>
);

const meta: Meta<typeof Button> = {
  title: 'Primitives (Reviewed)/Button',
  component: Button,
  args: {
    label: 'Button',
    variant: 'primary',
    intent: 'brand',
    size: 'md',
    contrast: 'bold',
    elevation: 'none',
    rounded: false,
    inactive: false,
    loading: false,
    dropdown: false,
    fullWidth: false,
  },
  argTypes: {
    variant:   { control: 'select', options: ['primary', 'secondary'] },
    elevation: { control: 'select', options: ['elevated', 'flat', 'none', 'floating'] },
    intent:    { control: 'select', options: ['none', 'neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'] },
    size:      { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    contrast:  { control: 'select', options: ['strong', 'bold', 'medium', 'faint'] },
    label:     { control: 'text' },
    rounded:   { control: 'boolean' },
    inactive:  { control: 'boolean' },
    loading:   { control: 'boolean' },
    dropdown:  { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    badgeCount:{ control: 'number' },
    width:     { control: 'text' },
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

const INTENTS: ButtonIntent[]   = ['none', 'neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'];
const CONTRASTS: ButtonContrast[] = ['strong', 'bold', 'medium', 'faint'];
const SIZES: ButtonSize[]       = ['lg', 'md', 'sm', 'xs'];
const VARIANTS: ButtonVariant[] = ['primary', 'secondary'];
const ELEVATIONS: ButtonElevation[] = ['elevated', 'flat', 'none', 'floating'];

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' };
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' };
const lbl = (text: string): React.CSSProperties => ({ fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 80, flexShrink: 0 });
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

      {/* ── Variants × Intent ── */}
      {section('Variants × Intent — md, bold contrast')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={lbl('')}></span>
          {VARIANTS.map(v => (
            <span key={v} style={{ ...lbl(''), minWidth: 100, textAlign: 'center' }}>{v}</span>
          ))}
          <span style={{ ...lbl(''), minWidth: 100, textAlign: 'center' }}>secondary / none</span>
        </div>
        {INTENTS.map(intent => (
          <div key={intent} style={row}>
            <span style={lbl(intent)}>{intent}</span>
            {VARIANTS.map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Button variant={v} intent={intent} label="Label" size="md" />
              </div>
            ))}
            <div style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
              <Button variant="secondary" intent={intent} elevation="none" label="Label" size="md" />
            </div>
          </div>
        ))}
      </div>

      {divider}

      {/* ── Elevation levels ── */}
      {section('Elevation levels — secondary variant')}
      <div style={{ ...col, marginTop: 12 }}>
        {ELEVATIONS.map(elev => (
          <div key={elev} style={row}>
            <span style={lbl(elev)}>{elev}</span>
            <Button variant="secondary" elevation={elev} label="Label" />
            <Button variant="secondary" elevation={elev} icon={PlaceholderIcon} label="Label" />
            <Button variant="secondary" elevation={elev} icon={PlaceholderIcon} aria-label="action" />
          </div>
        ))}
      </div>

      {divider}

      {/* ── Elevation levels — primary ── */}
      {section('Elevation levels — primary variant')}
      <div style={{ ...col, marginTop: 12 }}>
        {ELEVATIONS.map(elev => (
          <div key={elev} style={row}>
            <span style={lbl(elev)}>{elev}</span>
            <Button variant="primary" intent="brand" elevation={elev} label="Brand" />
            <Button variant="primary" intent="none" elevation={elev} label="None" />
          </div>
        ))}
      </div>

      {divider}

      {/* ── Contrast × Intent (primary only) ── */}
      {section('Primary × Contrast × Intent')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={lbl('')}></span>
          {CONTRASTS.map(c => (
            <span key={c} style={{ ...lbl(''), minWidth: 90, textAlign: 'center' }}>{c}</span>
          ))}
        </div>
        {INTENTS.filter(i => i !== 'none').map(intent => (
          <div key={intent} style={row}>
            <span style={lbl(intent)}>{intent}</span>
            {CONTRASTS.map(contrast => (
              <div key={contrast} style={{ minWidth: 90, display: 'flex', justifyContent: 'center' }}>
                <Button variant="primary" intent={intent} contrast={contrast} label="Label" size="md" elevation="flat" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── Sizes × Variants ── */}
      {section('Sizes × Variants')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={lbl('')}></span>
          {[...VARIANTS, 'ghost'].map(v => (
            <span key={v} style={{ ...lbl(''), minWidth: 100, textAlign: 'center' }}>{v === 'ghost' ? 'secondary/none' : v}</span>
          ))}
        </div>
        {SIZES.flatMap(size => ([
          { key: `${size}-label`,     size, iconProp: false, labelProp: true  },
          { key: `${size}-icon`,      size, iconProp: true,  labelProp: false },
          { key: `${size}-iconlabel`, size, iconProp: true,  labelProp: true  },
        ])).map(({ key, size, iconProp, labelProp }) => (
          <div key={key} style={row}>
            <span style={lbl(key)}>{key}</span>
            {VARIANTS.map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Button variant={v} size={size} label={labelProp ? 'Label' : undefined} icon={iconProp ? PlaceholderIcon : undefined} aria-label="action" />
              </div>
            ))}
            <div style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
              <Button variant="secondary" elevation="none" size={size} label={labelProp ? 'Label' : undefined} icon={iconProp ? PlaceholderIcon : undefined} aria-label="action" />
            </div>
          </div>
        ))}
      </div>

      {divider}

      {/* ── Icon states ── */}
      {section('Icon states — md')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { combo: 'icon only',        iconProp: true,  labelProp: false, roundedProp: false, dropdownProp: false },
          { combo: 'icon only rounded', iconProp: true,  labelProp: false, roundedProp: true,  dropdownProp: false },
          { combo: 'icon + label',      iconProp: true,  labelProp: true,  roundedProp: false, dropdownProp: false },
          { combo: 'label only',        iconProp: false, labelProp: true,  roundedProp: false, dropdownProp: false },
          { combo: 'dropdown',          iconProp: false, labelProp: true,  roundedProp: false, dropdownProp: true  },
          { combo: 'icon + dropdown',   iconProp: true,  labelProp: true,  roundedProp: false, dropdownProp: true  },
        ] as const).map(({ combo, iconProp, labelProp, roundedProp, dropdownProp }) => (
          <div key={combo} style={row}>
            <span style={lbl(combo)}>{combo}</span>
            {VARIANTS.map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Button variant={v} label={labelProp ? 'Label' : undefined} icon={iconProp ? PlaceholderIcon : undefined} rounded={roundedProp} dropdown={dropdownProp} aria-label="action" />
              </div>
            ))}
            <div style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
              <Button variant="secondary" elevation="none" label={labelProp ? 'Label' : undefined} icon={iconProp ? PlaceholderIcon : undefined} rounded={roundedProp} dropdown={dropdownProp} aria-label="action" />
            </div>
          </div>
        ))}
      </div>

      {divider}

      {/* ── States ── */}
      {section('States')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { label: 'default',  props: {} },
          { label: 'Inactive', props: { inactive: true } },
          { label: 'rounded',  props: { rounded: true } },
        ] as const).map(({ label: stateLabel, props }) => (
          <div key={stateLabel} style={row}>
            <span style={lbl(stateLabel)}>{stateLabel}</span>
            {VARIANTS.map(v => (
              <div key={v} style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
                <Button variant={v} label="Label" {...(props as object)} />
              </div>
            ))}
            <div style={{ minWidth: 100, display: 'flex', justifyContent: 'center' }}>
              <Button variant="secondary" elevation="none" label="Label" {...(props as object)} />
            </div>
          </div>
        ))}
      </div>

    </div>
  ),
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" label="Primary" />
      <Button variant="secondary" label="Secondary (flat)" />
      <Button variant="secondary" elevation="elevated" label="Secondary elevated" />
      <Button variant="secondary" elevation="none" label="Ghost" />
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

export const Elevation: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 80 }}>primary</span>
        <Button variant="primary" label="elevated" elevation="elevated" />
        <Button variant="primary" label="flat" elevation="flat" />
        <Button variant="primary" label="none" elevation="none" />
        <Button variant="primary" label="floating" elevation="floating" />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 80 }}>secondary</span>
        <Button variant="secondary" label="elevated" elevation="elevated" />
        <Button variant="secondary" label="flat" elevation="flat" />
        <Button variant="secondary" label="none" elevation="none" />
        <Button variant="secondary" label="floating" elevation="floating" />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 80 }}>p / intentNone</span>
        <Button variant="primary" intent="none" label="elevated" elevation="elevated" />
        <Button variant="primary" intent="none" label="flat" elevation="flat" />
        <Button variant="primary" intent="none" label="none" elevation="none" />
        <Button variant="primary" intent="none" label="floating" elevation="floating" />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 80 }}>FAB</span>
        <Button variant="primary" icon={PlaceholderIcon} rounded elevation="floating" aria-label="FAB" />
        <Button variant="secondary" icon={PlaceholderIcon} rounded elevation="floating" aria-label="FAB secondary" />
      </div>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" icon={PlaceholderIcon} aria-label="Action" />
      <Button variant="secondary" icon={PlaceholderIcon} aria-label="Action" />
      <Button variant="secondary" elevation="none" icon={PlaceholderIcon} aria-label="Action" />
    </div>
  ),
};

export const IconAndLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" icon={PlaceholderIcon} label="Primary" />
      <Button variant="secondary" icon={PlaceholderIcon} label="Secondary" />
      <Button variant="secondary" elevation="none" icon={PlaceholderIcon} label="Ghost" />
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

export const Inactive: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" label="Primary" inactive />
      <Button variant="secondary" label="Secondary" inactive />
      <Button variant="secondary" elevation="none" label="Ghost" inactive />
    </div>
  ),
};

export const Rounded: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" label="Rounded" rounded />
      <Button variant="secondary" label="Rounded" rounded />
      <Button variant="secondary" elevation="none" label="Rounded" rounded />
    </div>
  ),
};

export const Contrasts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" label="Strong" contrast="strong" elevation="flat" />
      <Button variant="primary" label="Bold" contrast="bold" elevation="flat" />
      <Button variant="primary" label="Medium" contrast="medium" elevation="flat" />
      <Button variant="primary" label="Faint" contrast="faint" elevation="flat" />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button variant="primary" label="Saving" loading />
      <Button variant="secondary" label="Saving" loading />
      <Button variant="secondary" elevation="none" label="Saving" loading />
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
      <Button as="a" href="#" variant="secondary" elevation="none" label="Link button" />
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Tag } from './Tag';
import type { TagIntent, TagContrast, TagElevation, TagSize } from './Tag';
import type { IconComponent } from '@/types/icons';

const PlaceholderIcon: IconComponent = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="6" />
  </svg>
);

const meta: Meta<typeof Tag> = {
  title: 'Primitives (Reviewed)/Tag',
  component: Tag,
  args: {
    label:     'Tag',
    intent:    'neutral',
    contrast:  'faint',
    elevation: 'none',
    size:      'md',
    rounded:   false,
    inactive:  false,
  },
  argTypes: {
    intent:    { control: 'select', options: ['neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'] },
    contrast:  { control: 'select', options: ['strong', 'bold', 'medium', 'faint'] },
    elevation: { control: 'select', options: ['none', 'flat', 'elevated'] },
    size:      { control: 'select', options: ['md', 'sm', 'xs'] },
    label:     { control: 'text' },
    rounded:   { control: 'boolean' },
    removable: { control: 'boolean' },
    inactive:  { control: 'boolean' },
    icon: {
      control: 'boolean',
      mapping: { true: PlaceholderIcon, false: undefined },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Playground: Story = {};

// ─── Matrix helpers ───────────────────────────────────────────────────────────

const INTENTS:    TagIntent[]    = ['neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'];
const CONTRASTS:  TagContrast[]  = ['strong', 'bold', 'medium', 'faint'];
const ELEVATIONS: TagElevation[] = ['none', 'flat', 'elevated'];
const SIZES:      TagSize[]      = ['md', 'sm', 'xs'];

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' };
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' };
const lbl = (): React.CSSProperties => ({ fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 80, flexShrink: 0 });
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

      {/* ── Intents × Contrasts — none ── */}
      {section('Intents × Contrasts — elevation: none')}
      <div style={{ ...col, marginTop: 12 }}>
        <div style={row}>
          <span style={lbl()}></span>
          {CONTRASTS.map(c => <span key={c} style={{ ...lbl(), minWidth: 90 }}>{c}</span>)}
        </div>
        {INTENTS.map(intent => (
          <div key={intent} style={row}>
            <span style={lbl()}>{intent}</span>
            {CONTRASTS.map(contrast => (
              <Tag key={contrast} label={intent.charAt(0).toUpperCase() + intent.slice(1)} intent={intent} contrast={contrast} />
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── Intents × Contrasts — flat ── */}
      {section('Intents × Contrasts — elevation: flat')}
      <div style={{ ...col, marginTop: 12 }}>
        {INTENTS.map(intent => (
          <div key={intent} style={row}>
            <span style={lbl()}>{intent}</span>
            {CONTRASTS.map(contrast => (
              <Tag key={contrast} label={intent.charAt(0).toUpperCase() + intent.slice(1)} intent={intent} contrast={contrast} elevation="flat" />
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── Sizes ── */}
      {section('Sizes')}
      <div style={{ ...col, marginTop: 12 }}>
        {SIZES.map(size => (
          <div key={size} style={row}>
            <span style={lbl()}>{size}</span>
            <Tag label="Label" size={size} intent="brand" />
            <Tag label="Label" size={size} intent="brand" icon={PlaceholderIcon} />
            <Tag label="Label" size={size} intent="brand" removable onRemove={() => {}} />
            <Tag label="Label" size={size} intent="brand" icon={PlaceholderIcon} removable onRemove={() => {}} />
          </div>
        ))}
      </div>

      {divider}

      {/* ── Sizes × Elevation ── */}
      {section('Sizes × Elevation')}
      <div style={{ ...col, marginTop: 12 }}>
        {SIZES.map(size => (
          <div key={size} style={row}>
            <span style={lbl()}>{size}</span>
            {ELEVATIONS.map(elevation => (
              <Tag key={elevation} label={elevation} size={size} intent="brand" elevation={elevation} />
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── Rounded — content variants ── */}
      {section('Rounded — content variants')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { combo: 'label only',       icon: false, removable: false },
          { combo: 'icon + label',     icon: true,  removable: false },
          { combo: 'removable',        icon: false, removable: true  },
          { combo: 'icon + removable', icon: true,  removable: true  },
        ] as const).map(({ combo, icon, removable }) => (
          <div key={combo} style={row}>
            <span style={lbl()}>{combo}</span>
            {SIZES.map(size => (
              <Tag
                key={size}
                label="Label"
                size={size}
                intent="brand"
                rounded
                icon={icon ? PlaceholderIcon : undefined}
                removable={removable}
                onRemove={removable ? () => {} : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── Content variants × Intents ── */}
      {section('Content variants × Intents')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { combo: 'label only',       icon: false, removable: false },
          { combo: 'icon + label',     icon: true,  removable: false },
          { combo: 'removable',        icon: false, removable: true  },
          { combo: 'icon + removable', icon: true,  removable: true  },
        ] as const).map(({ combo, icon, removable }) => (
          <div key={combo} style={row}>
            <span style={lbl()}>{combo}</span>
            {INTENTS.map(intent => (
              <Tag
                key={intent}
                label={intent.charAt(0).toUpperCase() + intent.slice(1)}
                intent={intent}
                icon={icon ? PlaceholderIcon : undefined}
                removable={removable}
                onRemove={removable ? () => {} : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── Content variants × Elevations ── */}
      {section('Content variants × Elevations')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { combo: 'label only',       icon: false, removable: false },
          { combo: 'icon + label',     icon: true,  removable: false },
          { combo: 'removable',        icon: false, removable: true  },
          { combo: 'icon + removable', icon: true,  removable: true  },
        ] as const).map(({ combo, icon, removable }) => (
          <div key={combo} style={row}>
            <span style={lbl()}>{combo}</span>
            {ELEVATIONS.map(elevation => (
              <Tag
                key={elevation}
                label="Label"
                elevation={elevation}
                intent="brand"
                icon={icon ? PlaceholderIcon : undefined}
                removable={removable}
                onRemove={removable ? () => {} : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      {divider}

      {/* ── States ── */}
      {section('States')}
      <div style={{ ...col, marginTop: 12 }}>
        {([
          { label: 'default',  props: {} },
          { label: 'rounded',  props: { rounded: true } },
          { label: 'Inactive', props: { inactive: true } },
          { label: 'elevated', props: { elevation: 'elevated' as const } },
          { label: 'flat',     props: { elevation: 'flat' as const } },
          { label: 'pressed',  props: { pressed: true } },
        ]).map(({ label: stateLabel, props }) => (
          <div key={stateLabel} style={row}>
            <span style={lbl()}>{stateLabel}</span>
            <Tag label="Label" intent="brand" {...(props as object)} />
            <Tag label="Label" intent="negative" {...(props as object)} />
          </div>
        ))}
      </div>

    </div>
  ),
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const Intents: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {INTENTS.map(intent => <Tag key={intent} label={intent.charAt(0).toUpperCase() + intent.slice(1)} intent={intent} />)}
    </div>
  ),
};

export const Contrasts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag label="Strong" contrast="strong" intent="brand" />
      <Tag label="Bold"   contrast="bold"   intent="brand" />
      <Tag label="Medium" contrast="medium" intent="brand" />
      <Tag label="Faint"  contrast="faint"  intent="brand" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag label="Medium"      size="md" intent="brand" />
      <Tag label="Small"       size="sm" intent="brand" />
      <Tag label="Extra Small" size="xs" intent="brand" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {INTENTS.map(intent => <Tag key={intent} label={intent.charAt(0).toUpperCase() + intent.slice(1)} intent={intent} icon={PlaceholderIcon} />)}
    </div>
  ),
};

export const Removable: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag label="Remove me" intent="brand"    removable onRemove={() => {}} />
      <Tag label="Remove me" intent="negative" removable onRemove={() => {}} size="sm" />
      <Tag label="Remove me" intent="positive" removable onRemove={() => {}} size="xs" />
      <Tag label="With icon" intent="brand"    removable onRemove={() => {}} icon={PlaceholderIcon} />
    </div>
  ),
};

export const Flat: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {INTENTS.map(intent => <Tag key={intent} label={intent.charAt(0).toUpperCase() + intent.slice(1)} intent={intent} elevation="flat" />)}
    </div>
  ),
};

export const Elevation: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Tag label="none"     intent="brand" elevation="none" />
      <Tag label="flat"     intent="brand" elevation="flat" />
      <Tag label="elevated" intent="brand" elevation="elevated" />
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false);
    const [filters, setFilters] = useState<Record<string, boolean>>({
      positive: false, negative: false, warning: false, brand: false, ai: false,
    });
    const toggle = (key: string) => setFilters(f => ({ ...f, [key]: !f[key] }));

    return (
      <div style={{ ...col, gap: 16 }}>
        <div>
          <div style={{ ...lbl(), marginBottom: 8 }}>Single toggle</div>
          <Tag
            label={pressed ? 'Selected' : 'Click me'}
            intent="brand"
            pressed={pressed}
            onPressedChange={setPressed}
          />
        </div>
        <div>
          <div style={{ ...lbl(), marginBottom: 8 }}>Filter chips</div>
          <div style={row}>
            {(Object.keys(filters) as TagIntent[]).map(intent => (
              <Tag
                key={intent}
                label={intent.charAt(0).toUpperCase() + intent.slice(1)}
                intent={intent}
                pressed={filters[intent]}
                onPressedChange={() => toggle(intent)}
              />
            ))}
          </div>
        </div>
        <div>
          <div style={{ ...lbl(), marginBottom: 8 }}>Click only (no toggle)</div>
          <Tag label="Click me" intent="neutral" onClick={() => alert('clicked')} />
        </div>
      </div>
    );
  },
};

export const Inactive: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag label="Inactive"         intent="brand" inactive />
      <Tag label="Inactive remove"  intent="brand" inactive removable onRemove={() => {}} />
      <Tag label="Inactive flat"    intent="brand" inactive elevation="flat" />
    </div>
  ),
};

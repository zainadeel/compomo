import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ButtonGroup } from './ButtonGroup';
import { Button } from '@/components/Button';
import type { ButtonContrast, ButtonIntent } from '@/components/Button';
import type { IconComponent } from '@/types/icons';

const PlaceholderIcon: IconComponent = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="6" />
  </svg>
);

interface PlaygroundArgs {
  variant:   'primary' | 'secondary';
  elevation: 'elevated' | 'flat' | 'none' | 'floating';
  intent:    ButtonIntent;
  contrast:  ButtonContrast;
  size:      'xs' | 'sm' | 'md' | 'lg';
  rounded:   boolean;
  showIcon:  boolean;
}

const meta: Meta<typeof ButtonGroup> = {
  title: 'Primitives (Reviewed)/ButtonGroup',
  component: ButtonGroup,
  args: {
    variant:   'primary',
    elevation: 'elevated',
    intent:    'brand',
    contrast:  'bold',
    size:      'md',
    rounded:   false,
    showIcon:  false,
  } as PlaygroundArgs,
  argTypes: {
    variant:   { control: 'select', options: ['primary', 'secondary'] },
    elevation: { control: 'select', options: ['elevated', 'flat', 'none', 'floating'] },
    intent:    { control: 'select', options: ['none', 'neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'] },
    contrast:  { control: 'select', options: ['strong', 'bold', 'medium', 'faint'] },
    size:      { control: 'select', options: ['lg', 'md', 'sm', 'xs'] },
    rounded:   { control: 'boolean' },
    showIcon:  { control: 'boolean' },
  } as Record<string, unknown>,
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

// ─── Shared layout helpers ────────────────────────────────────────────────────

const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' };
const row: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'center' };
const lbl: React.CSSProperties = { fontSize: 10, fontFamily: 'monospace', color: '#888', minWidth: 120, flexShrink: 0 };
const section = (text: string) => (
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#555', marginTop: 4 }}>
    {text}
  </div>
);
const divider = <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '4px 0 12px' }} />;

// ─── Playground ──────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const a = args as unknown as PlaygroundArgs;
    const labels = ['First', 'Second', 'Third'];
    return (
      <ButtonGroup>
        {labels.map(label => (
          <Button
            key={label}
            variant={a.variant}
            elevation={a.elevation}
            intent={a.intent}
            contrast={a.contrast}
            size={a.size}
            rounded={a.rounded}
            icon={a.showIcon ? PlaceholderIcon : undefined}
            label={label}
          />
        ))}
      </ButtonGroup>
    );
  },
};

// ─── Matrix ───────────────────────────────────────────────────────────────────

export const Matrix: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ ...col, fontFamily: 'sans-serif', gap: 0 }}>

      {/* ── Variants & elevation ── */}
      {section('Elevation — full-height vs short divider')}
      {divider}
      <div style={col}>
        <div style={row}>
          <span style={lbl}>secondary / flat</span>
          <ButtonGroup>
            <Button variant="secondary" elevation="flat" label="Day" />
            <Button variant="secondary" elevation="flat" label="Week" />
            <Button variant="secondary" elevation="flat" label="Month" />
          </ButtonGroup>
        </div>
        <div style={row}>
          <span style={lbl}>secondary / elevated</span>
          <ButtonGroup>
            <Button variant="secondary" elevation="elevated" label="Day" />
            <Button variant="secondary" elevation="elevated" label="Week" />
            <Button variant="secondary" elevation="elevated" label="Month" />
          </ButtonGroup>
        </div>
        <div style={row}>
          <span style={lbl}>primary / none intent</span>
          <ButtonGroup>
            <Button variant="primary" intent="none" label="Day" />
            <Button variant="primary" intent="none" label="Week" />
            <Button variant="primary" intent="none" label="Month" />
          </ButtonGroup>
        </div>
        <div style={row}>
          <span style={lbl}>secondary / none ↓ short</span>
          <ButtonGroup>
            <Button variant="secondary" elevation="none" label="Day" />
            <Button variant="secondary" elevation="none" label="Week" />
            <Button variant="secondary" elevation="none" label="Month" />
          </ButtonGroup>
        </div>
      </div>

      {/* ── Ghost: short divider at each size ── */}
      {section('Ghost (elevation=none) — short divider scales with size')}
      {divider}
      <div style={col}>
        {(['lg', 'md', 'sm', 'xs'] as const).map(size => (
          <div key={size} style={row}>
            <span style={lbl}>{size}</span>
            <ButtonGroup>
              <Button variant="secondary" elevation="none" size={size} label="One" />
              <Button variant="secondary" elevation="none" size={size} label="Two" />
              <Button variant="secondary" elevation="none" size={size} label="Three" />
            </ButtonGroup>
          </div>
        ))}
      </div>

      {/* ── Primary intents ── */}
      {section('Primary — homogeneous intent + contrast (on-bg divider)')}
      {divider}
      <div style={col}>
        {([
          { intent: 'brand',    contrast: 'bold'   },
          { intent: 'negative', contrast: 'bold'   },
          { intent: 'positive', contrast: 'bold'   },
          { intent: 'brand',    contrast: 'medium' },
          { intent: 'brand',    contrast: 'faint'  },
        ] as { intent: ButtonIntent; contrast: ButtonContrast }[]).map(({ intent, contrast }) => (
          <div key={`${intent}-${contrast}`} style={row}>
            <span style={lbl}>{intent} / {contrast}</span>
            <ButtonGroup>
              <Button variant="primary" intent={intent} contrast={contrast} label="Save" />
              <Button variant="primary" intent={intent} contrast={contrast} label="Copy" />
              <Button variant="primary" intent={intent} contrast={contrast} label="Export" />
            </ButtonGroup>
          </div>
        ))}
      </div>

      {/* ── Sizes ── */}
      {section('Sizes — secondary / flat')}
      {divider}
      <div style={col}>
        {(['lg', 'md', 'sm', 'xs'] as const).map(size => (
          <div key={size} style={row}>
            <span style={lbl}>{size}</span>
            <ButtonGroup>
              <Button variant="secondary" size={size} label="One" />
              <Button variant="secondary" size={size} label="Two" />
              <Button variant="secondary" size={size} label="Three" />
            </ButtonGroup>
          </div>
        ))}
      </div>

      {/* ── With Icons ── */}
      {section('With Icons')}
      {divider}
      <div style={col}>
        <div style={row}>
          <span style={lbl}>icon + label</span>
          <ButtonGroup>
            <Button variant="secondary" icon={PlaceholderIcon} label="Grid" />
            <Button variant="secondary" icon={PlaceholderIcon} label="List" />
            <Button variant="secondary" icon={PlaceholderIcon} label="Table" />
          </ButtonGroup>
        </div>
        <div style={row}>
          <span style={lbl}>icon only</span>
          <ButtonGroup>
            <Button variant="secondary" icon={PlaceholderIcon} aria-label="Grid" />
            <Button variant="secondary" icon={PlaceholderIcon} aria-label="List" />
            <Button variant="secondary" icon={PlaceholderIcon} aria-label="Table" />
          </ButtonGroup>
        </div>
        <div style={row}>
          <span style={lbl}>ghost icon</span>
          <ButtonGroup>
            <Button variant="secondary" elevation="none" icon={PlaceholderIcon} aria-label="Grid" />
            <Button variant="secondary" elevation="none" icon={PlaceholderIcon} aria-label="List" />
            <Button variant="secondary" elevation="none" icon={PlaceholderIcon} aria-label="Table" />
          </ButtonGroup>
        </div>
      </div>

      {/* ── Rounded ── */}
      {section('Rounded — outer pill padding, inner base padding')}
      {divider}
      <div style={col}>
        <div style={row}>
          <span style={lbl}>secondary / flat</span>
          <ButtonGroup>
            <Button variant="secondary" label="Day" rounded />
            <Button variant="secondary" label="Week" rounded />
            <Button variant="secondary" label="Month" rounded />
          </ButtonGroup>
        </div>
        <div style={row}>
          <span style={lbl}>ghost</span>
          <ButtonGroup>
            <Button variant="secondary" elevation="none" label="Day" rounded />
            <Button variant="secondary" elevation="none" label="Week" rounded />
            <Button variant="secondary" elevation="none" label="Month" rounded />
          </ButtonGroup>
        </div>
        <div style={row}>
          <span style={lbl}>icon + label</span>
          <ButtonGroup>
            <Button variant="secondary" icon={PlaceholderIcon} label="Grid" rounded />
            <Button variant="secondary" icon={PlaceholderIcon} label="List" rounded />
            <Button variant="secondary" icon={PlaceholderIcon} label="Table" rounded />
          </ButtonGroup>
        </div>
        <div style={row}>
          <span style={lbl}>icon only</span>
          <ButtonGroup>
            <Button variant="secondary" icon={PlaceholderIcon} rounded aria-label="Grid" />
            <Button variant="secondary" icon={PlaceholderIcon} rounded aria-label="List" />
            <Button variant="secondary" icon={PlaceholderIcon} rounded aria-label="Table" />
          </ButtonGroup>
        </div>
        {(['lg', 'md', 'sm'] as const).map(size => (
          <div key={size} style={row}>
            <span style={lbl}>rounded {size}</span>
            <ButtonGroup>
              <Button variant="secondary" size={size} label="One" rounded />
              <Button variant="secondary" size={size} label="Two" rounded />
              <Button variant="secondary" size={size} label="Three" rounded />
            </ButtonGroup>
          </div>
        ))}
      </div>

      {/* ── States ── */}
      {section('States')}
      {divider}
      <div style={col}>
        <div style={row}>
          <span style={lbl}>with inactive</span>
          <ButtonGroup>
            <Button variant="secondary" label="One" />
            <Button variant="secondary" label="Two" inactive />
            <Button variant="secondary" label="Three" />
          </ButtonGroup>
        </div>
        <div style={row}>
          <span style={lbl}>two items</span>
          <ButtonGroup>
            <Button variant="secondary" label="Left" />
            <Button variant="secondary" label="Right" />
          </ButtonGroup>
        </div>
      </div>

    </div>
  ),
};

// ─── Individual stories ───────────────────────────────────────────────────────

export const Secondary: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="secondary" label="Day" />
      <Button variant="secondary" label="Week" />
      <Button variant="secondary" label="Month" />
    </ButtonGroup>
  ),
};

export const Ghost: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      {(['lg', 'md', 'sm', 'xs'] as const).map(size => (
        <ButtonGroup key={size}>
          <Button variant="secondary" elevation="none" size={size} label="Grid" />
          <Button variant="secondary" elevation="none" size={size} label="List" />
          <Button variant="secondary" elevation="none" size={size} label="Table" />
        </ButtonGroup>
      ))}
    </div>
  ),
};

export const PrimaryIntents: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <ButtonGroup>
        <Button variant="primary" intent="brand" label="Save" />
        <Button variant="primary" intent="brand" label="Duplicate" />
        <Button variant="primary" intent="brand" label="Export" />
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="primary" intent="negative" label="Delete" />
        <Button variant="primary" intent="negative" label="Archive" />
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="primary" intent="brand" contrast="medium" label="Save" />
        <Button variant="primary" intent="brand" contrast="medium" label="Duplicate" />
        <Button variant="primary" intent="brand" contrast="medium" label="Export" />
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="primary" intent="brand" contrast="faint" label="Save" />
        <Button variant="primary" intent="brand" contrast="faint" label="Duplicate" />
        <Button variant="primary" intent="brand" contrast="faint" label="Export" />
      </ButtonGroup>
    </div>
  ),
};

export const Rounded: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <ButtonGroup>
        <Button variant="secondary" label="Day" rounded />
        <Button variant="secondary" label="Week" rounded />
        <Button variant="secondary" label="Month" rounded />
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="secondary" elevation="none" label="Day" rounded />
        <Button variant="secondary" elevation="none" label="Week" rounded />
        <Button variant="secondary" elevation="none" label="Month" rounded />
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="secondary" icon={PlaceholderIcon} label="Grid" rounded />
        <Button variant="secondary" icon={PlaceholderIcon} label="List" rounded />
        <Button variant="secondary" icon={PlaceholderIcon} label="Table" rounded />
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="secondary" icon={PlaceholderIcon} rounded aria-label="Grid" />
        <Button variant="secondary" icon={PlaceholderIcon} rounded aria-label="List" />
        <Button variant="secondary" icon={PlaceholderIcon} rounded aria-label="Table" />
      </ButtonGroup>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <ButtonGroup>
        <Button variant="secondary" icon={PlaceholderIcon} aria-label="Grid view" />
        <Button variant="secondary" icon={PlaceholderIcon} aria-label="List view" />
        <Button variant="secondary" icon={PlaceholderIcon} aria-label="Table view" />
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="secondary" elevation="none" icon={PlaceholderIcon} aria-label="Grid view" />
        <Button variant="secondary" elevation="none" icon={PlaceholderIcon} aria-label="List view" />
        <Button variant="secondary" elevation="none" icon={PlaceholderIcon} aria-label="Table view" />
      </ButtonGroup>
    </div>
  ),
};

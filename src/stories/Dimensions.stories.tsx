import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Design System/Dimensions',
  parameters: { layout: 'fullscreen' },
};

export default meta;

// ── Helpers ──────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: 'var(--typography-font-family, system-ui)', padding: 24, display: 'flex', flexDirection: 'column', gap: 40 },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  heading: { fontSize: 18, fontWeight: 600, color: 'var(--color-foreground-primary)', margin: 0, letterSpacing: -0.3 },
  subheading: { fontSize: 13, fontWeight: 500, color: 'var(--color-foreground-secondary)', margin: 0 },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' },
  label: { fontSize: 11, color: 'var(--color-foreground-secondary)', minWidth: 140, flexShrink: 0, fontFamily: 'monospace' },
};

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={S.section}>
      <div>
        <h2 style={S.heading}>{title}</h2>
        {subtitle && <p style={{ ...S.subheading, marginTop: 2 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Stories ───────────────────────────────────────────────────────────────────

const SPACE_TOKENS = ['000', '012', '025', '050', '075', '100', '125', '150', '175', '200', '250', '300', '400', '600', '800'] as const;

function Spacing() {
  return (
    <div style={S.page}>
      <Section title="Spacing" subtitle="--dimension-space-* (base: 8px)">
        {SPACE_TOKENS.map(token => (
          <div key={token} style={S.row}>
            <span style={S.label}>space-{token}</span>
            <div style={{
              width: `var(--dimension-space-${token})`,
              height: 20,
              backgroundColor: 'var(--color-background-bold-brand)',
              borderRadius: 2,
              minWidth: token === '000' ? 0 : 1,
              transition: 'width 0.2s',
            }} />
          </div>
        ))}
      </Section>
    </div>
  );
}

const SIZE_TOKENS = ['000', '050', '100', '150', '200', '250', '300', '400', '500', '600', '800'] as const;

function Sizes() {
  return (
    <div style={S.page}>
      <Section title="Size" subtitle="--dimension-size-* — element width/height (base: 8px)">
        {SIZE_TOKENS.map(token => (
          <div key={token} style={S.row}>
            <span style={S.label}>size-{token}</span>
            <div style={{
              width: `var(--dimension-size-${token})`,
              height: `var(--dimension-size-${token})`,
              backgroundColor: 'var(--color-background-faint-brand)',
              border: '1px solid var(--color-border-brand)',
              borderRadius: 4,
              minWidth: token === '000' ? 0 : 1,
              minHeight: token === '000' ? 0 : 1,
            }} />
          </div>
        ))}
      </Section>

      <Section title="Iconography Sizes" subtitle="--dimension-iconography-* — semantic icon size aliases">
        {['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map(token => (
          <div key={token} style={S.row}>
            <span style={S.label}>iconography-{token}</span>
            <div style={{
              width: `var(--dimension-iconography-${token})`,
              height: `var(--dimension-iconography-${token})`,
              backgroundColor: 'var(--color-foreground-secondary)',
              borderRadius: 'var(--dimension-radius-050)',
            }} />
          </div>
        ))}
      </Section>
    </div>
  );
}

const RADIUS_TOKENS = ['000', '012', '025', '037', '050', '075', '100', '125', '150', '175', '200', '250', '275', '300', '400', '600', 'half'] as const;

function Radii() {
  return (
    <div style={S.page}>
      <Section title="Border Radius" subtitle="--dimension-radius-* (base: 8px, half: 9999px)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {RADIUS_TOKENS.map(token => (
            <div key={token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 64,
                height: 64,
                backgroundColor: 'var(--color-background-bold-brand)',
                borderRadius: `var(--dimension-radius-${token})`,
              }} />
              <span style={{ fontSize: 11, color: 'var(--color-foreground-secondary)', fontFamily: 'monospace' }}>
                radius-{token}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const STROKE_TOKENS = ['012', '015', '018', '025', '037', '050'] as const;

function Strokes() {
  return (
    <div style={S.page}>
      <Section title="Stroke Widths" subtitle="--dimension-stroke-width-*">
        {STROKE_TOKENS.map(token => (
          <div key={token} style={S.row}>
            <span style={S.label}>stroke-width-{token}</span>
            <div style={{
              width: 200,
              height: 0,
              borderTop: `var(--dimension-stroke-width-${token}) solid var(--color-foreground-primary)`,
            }} />
          </div>
        ))}
      </Section>

      <Section title="Z-Index Layers" subtitle="--dimension-z-index-*">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { token: 'base', value: '0' },
            { token: 'raised', value: '50' },
            { token: 'overlay', value: '250' },
            { token: 'modal', value: '450' },
            { token: 'floating', value: '500' },
            { token: 'tooltip', value: '750' },
          ].map(z => (
            <div key={z.token} style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-background-faint-neutral)',
              border: '1px solid var(--color-border-tertiary)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-foreground-primary)' }}>{z.value}</div>
              <div style={{ fontSize: 11, color: 'var(--color-foreground-secondary)', marginTop: 4 }}>z-index-{z.token}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Component Widths" subtitle="Cards, modals, forms, menus, panels">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          {[
            { group: 'card-width', tokens: ['sm', 'md', 'lg'], values: ['400', '600', '800'] },
            { group: 'modal-width', tokens: ['sm', 'md', 'lg'], values: ['400', '600', '800'] },
            { group: 'menu-width', tokens: ['sm', 'md', 'lg'], values: ['200', '400', '600'] },
            { group: 'panel-width', tokens: ['xs', 'sm', 'md', 'lg', 'xl'], values: ['200', '300', '400', '500', '600'] },
          ].map(group => (
            <div key={group.group} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-foreground-secondary)' }}>{group.group}</span>
              {group.tokens.map((token, i) => (
                <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...S.label, minWidth: 80 }}>{token}</span>
                  <div style={{
                    width: `min(var(--dimension-${group.group}-${token}), 100%)`,
                    height: 16,
                    backgroundColor: 'var(--color-background-medium-brand)',
                    borderRadius: 2,
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--color-foreground-tertiary)' }}>{group.values[i]}px</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export const SpacingStory: StoryObj = { name: 'Spacing', render: () => <Spacing /> };
export const SizesStory: StoryObj = { name: 'Sizes', render: () => <Sizes /> };
export const RadiiStory: StoryObj = { name: 'Radii', render: () => <Radii /> };
export const StrokesAndMore: StoryObj = { name: 'Strokes & Layers', render: () => <Strokes /> };

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Design System/Typography',
  parameters: { layout: 'fullscreen' },
};

export default meta;

// ── Helpers ──────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: 'var(--typography-font-family, system-ui)', padding: 24, display: 'flex', flexDirection: 'column', gap: 40 },
  section: { display: 'flex', flexDirection: 'column', gap: 16 },
  heading: { fontSize: 18, fontWeight: 600, color: 'var(--color-foreground-primary)', margin: 0, letterSpacing: -0.3 },
  subheading: { fontSize: 13, fontWeight: 500, color: 'var(--color-foreground-secondary)', margin: 0 },
  row: { display: 'flex', alignItems: 'baseline', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--color-border-tertiary)' },
  label: { fontSize: 12, color: 'var(--color-foreground-secondary)', minWidth: 200, flexShrink: 0 },
  value: { fontSize: 11, color: 'var(--color-foreground-tertiary)', minWidth: 100, flexShrink: 0, fontFamily: 'monospace' },
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

const TEXT_STYLES = [
  { name: 'Display Medium', class: 'text-display-medium', desc: '44/64 bold' },
  { name: 'Display Small', class: 'text-display-small', desc: '32/48 bold' },
  { name: 'Title Large', class: 'text-title-large', desc: '24/32 semibold' },
  { name: 'Title Medium', class: 'text-title-medium', desc: '18/24 semibold' },
  { name: 'Title Small', class: 'text-title-small', desc: '14/20 semibold' },
  { name: 'Body Large', class: 'text-body-large', desc: '18/24 regular' },
  { name: 'Body Large Emphasis', class: 'text-body-large-emphasis', desc: '18/24 medium' },
  { name: 'Body Medium', class: 'text-body-medium', desc: '14/20 regular' },
  { name: 'Body Medium Emphasis', class: 'text-body-medium-emphasis', desc: '14/20 medium' },
  { name: 'Body Small', class: 'text-body-small', desc: '12/16 regular' },
  { name: 'Body Small Emphasis', class: 'text-body-small-emphasis', desc: '12/16 medium' },
  { name: 'Caption', class: 'text-caption', desc: '9/12 medium uppercase' },
  { name: 'Caption Emphasis', class: 'text-caption-emphasis', desc: '9/12 semibold uppercase' },
] as const;

function TextStyles() {
  return (
    <div style={S.page}>
      <Section title="Text Styles" subtitle="Composite text style classes from TokoMo">
        {TEXT_STYLES.map(style => (
          <div key={style.class} style={S.row}>
            <span style={S.label}>{style.name}</span>
            <span style={S.value}>{style.desc}</span>
            <span className={style.class} style={{ color: 'var(--color-foreground-primary)', flex: 1 }}>
              The quick brown fox jumps over the lazy dog
            </span>
          </div>
        ))}
      </Section>
    </div>
  );
}

const SIZES = [
  { token: 'xs', px: '9px' },
  { token: 'sm', px: '12px' },
  { token: 'md', px: '14px' },
  { token: 'lg', px: '18px' },
  { token: 'xl', px: '24px' },
  { token: '2xl', px: '32px' },
  { token: '3xl', px: '44px' },
] as const;

const WEIGHTS = [
  { token: 'regular', value: '400' },
  { token: 'medium', value: '500' },
  { token: 'semibold', value: '600' },
  { token: 'bold', value: '700' },
] as const;

function Primitives() {
  return (
    <div style={S.page}>
      <Section title="Font Sizes" subtitle="--typography-fontsize-*">
        {SIZES.map(s => (
          <div key={s.token} style={{ ...S.row, alignItems: 'center' }}>
            <span style={S.label}>fontsize-{s.token}</span>
            <span style={S.value}>{s.px}</span>
            <span style={{ fontSize: `var(--typography-fontsize-${s.token})`, lineHeight: 1.4, color: 'var(--color-foreground-primary)' }}>
              Aa Bb Cc 123
            </span>
          </div>
        ))}
      </Section>

      <Section title="Font Weights" subtitle="--typography-weight-*">
        {WEIGHTS.map(w => (
          <div key={w.token} style={S.row}>
            <span style={S.label}>weight-{w.token}</span>
            <span style={S.value}>{w.value}</span>
            <span style={{ fontWeight: `var(--typography-weight-${w.token})` as never, fontSize: 18, color: 'var(--color-foreground-primary)' }}>
              The quick brown fox
            </span>
          </div>
        ))}
      </Section>

      <Section title="Line Heights" subtitle="--typography-lineheight-*">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {SIZES.map(s => (
            <div key={s.token} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{
                fontSize: `var(--typography-fontsize-${s.token})`,
                lineHeight: `var(--typography-lineheight-${s.token})`,
                backgroundColor: 'var(--color-background-faint-brand)',
                color: 'var(--color-foreground-primary)',
                padding: '0 8px',
                borderRadius: 4,
              }}>
                Aa Bb Cc
              </div>
              <span style={S.label}>lineheight-{s.token}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Letter Spacing" subtitle="--typography-letterspacing-*">
        {[
          { token: 'positive', value: '0.3px' },
          { token: 'none', value: '0px' },
          { token: 'negative-half', value: '-0.15px' },
          { token: 'negative', value: '-0.3px' },
          { token: 'negative-double', value: '-0.6px' },
        ].map(ls => (
          <div key={ls.token} style={S.row}>
            <span style={S.label}>letterspacing-{ls.token}</span>
            <span style={S.value}>{ls.value}</span>
            <span style={{ letterSpacing: `var(--typography-letterspacing-${ls.token})`, fontSize: 18, color: 'var(--color-foreground-primary)' }}>
              LETTER SPACING EXAMPLE
            </span>
          </div>
        ))}
      </Section>
    </div>
  );
}

export const Styles: StoryObj = { name: 'Text Styles', render: () => <TextStyles /> };
export const PrimitiveTokens: StoryObj = { name: 'Primitives', render: () => <Primitives /> };

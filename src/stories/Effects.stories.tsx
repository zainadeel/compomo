import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Design System/Effects',
  parameters: { layout: 'fullscreen' },
};

export default meta;

// ── Helpers ──────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: 'var(--typography-font-family, system-ui)', padding: 24, display: 'flex', flexDirection: 'column', gap: 40 },
  section: { display: 'flex', flexDirection: 'column', gap: 16 },
  heading: { fontSize: 18, fontWeight: 600, color: 'var(--color-foreground-primary)', margin: 0, letterSpacing: -0.3 },
  subheading: { fontSize: 13, fontWeight: 500, color: 'var(--color-foreground-secondary)', margin: 0 },
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

const ELEVATION_LEVELS = [
  { token: 'elevated-none', label: 'None' },
  { token: 'depressed-sm', label: 'Depressed SM' },
  { token: 'depressed-md', label: 'Depressed MD' },
  { token: 'elevated-sm', label: 'Elevated SM' },
  { token: 'elevated-md', label: 'Elevated MD' },
  { token: 'elevated-floating', label: 'Floating' },
] as const;

const PANEL_LEVELS = [
  { token: 'elevated-panel-top', label: 'Panel Top' },
  { token: 'elevated-panel-right', label: 'Panel Right' },
  { token: 'elevated-panel-bottom', label: 'Panel Bottom' },
  { token: 'elevated-panel-left', label: 'Panel Left' },
] as const;

function Elevation() {
  return (
    <div style={S.page}>
      <Section title="Elevation" subtitle="--effect-elevation-* — combined shadow + highlight">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24, padding: 24 }}>
          {ELEVATION_LEVELS.map(level => (
            <div key={level.token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 120,
                height: 80,
                backgroundColor: 'var(--color-background-primary)',
                borderRadius: 8,
                boxShadow: `var(--effect-elevation-${level.token})`,
              }} />
              <span style={{ fontSize: 11, color: 'var(--color-foreground-secondary)', fontFamily: 'monospace' }}>
                {level.label}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Panel Shadows" subtitle="Directional shadows for attached panels">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24, padding: 24 }}>
          {PANEL_LEVELS.map(level => (
            <div key={level.token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 120,
                height: 80,
                backgroundColor: 'var(--color-background-primary)',
                borderRadius: 8,
                boxShadow: `var(--effect-elevation-${level.token})`,
              }} />
              <span style={{ fontSize: 11, color: 'var(--color-foreground-secondary)', fontFamily: 'monospace' }}>
                {level.label}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const DURATION_TOKENS = [
  { token: 'instant', ms: '0' },
  { token: 'short-1', ms: '50' },
  { token: 'short-2', ms: '100' },
  { token: 'short-3', ms: '200' },
  { token: 'medium-1', ms: '300' },
  { token: 'medium-2', ms: '400' },
  { token: 'medium-3', ms: '500' },
  { token: 'long-1', ms: '750' },
  { token: 'long-2', ms: '1000' },
  { token: 'long-3', ms: '2000' },
] as const;

function MotionDemo({ token, ms }: { token: string; ms: string }) {
  const [active, setActive] = React.useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <span style={{ fontSize: 11, color: 'var(--color-foreground-secondary)', minWidth: 100, fontFamily: 'monospace' }}>
        {token}
      </span>
      <span style={{ fontSize: 10, color: 'var(--color-foreground-tertiary)', minWidth: 50 }}>{ms}ms</span>
      <div
        style={{
          width: 200,
          height: 24,
          backgroundColor: 'var(--color-background-faint-neutral)',
          borderRadius: 12,
          position: 'relative',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: active ? 'calc(100% - 22px)' : '2px',
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: 'var(--color-background-bold-brand)',
          transition: `left var(--effect-motion-${token})`,
        }} />
      </div>
    </div>
  );
}

function EasingDemo({ token, bezier }: { token: string; bezier: string }) {
  const [active, setActive] = React.useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <span style={{ fontSize: 11, color: 'var(--color-foreground-secondary)', minWidth: 140, fontFamily: 'monospace' }}>
        {token}
      </span>
      <span style={{ fontSize: 10, color: 'var(--color-foreground-tertiary)', minWidth: 160, fontFamily: 'monospace' }}>
        cubic-bezier({bezier})
      </span>
      <div
        style={{
          width: 200,
          height: 24,
          backgroundColor: 'var(--color-background-faint-neutral)',
          borderRadius: 12,
          position: 'relative',
          cursor: 'pointer',
        }}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
      >
        <div style={{
          position: 'absolute',
          top: 2,
          left: active ? 'calc(100% - 22px)' : '2px',
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: 'var(--color-background-bold-positive)',
          transition: `left var(--effect-motion-medium-2) var(--effect-animation-easing-${token})`,
        }} />
      </div>
    </div>
  );
}

function Motion() {
  return (
    <div style={S.page}>
      <Section title="Motion Presets" subtitle="--effect-motion-* — hover to animate">
        {DURATION_TOKENS.map(d => (
          <MotionDemo key={d.token} token={d.token} ms={d.ms} />
        ))}
      </Section>

      <Section title="Easing Curves" subtitle="--effect-animation-easing-* — hover to compare curves (all use 400ms duration)">
        {[
          { token: 'ease-in', bezier: '0.47, 0, 0.75, 0.72' },
          { token: 'ease-out', bezier: '0.17, 0.84, 0.44, 1' },
          { token: 'ease-in-out', bezier: '0.77, 0, 0.18, 1' },
          { token: 'ease-in-out-back', bezier: '0.22, 0.61, 0.01, 1.03' },
        ].map(easing => (
          <EasingDemo key={easing.token} token={easing.token} bezier={easing.bezier} />
        ))}
      </Section>

      <Section title="Blur" subtitle="--effect-blur-*">
        <div style={{ display: 'flex', gap: 24 }}>
          {['sm', 'md', 'lg'].map(size => (
            <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 120,
                height: 80,
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(135deg, var(--color-background-bold-brand), var(--color-background-bold-negative))',
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backdropFilter: `blur(var(--effect-blur-${size}))`,
                  WebkitBackdropFilter: `blur(var(--effect-blur-${size}))`,
                  backgroundColor: 'var(--color-background-translucent)',
                }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-foreground-secondary)', fontFamily: 'monospace' }}>
                blur-{size}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export const ElevationStory: StoryObj = { name: 'Elevation', render: () => <Elevation /> };
export const MotionStory: StoryObj = { name: 'Motion & Blur', render: () => <Motion /> };

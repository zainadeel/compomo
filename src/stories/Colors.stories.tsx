import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

const meta: Meta = {
  title: 'Design System/Colors',
  parameters: { layout: 'fullscreen' },
};

export default meta;

// ── Helpers ──────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: 'var(--typography-font-family, system-ui)', padding: 24, display: 'flex', flexDirection: 'column', gap: 40 },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  heading: { fontSize: 18, fontWeight: 600, color: 'var(--color-foreground-primary)', margin: 0, letterSpacing: -0.3 },
  subheading: { fontSize: 13, fontWeight: 500, color: 'var(--color-foreground-secondary)', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 },
  wideGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 },
  swatch: { display: 'flex', flexDirection: 'column', gap: 4 },
  color: { width: '100%', height: 48, borderRadius: 6, border: '1px solid var(--color-border-tertiary)' },
  colorWide: { width: '100%', height: 32, borderRadius: 6, border: '1px solid var(--color-border-tertiary)' },
  label: { fontSize: 10, lineHeight: 1.3, color: 'var(--color-foreground-secondary)', wordBreak: 'break-all' as const },
};

const INTENTS = ['brand', 'neutral', 'positive', 'negative', 'warning', 'caution', 'ai', 'guide', 'walkthrough'] as const;
const CONTRASTS = ['faint', 'medium', 'bold', 'strong'] as const;

function Swatch({ token, label, style }: { token: string; label?: string; style?: React.CSSProperties }) {
  return (
    <div style={S.swatch}>
      <div style={{ ...S.color, backgroundColor: `var(--${token})`, ...style }} title={`--${token}`} />
      <span style={S.label}>{label || token.replace('color-', '')}</span>
    </div>
  );
}

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

function BackgroundColors() {
  return (
    <div style={S.page}>
      <Section title="Background — Surface" subtitle="Primary, secondary, shade, translucent">
        <div style={S.grid}>
          <Swatch token="color-background-primary" />
          <Swatch token="color-background-secondary" />
          <Swatch token="color-background-shade" />
          <Swatch token="color-background-translucent" style={{ backdropFilter: 'blur(16px)' }} />
          <Swatch token="color-background-transparent" style={{ background: 'repeating-conic-gradient(#f0f0f0 0% 25%, transparent 0% 50%) 0 0 / 12px 12px' }} />
        </div>
      </Section>

      {CONTRASTS.map(contrast => (
        <Section key={contrast} title={`Background — ${contrast.charAt(0).toUpperCase() + contrast.slice(1)}`}>
          <div style={S.grid}>
            {INTENTS.map(intent => (
              <Swatch key={intent} token={`color-background-${contrast}-${intent}`} label={intent} />
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

function ForegroundColors() {
  return (
    <div style={S.page}>
      <Section title="Foreground — Base" subtitle="Neutral hierarchy">
        <div style={S.grid}>
          {['primary', 'secondary', 'tertiary', 'quaternary'].map(level => (
            <div key={level} style={S.swatch}>
              <div style={{ ...S.color, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background-primary)' }}>
                <span style={{ color: `var(--color-foreground-${level})`, fontWeight: 600, fontSize: 14 }}>Aa</span>
              </div>
              <span style={S.label}>foreground-{level}</span>
            </div>
          ))}
        </div>
      </Section>

      {CONTRASTS.map(contrast => (
        <Section key={contrast} title={`Foreground — ${contrast.charAt(0).toUpperCase() + contrast.slice(1)}`}>
          <div style={S.grid}>
            {INTENTS.map(intent => (
              <div key={intent} style={S.swatch}>
                <div style={{ ...S.color, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor:
                  contrast === 'faint' ? 'var(--color-background-primary)'
                  : contrast === 'medium' ? `var(--color-background-strong-${intent})`
                  : contrast === 'bold' ? `var(--color-background-faint-${intent})`
                  : contrast === 'strong' ? `var(--color-background-medium-${intent})`
                  : `var(--color-background-${contrast}-${intent})`
                }}>
                  <span style={{ color: `var(--color-foreground-${contrast}-${intent})`, fontWeight: 600, fontSize: 16 }}>Aa</span>
                </div>
                <span style={S.label}>{intent}</span>
              </div>
            ))}
          </div>
        </Section>
      ))}

      <Section title="Foreground — On Background" subtitle="Tokens for text on colored surfaces">
        {['on-bold-background', 'on-strong-background', 'on-medium-background', 'on-translucent-background'].map(ctx => (
          <div key={ctx} style={{ marginBottom: 16 }}>
            <p style={{ ...S.subheading, marginBottom: 8 }}>{ctx}</p>
            <div style={S.grid}>
              {['primary', 'secondary', 'tertiary', 'quaternary'].map(level => {
                const bg = ctx === 'on-bold-background' ? 'var(--color-background-bold-brand)'
                  : ctx === 'on-strong-background' ? 'var(--color-background-strong-brand)'
                  : ctx === 'on-medium-background' ? 'var(--color-background-medium-brand)'
                  : 'var(--color-background-translucent)';
                return (
                  <div key={level} style={S.swatch}>
                    <div style={{ ...S.color, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bg }}>
                      <span style={{ color: `var(--color-foreground-${ctx}-${level})`, fontWeight: 600, fontSize: 16 }}>Aa</span>
                    </div>
                    <span style={S.label}>{level}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}

function BorderColors() {
  return (
    <div style={S.page}>
      <Section title="Border — Base" subtitle="Neutral hierarchy">
        <div style={S.grid}>
          {['primary', 'secondary', 'tertiary'].map(level => (
            <div key={level} style={S.swatch}>
              <div style={{ ...S.color, backgroundColor: 'var(--color-background-primary)', border: `3px solid var(--color-border-${level})` }} />
              <span style={S.label}>border-{level}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Border — Intent">
        <div style={S.grid}>
          {INTENTS.filter(i => i !== 'guide' && i !== 'walkthrough').map(intent => (
            <div key={intent} style={S.swatch}>
              <div style={{ ...S.color, backgroundColor: 'var(--color-background-primary)', border: `3px solid var(--color-border-${intent})` }} />
              <span style={S.label}>{intent}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Border — On Background" subtitle="Context-aware border hierarchy">
        {['on-bold-background', 'on-strong-background', 'on-medium-background', 'on-translucent-background'].map(ctx => {
          const bg = ctx === 'on-bold-background' ? 'var(--color-background-bold-neutral)'
            : ctx === 'on-strong-background' ? 'var(--color-background-strong-neutral)'
            : ctx === 'on-medium-background' ? 'var(--color-background-medium-neutral)'
            : 'var(--color-background-translucent)';
          return (
            <div key={ctx} style={{ marginBottom: 16 }}>
              <p style={{ ...S.subheading, marginBottom: 8 }}>{ctx}</p>
              <div style={S.grid}>
                {['primary', 'secondary', 'tertiary'].map(level => (
                  <div key={level} style={S.swatch}>
                    <div style={{ ...S.color, backgroundColor: bg, border: `3px solid var(--color-border-${ctx}-${level})` }} />
                    <span style={S.label}>{level}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

function InteractionColors() {
  return (
    <div style={S.page}>
      <Section title="Interaction — Default" subtitle="Hover, pressed, focus on standard surfaces">
        <div style={S.grid}>
          {['hover', 'pressed', 'focus'].map(state => (
            <Swatch key={state} token={`color-interaction-${state}`} label={state} />
          ))}
        </div>
      </Section>

      {['on-bold-background', 'on-strong-background', 'on-medium-background', 'on-translucent-background'].map(ctx => {
        const bg = ctx === 'on-bold-background' ? 'var(--color-background-bold-brand)'
          : ctx === 'on-strong-background' ? 'var(--color-background-strong-brand)'
          : ctx === 'on-medium-background' ? 'var(--color-background-medium-brand)'
          : 'var(--color-background-translucent)';
        return (
          <Section key={ctx} title={`Interaction — ${ctx}`}>
            <div style={S.grid}>
              {['hover', 'pressed', 'focus'].map(state => (
                <div key={state} style={S.swatch}>
                  <div style={{ ...S.color, position: 'relative', backgroundColor: bg, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: `var(--color-interaction-${ctx}-${state})` }} />
                  </div>
                  <span style={S.label}>{state}</span>
                </div>
              ))}
            </div>
          </Section>
        );
      })}

      <Section title="Always Dark — Interaction" subtitle="For always-dark surfaces">
        <div style={{ ...S.grid }}>
          {['hover', 'pressed', 'focus'].map(state => (
            <div key={state} style={S.swatch}>
              <div style={{ ...S.color, position: 'relative', backgroundColor: 'var(--color-always-dark-background)', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundColor: `var(--color-always-dark-interaction-${state})` }} />
              </div>
              <span style={S.label}>{state}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AlwaysDarkColors() {
  return (
    <div style={S.page}>
      <Section title="Always Dark" subtitle="Tokens that stay dark regardless of theme">
        <div style={{ backgroundColor: 'var(--color-always-dark-background)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-always-dark-foreground-secondary)', margin: '0 0 8px' }}>Foreground</p>
            <div style={S.grid}>
              {['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'].map(level => (
                <div key={level} style={S.swatch}>
                  <div style={{ ...S.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                    <span style={{ color: `var(--color-always-dark-foreground-${level})`, fontWeight: 600, fontSize: 16 }}>Aa</span>
                  </div>
                  <span style={{ ...S.label, color: 'var(--color-always-dark-foreground-tertiary)' }}>{level}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-always-dark-foreground-secondary)', margin: '0 0 8px' }}>Foreground — Intent</p>
            <div style={S.grid}>
              {INTENTS.map(intent => (
                <div key={intent} style={S.swatch}>
                  <div style={{ ...S.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                    <span style={{ color: `var(--color-always-dark-foreground-${intent})`, fontWeight: 600, fontSize: 16 }}>Aa</span>
                  </div>
                  <span style={{ ...S.label, color: 'var(--color-always-dark-foreground-tertiary)' }}>{intent}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-always-dark-foreground-secondary)', margin: '0 0 8px' }}>Border — Hierarchy</p>
            <div style={S.grid}>
              {['primary', 'secondary', 'tertiary'].map(level => (
                <div key={level} style={S.swatch}>
                  <div style={{ ...S.color, border: `3px solid var(--color-always-dark-border-${level})` }} />
                  <span style={{ ...S.label, color: 'var(--color-always-dark-foreground-tertiary)' }}>{level}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-always-dark-foreground-secondary)', margin: '0 0 8px' }}>Border — Intent</p>
            <div style={S.grid}>
              {INTENTS.map(intent => (
                <div key={intent} style={S.swatch}>
                  <div style={{ ...S.color, border: `3px solid var(--color-always-dark-border-${intent})` }} />
                  <span style={{ ...S.label, color: 'var(--color-always-dark-foreground-tertiary)' }}>{intent}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-always-dark-foreground-secondary)', margin: '0 0 8px' }}>Divider</p>
            <div style={{ height: 1, backgroundColor: 'var(--color-always-dark-divider)', margin: '4px 0' }} />
            <span style={{ ...S.label, color: 'var(--color-always-dark-foreground-tertiary)' }}>always-dark-divider</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

function DataVizColors() {
  return (
    <div style={S.page}>
      <Section title="Data — Category (12)" subtitle="Categorical palette for charts and graphs">
        <div style={{ ...S.grid, gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
            <Swatch key={n} token={`color-data-category-${n}`} label={`${n}`} />
          ))}
        </div>
      </Section>

      <Section title="Data — Sequential Blue" subtitle="2, 3, and 4-step blue sequences">
        {[2, 3, 4].map(steps => (
          <div key={steps} style={{ marginBottom: 12 }}>
            <p style={{ ...S.subheading, marginBottom: 6 }}>{steps}-step</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: steps }, (_, i) => i + 1).map(n => (
                <div key={n} style={{ flex: 1 }}>
                  <Swatch token={`color-data-sequence-blue-${steps}-${n}`} label={`${n}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Data — Diverging Blue-Orange" subtitle="5, 7, and 9-step diverging palettes">
        {[5, 7, 9].map(steps => (
          <div key={steps} style={{ marginBottom: 12 }}>
            <p style={{ ...S.subheading, marginBottom: 6 }}>{steps}-step</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: steps }, (_, i) => i + 1).map(n => (
                <div key={n} style={{ flex: 1 }}>
                  <Swatch token={`color-data-diverging-blue-orange-${steps}-${n}`} label={`${n}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Data — Win/Loss">
        <div style={{ display: 'flex', gap: 8, maxWidth: 400 }}>
          <div style={{ flex: 1 }}><Swatch token="color-data-win-loss-win" label="win" /></div>
          <div style={{ flex: 1 }}><Swatch token="color-data-win-loss-win-alt" label="win-alt" /></div>
          <div style={{ flex: 1 }}><Swatch token="color-data-win-loss-loss" label="loss" /></div>
        </div>
      </Section>

      <Section title="Data — Misc">
        <div style={{ display: 'flex', gap: 8, maxWidth: 400 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ flex: 1 }}><Swatch token={`color-data-misc-${n}`} label={`${n}`} /></div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ReferenceColors() {
  const alphaSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];

  /* Each hue has exact token suffixes — lightness/chroma vary per hue */
  const hues: { name: string; light: Record<string, string>; dark: Record<string, string> }[] = [
    { name: 'Blue (250)', light: { faint: 'light-blue-250-l92-c04-faint', medium: 'light-blue-250-l70-c18-medium', bold: 'light-blue-250-l50-c18-bold', strong: 'light-blue-250-l33-c09-strong' }, dark: { faint: 'dark-blue-250-l27-c05-faint', medium: 'dark-blue-250-l50-c17-medium', bold: 'dark-blue-250-l65-c20-bold', strong: 'dark-blue-250-l91-c05-strong' } },
    { name: 'Red (30)', light: { faint: 'light-red-30-l93-c04-faint', medium: 'light-red-30-l70-c20-medium', bold: 'light-red-30-l53-c20-bold', strong: 'light-red-30-l30-c11-strong' }, dark: { faint: 'dark-red-30-l28-c05-faint', medium: 'dark-red-30-l51-c17-medium', bold: 'dark-red-30-l70-c20-bold', strong: 'dark-red-30-l91-c06-strong' } },
    { name: 'Green (145)', light: { faint: 'light-green-145-l94-c05-faint', medium: 'light-green-145-l75-c22-medium', bold: 'light-green-145-l50-c19-bold', strong: 'light-green-145-l35-c13-strong' }, dark: { faint: 'dark-green-145-l27-c05-faint', medium: 'dark-green-145-l50-c17-medium', bold: 'dark-green-145-l70-c19-bold', strong: 'dark-green-145-l93-c06-strong' } },
    { name: 'Orange (60)', light: { faint: 'light-orange-60-l93-c05-faint', medium: 'light-orange-60-l75-c20-medium', bold: 'light-orange-60-l52-c13-bold', strong: 'light-orange-60-l35-c09-strong' }, dark: { faint: 'dark-orange-60-l28-c05-faint', medium: 'dark-orange-60-l51-c13-medium', bold: 'dark-orange-60-l75-c20-bold', strong: 'dark-orange-60-l92-c06-strong' } },
    { name: 'Yellow (85)', light: { faint: 'light-yellow-85-l93-c08-faint', medium: 'light-yellow-85-l85-c20-medium', bold: 'light-yellow-85-l51-c12-bold', strong: 'light-yellow-85-l40-c09-strong' }, dark: { faint: 'dark-yellow-85-l28-c05-faint', medium: 'dark-yellow-85-l51-c12-medium', bold: 'dark-yellow-85-l80-c18-bold', strong: 'dark-yellow-85-l93-c05-strong' } },
    { name: 'Purple (290)', light: { faint: 'light-purple-290-l92-c04-faint', medium: 'light-purple-290-l75-c15-medium', bold: 'light-purple-290-l52-c20-bold', strong: 'light-purple-290-l35-c13-strong' }, dark: { faint: 'dark-purple-290-l28-c05-faint', medium: 'dark-purple-290-l52-c17-medium', bold: 'dark-purple-290-l67-c20-bold', strong: 'dark-purple-290-l92-c05-strong' } },
    { name: 'Teal (180)', light: { faint: 'light-teal-180-l94-c05-faint', medium: 'light-teal-180-l75-c17-medium', bold: 'light-teal-180-l50-c12-bold', strong: 'light-teal-180-l35-c09-strong' }, dark: { faint: 'dark-teal-180-l27-c05-faint', medium: 'dark-teal-180-l50-c12-medium', bold: 'dark-teal-180-l70-c15-bold', strong: 'dark-teal-180-l93-c08-strong' } },
    { name: 'Cyan (215)', light: { faint: 'light-cyan-215-l94-c04-faint', medium: 'light-cyan-215-l75-c17-medium', bold: 'light-cyan-215-l51-c11-bold', strong: 'light-cyan-215-l30-c07-strong' }, dark: { faint: 'dark-cyan-215-l27-c05-faint', medium: 'dark-cyan-215-l50-c11-medium', bold: 'dark-cyan-215-l70-c15-bold', strong: 'dark-cyan-215-l92-c07-strong' } },
    { name: 'Magenta (325)', light: { faint: 'light-magenta-325-l94-c05-faint', medium: 'light-magenta-325-l70-c23-medium', bold: 'light-magenta-325-l54-c20-bold', strong: 'light-magenta-325-l30-c13-strong' }, dark: { faint: 'dark-magenta-325-l28-c05-faint', medium: 'dark-magenta-325-l51-c17-medium', bold: 'dark-magenta-325-l67-c20-bold', strong: 'dark-magenta-325-l90-c08-strong' } },
    { name: 'Pink (0)', light: { faint: 'light-pink-0-l93-c05-faint', medium: 'light-pink-0-l70-c22-medium', bold: 'light-pink-0-l53-c20-bold', strong: 'light-pink-0-l29-c10-strong' }, dark: { faint: 'dark-pink-0-l28-c05-faint', medium: 'dark-pink-0-l52-c17-medium', bold: 'dark-pink-0-l68-c20-bold', strong: 'dark-pink-0-l92-c05-strong' } },
    { name: 'Olive (115)', light: { faint: 'light-olive-115-l93-c05-faint', medium: 'light-olive-115-l85-c22-medium', bold: 'light-olive-115-l51-c13-bold', strong: 'light-olive-115-l35-c09-strong' }, dark: { faint: 'dark-olive-115-l27-c05-faint', medium: 'dark-olive-115-l51-c13-medium', bold: 'dark-olive-115-l75-c19-bold', strong: 'dark-olive-115-l93-c05-strong' } },
  ];

  const greys = [
    'grey-l18', 'grey-l20', 'grey-l27-dark-faint', 'grey-l30-light-strong',
    'grey-l50-dark-medium', 'grey-l51-light-bold', 'grey-l65-dark-bold',
    'grey-l75-light-medium', 'grey-l91-dark-strong', 'grey-l93-light-faint', 'grey-l98',
  ];

  const LEVELS = ['faint', 'medium', 'bold', 'strong'] as const;

  return (
    <div style={S.page}>
      <Section title="Reference — Black" subtitle="rgb(0 0 0 / alpha)">
        <div style={{ display: 'flex', gap: 2 }}>
          {alphaSteps.map(step => (
            <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: 40, backgroundColor: `var(--color-reference-black-${step})`, borderRadius: 4, border: '1px solid var(--color-border-tertiary)' }} />
              <span style={{ fontSize: 9, color: 'var(--color-foreground-tertiary)' }}>{step}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Reference — White" subtitle="rgb(255 255 255 / alpha)">
        <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--color-reference-black-100)', borderRadius: 8, padding: 8 }}>
          {alphaSteps.map(step => (
            <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: 40, backgroundColor: `var(--color-reference-white-${step})`, borderRadius: 4 }} />
              <span style={{ fontSize: 9, color: 'var(--color-reference-white-55)' }}>{step}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Reference — Grey" subtitle="Neutral OKLCH greys">
        <div style={{ display: 'flex', gap: 4 }}>
          {greys.map(g => (
            <div key={g} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: 40, backgroundColor: `var(--color-reference-${g})`, borderRadius: 4, border: '1px solid var(--color-border-tertiary)' }} />
              <span style={{ fontSize: 8, color: 'var(--color-foreground-tertiary)', textAlign: 'center', wordBreak: 'break-all' as const }}>{g.replace('grey-', '')}</span>
            </div>
          ))}
        </div>
      </Section>

      {hues.map(hue => (
        <Section key={hue.name} title={`Reference — ${hue.name}`} subtitle="Light theme (faint → strong) | Dark theme (faint → strong)">
          <div style={{ display: 'flex', gap: 4 }}>
            {LEVELS.map(level => (
              <div key={`light-${level}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: 40, backgroundColor: `var(--color-reference-${hue.light[level]})`, borderRadius: 4, border: '1px solid var(--color-border-tertiary)' }}
                  title={`--color-reference-${hue.light[level]}`} />
                <span style={{ fontSize: 9, color: 'var(--color-foreground-tertiary)' }}>L {level}</span>
              </div>
            ))}
            <div style={{ width: 1, backgroundColor: 'var(--color-border-tertiary)', margin: '0 4px', flexShrink: 0 }} />
            {LEVELS.map(level => (
              <div key={`dark-${level}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', height: 40, backgroundColor: `var(--color-reference-${hue.dark[level]})`, borderRadius: 4, border: '1px solid var(--color-border-tertiary)' }}
                  title={`--color-reference-${hue.dark[level]}`} />
                <span style={{ fontSize: 9, color: 'var(--color-foreground-tertiary)' }}>D {level}</span>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

export const References: StoryObj = { name: 'References', render: () => <ReferenceColors /> };
export const Backgrounds: StoryObj = { name: 'Backgrounds', render: () => <BackgroundColors /> };
export const Foregrounds: StoryObj = { name: 'Foregrounds', render: () => <ForegroundColors /> };
export const Borders: StoryObj = { name: 'Borders', render: () => <BorderColors /> };
export const Interactions: StoryObj = { name: 'Interactions', render: () => <InteractionColors /> };
export const AlwaysDark: StoryObj = { name: 'Always Dark', render: () => <AlwaysDarkColors /> };
export const DataViz: StoryObj = { name: 'Data Visualization', render: () => <DataVizColors /> };

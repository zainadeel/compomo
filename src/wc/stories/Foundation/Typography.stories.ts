import type { Meta, StoryObj } from '@storybook/web-components';
import { html, TemplateResult } from 'lit';

const meta: Meta = {
  title: 'Foundation/Typography',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

// ── Shared styles ─────────────────────────────────────────────────────────────

const PAGE    = 'font-family: var(--typography-font-family, system-ui); padding: 24px; display: flex; flex-direction: column; gap: 40px;';
const SECTION = 'display: flex; flex-direction: column; gap: 16px;';
const H2      = 'font-size: 18px; font-weight: 600; color: var(--color-foreground-primary); margin: 0; letter-spacing: -0.3px;';
const SUB     = 'font-size: 13px; font-weight: 500; color: var(--color-foreground-secondary); margin: 2px 0 0;';
const ROW     = 'display: flex; align-items: baseline; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--color-border-tertiary);';
const LBL     = 'font-size: 12px; color: var(--color-foreground-secondary); min-width: 200px; flex-shrink: 0;';
const VAL     = 'font-size: 11px; color: var(--color-foreground-tertiary); min-width: 100px; flex-shrink: 0; font-family: monospace;';

function section(title: string, subtitle: string | undefined, children: TemplateResult | TemplateResult[]): TemplateResult {
  return html`
    <div style="${SECTION}">
      <div>
        <h2 style="${H2}">${title}</h2>
        ${subtitle ? html`<p style="${SUB}">${subtitle}</p>` : ''}
      </div>
      ${children}
    </div>`;
}

// ── Text Styles ───────────────────────────────────────────────────────────────

const TEXT_STYLES = [
  { name: 'Display Medium',         cls: 'text-display-medium',         desc: '44/64 bold' },
  { name: 'Display Small',          cls: 'text-display-small',          desc: '32/48 bold' },
  { name: 'Title Large',            cls: 'text-title-large',            desc: '24/32 semibold' },
  { name: 'Title Medium',           cls: 'text-title-medium',           desc: '18/24 semibold' },
  { name: 'Title Small',            cls: 'text-title-small',            desc: '14/20 semibold' },
  { name: 'Body Large',             cls: 'text-body-large',             desc: '18/24 regular' },
  { name: 'Body Large Emphasis',    cls: 'text-body-large-emphasis',    desc: '18/24 medium' },
  { name: 'Body Medium',            cls: 'text-body-medium',            desc: '14/20 regular' },
  { name: 'Body Medium Emphasis',   cls: 'text-body-medium-emphasis',   desc: '14/20 medium' },
  { name: 'Body Small',             cls: 'text-body-small',             desc: '12/16 regular' },
  { name: 'Body Small Emphasis',    cls: 'text-body-small-emphasis',    desc: '12/16 medium' },
  { name: 'Caption',                cls: 'text-caption',                desc: '9/12 medium uppercase' },
  { name: 'Caption Emphasis',       cls: 'text-caption-emphasis',       desc: '9/12 semibold uppercase' },
] as const;

function TextStyles(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${section('Text Styles', 'Composite text style classes from TokoMo', html`
        ${TEXT_STYLES.map(style => html`
          <div style="${ROW}">
            <span style="${LBL}">${style.name}</span>
            <span style="${VAL}">${style.desc}</span>
            <span class="${style.cls}" style="color: var(--color-foreground-primary); flex: 1;">
              The quick brown fox jumps over the lazy dog
            </span>
          </div>`)}
      `)}
    </div>`;
}

// ── Primitive Tokens ──────────────────────────────────────────────────────────

const SIZES = [
  { token: 'xs',  px: '9px'  },
  { token: 'sm',  px: '12px' },
  { token: 'md',  px: '14px' },
  { token: 'lg',  px: '18px' },
  { token: 'xl',  px: '24px' },
  { token: '2xl', px: '32px' },
  { token: '3xl', px: '44px' },
] as const;

const WEIGHTS = [
  { token: 'regular',  value: '400' },
  { token: 'medium',   value: '500' },
  { token: 'semibold', value: '600' },
  { token: 'bold',     value: '700' },
] as const;

const LETTER_SPACINGS = [
  { token: 'positive',       value: '0.3px'  },
  { token: 'none',           value: '0px'    },
  { token: 'negative-half',  value: '-0.15px' },
  { token: 'negative',       value: '-0.3px' },
  { token: 'negative-double',value: '-0.6px' },
] as const;

function Primitives(): TemplateResult {
  return html`
    <div style="${PAGE}">

      ${section('Font Sizes', '--typography-fontsize-*', html`
        ${SIZES.map(s => html`
          <div style="${ROW} align-items: center;">
            <span style="${LBL}">fontsize-${s.token}</span>
            <span style="${VAL}">${s.px}</span>
            <span style="font-size: var(--typography-fontsize-${s.token}); line-height: 1.4; color: var(--color-foreground-primary);">
              Aa Bb Cc 123
            </span>
          </div>`)}
      `)}

      ${section('Font Weights', '--typography-weight-*', html`
        ${WEIGHTS.map(w => html`
          <div style="${ROW}">
            <span style="${LBL}">weight-${w.token}</span>
            <span style="${VAL}">${w.value}</span>
            <span style="font-weight: var(--typography-weight-${w.token}); font-size: 18px; color: var(--color-foreground-primary);">
              The quick brown fox
            </span>
          </div>`)}
      `)}

      ${section('Line Heights', '--typography-lineheight-*', html`
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
          ${SIZES.map(s => html`
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="
                font-size: var(--typography-fontsize-${s.token});
                line-height: var(--typography-lineheight-${s.token});
                background-color: var(--color-background-faint-brand);
                color: var(--color-foreground-primary);
                padding: 0 8px;
                border-radius: 4px;">Aa Bb Cc</div>
              <span style="${LBL}">lineheight-${s.token}</span>
            </div>`)}
        </div>`)}

      ${section('Letter Spacing', '--typography-letterspacing-*', html`
        ${LETTER_SPACINGS.map(ls => html`
          <div style="${ROW}">
            <span style="${LBL}">letterspacing-${ls.token}</span>
            <span style="${VAL}">${ls.value}</span>
            <span style="letter-spacing: var(--typography-letterspacing-${ls.token}); font-size: 18px; color: var(--color-foreground-primary);">
              LETTER SPACING EXAMPLE
            </span>
          </div>`)}
      `)}

    </div>`;
}

// ── Story exports ─────────────────────────────────────────────────────────────

export const Styles:          Story = { name: 'Text Styles', render: () => TextStyles() };
export const PrimitiveTokens: Story = { name: 'Primitives',  render: () => Primitives() };

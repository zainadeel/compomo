import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import '../../../../dist/components/ds-text.js';
import type { TextVariant } from '../../components/Text';

const meta: Meta = {
  title: 'Foundation/Typography',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

// ── Shared layout helpers ──────────────────────────────────────────────────

const PAGE    = 'font-family: var(--typography-font-family); padding: var(--dimension-space-400); display: flex; flex-direction: column; gap: calc(var(--dimension-space-100) * 5); background: var(--color-background-primary); color: var(--color-foreground-primary); min-height: 100vh; box-sizing: border-box;';
const SECTION = 'display: flex; flex-direction: column; gap: var(--dimension-space-050);';
const H2      = 'font-size: var(--typography-fontsize-lg); font-weight: var(--typography-weight-semibold); color: var(--color-foreground-primary); margin: 0 0 var(--dimension-space-200); letter-spacing: var(--typography-letterspacing-negative-half); font-family: var(--typography-font-family);';
const ROW     = 'display: flex; align-items: baseline; gap: var(--dimension-space-200); padding: var(--dimension-space-125) 0; border-bottom: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);';
const LBL     = 'font-size: var(--typography-fontsize-xs); color: var(--color-foreground-secondary); min-width: 220px; flex-shrink: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; padding-top: var(--dimension-space-025);';
const SPEC    = 'font-size: var(--typography-fontsize-xs); color: var(--color-foreground-tertiary); min-width: 140px; flex-shrink: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;';

function sectionHead(title: string): TemplateResult {
  return html`<h2 style="${H2}">${title}</h2>`;
}

// ── Variants ───────────────────────────────────────────────────────────────

type VariantSpec = { variant: TextVariant; spec: string; sample: string };

const VARIANTS: VariantSpec[] = [
  { variant: 'text-display-medium',       spec: '44px / 64px  bold',          sample: 'Display Medium'         },
  { variant: 'text-display-small',        spec: '32px / 48px  bold',          sample: 'Display Small'          },
  { variant: 'text-title-large',          spec: '24px / 32px  semibold',      sample: 'Title Large'            },
  { variant: 'text-title-medium',         spec: '18px / 24px  semibold',      sample: 'Title Medium'           },
  { variant: 'text-title-small',          spec: '14px / 20px  semibold',      sample: 'Title Small'            },
  { variant: 'text-body-large',           spec: '18px / 24px  regular',       sample: 'The quick brown fox jumps over the lazy dog' },
  { variant: 'text-body-large-emphasis',  spec: '18px / 24px  medium',        sample: 'The quick brown fox jumps over the lazy dog' },
  { variant: 'text-body-medium',          spec: '14px / 20px  regular',       sample: 'The quick brown fox jumps over the lazy dog' },
  { variant: 'text-body-medium-emphasis', spec: '14px / 20px  medium',        sample: 'The quick brown fox jumps over the lazy dog' },
  { variant: 'text-body-small',           spec: '12px / 16px  regular',       sample: 'The quick brown fox jumps over the lazy dog' },
  { variant: 'text-body-small-emphasis',  spec: '12px / 16px  medium',        sample: 'The quick brown fox jumps over the lazy dog' },
  { variant: 'text-caption',              spec: '9px  / 12px  medium  upper', sample: 'caption label'          },
  { variant: 'text-caption-emphasis',     spec: '9px  / 12px  semibold upper',sample: 'caption emphasis'       },
];

function VariantsStory(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${sectionHead('Variants')}
      <div style="${SECTION}">
        ${VARIANTS.map(({ variant, spec, sample }) => html`
          <div style="${ROW}">
            <span style="${LBL}">${variant}</span>
            <span style="${SPEC}">${spec}</span>
            <ds-text variant=${variant} color="primary" as="span">${sample}</ds-text>
          </div>
        `)}
      </div>
    </div>
  `;
}

// ── Decorations & Styles ───────────────────────────────────────────────────

function StylesStory(): TemplateResult {
  return html`
    <div style="${PAGE}">

      ${sectionHead('Decorations')}
      <div style="${SECTION}">
        <div style="${ROW}">
          <span style="${LBL}">decoration="none" (default)</span>
          <ds-text variant="text-body-medium" color="primary" as="span">
            No decoration on this text
          </ds-text>
        </div>
        <div style="${ROW}">
          <span style="${LBL}">decoration="underline"</span>
          <ds-text variant="text-body-medium" color="primary" decoration="underline" as="span">
            Solid underline text
          </ds-text>
        </div>
        <div style="${ROW}">
          <span style="${LBL}">decoration="dotted-underline"</span>
          <ds-text variant="text-body-medium" color="primary" decoration="dotted-underline" as="span">
            Dotted underline text
          </ds-text>
        </div>
      </div>

      ${sectionHead('Italic')}
      <div style="${SECTION}">
        <div style="${ROW}">
          <span style="${LBL}">italic (default false)</span>
          <ds-text variant="text-body-medium" color="primary" as="span">
            Regular upright text
          </ds-text>
        </div>
        <div style="${ROW}">
          <span style="${LBL}">italic</span>
          <ds-text variant="text-body-medium" color="primary" ?italic=${true} as="span">
            Italic styled text
          </ds-text>
        </div>
      </div>

      ${sectionHead('Font Features')}
      <div style="${SECTION}">
        <div style="${ROW}">
          <span style="${LBL}">fontFeature="normal" (default)</span>
          <ds-text variant="text-body-medium" color="primary" as="span">
            111111 · 888888 · 10:11:12 · 98,765.43
          </ds-text>
        </div>
        <div style="${ROW}">
          <span style="${LBL}">fontFeature="tabular-nums"</span>
          <ds-text variant="text-body-medium" color="primary" font-feature="tabular-nums" as="span">
            111111 · 888888 · 10:11:12 · 98,765.43
          </ds-text>
        </div>
      </div>

      ${sectionHead('Alignment')}
      <div style="${SECTION}">
        ${(['left', 'center', 'right'] as const).map(a => html`
          <div style="${ROW}">
            <span style="${LBL}">align="${a}"</span>
            <ds-text variant="text-body-medium" color="primary" align=${a}
              style="flex: 1; display: block;">
              Aligned ${a} — The quick brown fox jumps over the lazy dog.
            </ds-text>
          </div>
        `)}
      </div>

      ${sectionHead('Line Truncation')}
      <div style="${SECTION}">
        <div style="${ROW}">
          <span style="${LBL}">lineTruncation="none" (default)</span>
          <ds-text variant="text-body-medium" color="primary" style="flex:1; max-width:460px;">
            No truncation — The quick brown fox jumps over the lazy dog.
            Sphinx of black quartz, judge my vow. How vexingly quick daft zebras jump.
          </ds-text>
        </div>
        ${([1, 2, 3] as const).map(n => html`
          <div style="${ROW}">
            <span style="${LBL}">lineTruncation=${n}</span>
            <ds-text variant="text-body-medium" color="primary"
              line-truncation=${n} style="flex:1; max-width:460px;">
              Truncated to ${n} line${n > 1 ? 's' : ''} —
              The quick brown fox jumps over the lazy dog.
              Sphinx of black quartz, judge my vow.
              How vexingly quick daft zebras jump.
              Pack my box with five dozen liquor jugs.
            </ds-text>
          </div>
        `)}
      </div>

      ${sectionHead('Text Wrap')}
      <div style="${SECTION}">
        ${(['wrap', 'balance', 'pretty'] as const).map(w => html`
          <div style="${ROW}">
            <span style="${LBL}">wrap="${w}"</span>
            <ds-text variant="text-body-medium" color="primary" wrap=${w}
              style="flex:1; max-width:340px;">
              Wrap mode: ${w}. The quick brown fox jumps over the lazy dog
              and the fence beyond the meadow.
            </ds-text>
          </div>
        `)}
      </div>

    </div>
  `;
}

// ── Story exports ──────────────────────────────────────────────────────────

export const Styles:    Story = { name: 'Styles',    render: () => VariantsStory() };
export const Modifiers: Story = { name: 'Modifiers', render: () => StylesStory()   };

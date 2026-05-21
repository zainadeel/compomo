import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import '../../../../dist/components/ds-text.js';
import type { TextVariant, TextColorToken } from '../../components/Text';

const meta: Meta = {
  title: 'Foundation/Text',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

// ── Shared layout helpers ──────────────────────────────────────────────────

const PAGE    = 'font-family: var(--typography-font-family, system-ui); padding: 32px; display: flex; flex-direction: column; gap: 40px; background: var(--color-background-primary, #fff);';
const SECTION = 'display: flex; flex-direction: column; gap: 4px;';
const H2      = 'font-size: 18px; font-weight: 600; color: var(--color-foreground-primary); margin: 0 0 16px; letter-spacing: -0.3px; font-family: var(--typography-font-family, system-ui);';
const ROW     = 'display: flex; align-items: baseline; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--color-border-tertiary);';
const LBL     = 'font-size: 11px; color: var(--color-foreground-secondary); min-width: 220px; flex-shrink: 0; font-family: monospace; padding-top: 2px;';
const SPEC    = 'font-size: 11px; color: var(--color-foreground-tertiary); min-width: 140px; flex-shrink: 0; font-family: monospace;';

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

// ── Colors ─────────────────────────────────────────────────────────────────

const COLORS: { color: TextColorToken; bg?: string; note?: string }[] = [
  { color: 'primary'   },
  { color: 'secondary' },
  { color: 'tertiary'  },
  { color: 'brand'     },
  { color: 'negative'  },
  { color: 'positive'  },
  { color: 'warning'   },
  { color: 'caution'   },
  { color: 'ai'        },
  { color: 'on-strong', bg: 'var(--color-background-bold-neutral)',  note: 'on strong surface' },
  { color: 'on-bold',   bg: 'var(--color-background-bold-brand)',    note: 'on bold surface'   },
  { color: 'inherit',                                                  note: 'inherits from parent' },
];

function ColorsStory(): TemplateResult {
  return html`
    <div style="${PAGE}">
      ${sectionHead('Colors')}
      <div style="${SECTION}">
        ${COLORS.map(({ color, bg, note }) => html`
          <div style="${ROW}${bg ? ' background: ' + bg + '; border-radius: 4px; padding: 10px 8px;' : ''}">
            <span style="${LBL}">${color}${note ? html` <em style="font-style:normal;opacity:.7">(${note})</em>` : ''}</span>
            <ds-text variant="text-body-medium" color=${color} as="span">
              The quick brown fox jumps over the lazy dog
            </ds-text>
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

export const Variants:    Story = { name: 'Variants',            render: () => VariantsStory() };
export const Colors:      Story = { name: 'Colors',              render: () => ColorsStory()   };
export const Styles:      Story = { name: 'Decorations & Styles',render: () => StylesStory()   };

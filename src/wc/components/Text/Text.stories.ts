import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-text.js';

const VARIANTS = [
  'text-display-medium', 'text-display-small',
  'text-title-large', 'text-title-medium', 'text-title-small',
  'text-body-large', 'text-body-medium', 'text-body-small',
  'text-caption',
];

const COLORS = [
  'primary', 'secondary', 'tertiary',
  'brand', 'negative', 'positive', 'warning', 'caution', 'ai',
  'on-strong', 'on-bold', 'inherit',
];

const meta: Meta = {
  title: 'Primitives/Text',
  tags: ['autodocs'],
  argTypes: {
    variant:       { control: 'select', options: VARIANTS },
    emphasis: {
      control: 'boolean',
      description:
        'Heavier weight + tighter letter-spacing. Default false (regular / caption medium). Pass true for display bold, title/caption semibold, body medium.',
    },
    color: {
      control: 'text',
      description: `Color token (${COLORS.join(', ')}) or CSS var, for example var(--color-foreground-bold-brand).`,
    },
    as:            { control: 'select', options: ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label'] },
    align:         { control: 'select', options: ['left', 'center', 'right'] },
    decoration:    { control: 'select', options: ['none', 'underline', 'dotted-underline'] },
    fontFeature:   { control: 'select', options: ['normal', 'tabular-nums'] },
    italic:        { control: 'boolean' },
    lineTruncation:{ control: 'select', options: [1, 2, 3, 4, 5, 'none'] },
    wrap:          { control: 'select', options: ['wrap', 'nowrap', 'balance', 'pretty'] },
    for:           { control: 'text' },
    content:       { control: 'text' },
  },
  args: {
    variant: 'text-body-medium',
    emphasis: false,
    color: 'primary',
    as: 'p',
    align: 'left',
    decoration: 'none',
    fontFeature: 'normal',
    italic: false,
    lineTruncation: 'none',
    wrap: 'wrap',
    for: '',
    content: 'The quick brown fox jumps over the lazy dog · 11:11:11 · 88,888.88',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="max-width: 360px;">
      <ds-text
        variant=${args['variant']}
        .emphasis=${args['emphasis'] as boolean}
        color=${args['color'] || undefined}
        as=${args['as']}
        align=${args['align'] || undefined}
        decoration=${args['decoration'] === 'none' ? undefined : args['decoration']}
        font-feature=${args['fontFeature']}
        line-truncation=${args['lineTruncation']}
        wrap=${args['wrap']}
        for=${args['for'] || undefined}
        ?italic=${args['italic']}
      >
        ${args['content']}
      </ds-text>
    </div>
  `,
};

export const AllVariants: Story = {
  name: 'All variants',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 8px">
      ${VARIANTS.map(v => html`
        <div style="display: flex; align-items: baseline; gap: 16px">
          <span style="font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary); min-width: 180px; flex-shrink: 0">${v}</span>
          <ds-text variant=${v}>The quick brown fox jumps over the lazy dog</ds-text>
          <ds-text variant=${v} emphasis>emphasis</ds-text>
        </div>
      `)}
    </div>
  `,
};

export const Emphasis: Story = {
  name: 'Emphasis pairs',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 8px">
      ${VARIANTS.map(v => html`
        <div style="display: flex; align-items: baseline; gap: 24px">
          <span style="font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary); min-width: 180px; flex-shrink: 0">${v}</span>
          <ds-text variant=${v} .emphasis=${false} as="span">regular</ds-text>
          <ds-text variant=${v} .emphasis=${true} as="span">emphasis</ds-text>
        </div>
      `)}
    </div>
  `,
};

export const Colors: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 8px">
      ${COLORS.filter(c => c !== 'inherit').map(c => html`
        <div style="display: flex; align-items: center; gap: 16px">
          <span style="font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary); min-width: 120px; flex-shrink: 0">${c}</span>
          <ds-text color=${c}>Sample text in ${c}</ds-text>
        </div>
      `)}
    </div>
  `,
};

export const Truncation: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px; max-width: 300px">
      <ds-text line-truncation="1">
        Single line truncation — the quick brown fox jumps over the lazy dog and then keeps going.
      </ds-text>
      <ds-text line-truncation="2">
        Two line truncation — the quick brown fox jumps over the lazy dog. It runs and runs and runs and never stops.
      </ds-text>
      <ds-text wrap="nowrap">
        Nowrap with ellipsis — the quick brown fox jumps over the lazy dog.
      </ds-text>
    </div>
  `,
};

const ROW = 'display: flex; align-items: baseline; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--color-border-tertiary)';
const LBL = 'font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary); min-width: 180px; flex-shrink: 0';

export const Decorations: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0">
      <div style="${ROW}">
        <span style="${LBL}">none (default)</span>
        <ds-text variant="text-body-large">The quick brown fox jumps over the lazy dog</ds-text>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">underline</span>
        <ds-text variant="text-body-large" decoration="underline">The quick brown fox jumps over the lazy dog</ds-text>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">dotted-underline</span>
        <ds-text variant="text-body-large" decoration="dotted-underline">The quick brown fox jumps over the lazy dog</ds-text>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">italic</span>
        <ds-text variant="text-body-large" italic>The quick brown fox jumps over the lazy dog</ds-text>
      </div>
      <div style="${ROW}">
        <span style="${LBL}">italic + underline</span>
        <ds-text variant="text-body-large" decoration="underline" italic>The quick brown fox jumps over the lazy dog</ds-text>
      </div>
    </div>
  `,
};

export const Alignment: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px; max-width: 480px">
      ${(['left', 'center', 'right'] as const).map(a => html`
        <div style="display: flex; flex-direction: column; gap: 4px">
          <span style="font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary)">${a}</span>
          <div style="border: 1px solid var(--color-border-tertiary); border-radius: 6px; padding: 12px">
            <ds-text variant="text-body-medium" align=${a}>
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
            </ds-text>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const SemanticElements: Story = {
  name: 'Semantic Elements',
  render: () => {
    // Recommended variant per heading level. h5 and h6 share title-small —
    // HTML has six levels; the type scale stops at title-small for compact titles.
    const headingVariant = {
      h1: 'text-display-medium',
      h2: 'text-display-small',
      h3: 'text-title-large',
      h4: 'text-title-medium',
      h5: 'text-title-small',
      h6: 'text-title-small',
    } as const;

    return html`
      <div style="display: flex; flex-direction: column; gap: 12px">
        ${(['h1','h2','h3','h4','h5','h6'] as const).map((tag, i) => html`
          <div style="${ROW}">
            <span style="${LBL}">as="${tag}" → ${headingVariant[tag]}</span>
            <ds-text as=${tag} variant=${headingVariant[tag]} emphasis>Heading level ${i + 1}</ds-text>
          </div>
        `)}
        <div style="${ROW}">
          <span style="${LBL}">as="p" (default)</span>
          <ds-text as="p">Paragraph text — the quick brown fox.</ds-text>
        </div>
        <div style="${ROW}">
          <span style="${LBL}">as="span"</span>
          <ds-text as="span" variant="text-body-small" color="secondary">Inline span text</ds-text>
        </div>
        <div style="${ROW}">
          <span style="${LBL}">as="label"</span>
          <ds-text as="label" variant="text-caption" .emphasis=${true}>Form label</ds-text>
        </div>
      </div>
    `;
  },
};

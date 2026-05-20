import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-text.js';

const VARIANTS = [
  'text-display-medium', 'text-display-small',
  'text-title-large', 'text-title-medium', 'text-title-small',
  'text-body-large', 'text-body-large-emphasis',
  'text-body-medium', 'text-body-medium-emphasis',
  'text-body-small', 'text-body-small-emphasis',
  'text-caption', 'text-caption-emphasis',
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
    color:         { control: 'select', options: COLORS },
    as:            { control: 'select', options: ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label'] },
    align:         { control: 'select', options: ['left', 'center', 'right'] },
    decoration:    { control: 'select', options: ['none', 'underline', 'dotted-underline'] },
    italic:        { control: 'boolean' },
    lineTruncation:{ control: 'select', options: [1, 2, 3, 4, 5, 'none'] },
  },
  args: {
    variant: 'text-body-medium',
    color: 'primary',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-text variant=${args['variant']} color=${args['color']} ?italic=${args['italic']}>
      The quick brown fox jumps over the lazy dog
    </ds-text>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 8px">
      ${VARIANTS.map(v => html`
        <div style="display: flex; align-items: baseline; gap: 16px">
          <span style="font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary); min-width: 220px; flex-shrink: 0">${v}</span>
          <ds-text variant=${v}>The quick brown fox jumps over the lazy dog</ds-text>
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

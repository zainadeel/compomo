import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-score.js';
import '../../../../dist/components/ds-text.js';
import { SAFETY_SCORE_LEVELS, SCORE_SIZES, SCORE_VARIANTS, type ScoreSize } from './score-types';

const meta: Meta = {
  title: 'Primitives/Score',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    size: { control: 'select', options: [...SCORE_SIZES] },
    variant: { control: 'select', options: [...SCORE_VARIANTS] },
    level: { control: 'select', options: ['', ...SAFETY_SCORE_LEVELS] },
    isLoading: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    value: 87,
    size: 'md',
    variant: 'default',
    level: '',
    isLoading: false,
    label: 'Safety score',
  },
  parameters: {
    docs: {
      description: {
        component:
          'Safety-score figure in a semantic fill. Default uses emphasized title-large at lg, title-medium at md, and title-small at sm. Dense preserves the fill geometry while using display-small at lg, title-large at md, and title-medium at sm.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-score
      value=${args['value']}
      size=${args['size']}
      variant=${args['variant']}
      level=${args['level'] || undefined}
      label=${args['label']}
      ?is-loading=${args['isLoading']}
    ></ds-score>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-200);">
      ${SCORE_SIZES.map(
        (size: ScoreSize) => html`
          <div style="display:flex;align-items:center;gap:var(--dimension-space-200);">
            <ds-text as="span" variant="text-body-small" color="secondary" style="width:2rem;"
              >${size}</ds-text
            >
            <ds-score size=${size} value="87" label="Default safety score"></ds-score>
            <ds-score size=${size} variant="dense" value="87" label="Dense safety score"></ds-score>
          </div>
        `
      )}
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-200);">
      ${SCORE_SIZES.map(
        (size: ScoreSize) => html`
          <div style="display:flex;align-items:center;gap:var(--dimension-space-200);">
            <ds-text as="span" variant="text-body-small" color="secondary" style="width:2rem;"
              >${size}</ds-text
            >
            <ds-score size=${size} value="87" label="Safety score"></ds-score>
          </div>
        `
      )}
    </div>
  `,
};

export const Levels: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--dimension-space-200);align-items:center;">
      <ds-score value="42" label="Fair score"></ds-score>
      <ds-score value="67" label="Good score"></ds-score>
      <ds-score value="87" label="Excellent score"></ds-score>
    </div>
  `,
};

export const Loading: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-200);">
      ${SCORE_SIZES.map(
        (size: ScoreSize) => html`
          <div style="display:flex;align-items:center;gap:var(--dimension-space-200);">
            <ds-text as="span" variant="text-body-small" color="secondary" style="width:2rem;"
              >${size}</ds-text
            >
            <ds-score size=${size} is-loading label="Safety score"></ds-score>
          </div>
        `
      )}
    </div>
  `,
};

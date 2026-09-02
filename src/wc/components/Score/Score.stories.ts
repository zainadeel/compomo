import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-score.js';
import '../../../../dist/components/ds-text.js';
import { SAFETY_SCORE_LEVELS, SCORE_SIZES, type ScoreSize } from './score-types';

const meta: Meta = {
  title: 'Primitives/Score',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    size: { control: 'select', options: [...SCORE_SIZES] },
    level: { control: 'select', options: ['', ...SAFETY_SCORE_LEVELS] },
    isLoading: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    value: 87,
    size: 'md',
    level: '',
    isLoading: false,
    label: 'Safety score',
  },
  parameters: {
    docs: {
      description: {
        component:
          'Safety-score figure in a semantic fill. lg matches Card Overview. md is the 32px control treatment. sm is the 24px compact fill.',
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
      level=${args['level'] || undefined}
      label=${args['label']}
      ?is-loading=${args['isLoading']}
    ></ds-score>
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
            <ds-score size=${size} value="87" is-loading label="Safety score"></ds-score>
          </div>
        `
      )}
    </div>
  `,
};

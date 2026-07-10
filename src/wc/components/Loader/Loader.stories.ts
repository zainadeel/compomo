import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-loader.js';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
const COLORS = [
  'primary', 'secondary', 'tertiary', 'quaternary',
  'brand', 'negative', 'positive', 'warning', 'caution', 'ai', 'guide', 'neutral',
  'faint-brand', 'medium-brand', 'bold-brand', 'strong-brand',
  'on-strong', 'on-bold', 'inherit',
] as const;

const GRID = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--dimension-space-150);';
const CARD = 'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--dimension-space-075); min-height: calc(var(--dimension-size-base) * 10); padding: var(--dimension-space-150); border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary); border-radius: var(--dimension-radius-100); background: var(--color-background-primary);';
const LABEL = 'font-size: var(--typography-fontsize-xs); line-height: var(--typography-lineheight-xs); color: var(--color-foreground-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;';

const meta: Meta = {
  title: 'Primitives/Loader',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: SIZES,
      description: 'Iconography size token — same scale as ds-icon.',
    },
    color: {
      control: 'text',
      description: `Color token (${COLORS.join(', ')}) or CSS var, for example var(--color-foreground-bold-brand).`,
    },
    label: {
      control: 'text',
      description: 'Accessible label for standalone loading state.',
    },
  },
  args: {
    size: 'md',
    color: 'primary',
    label: '',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-loader
      size=${args['size']}
      color=${args['color'] || undefined}
      label=${args['label'] || undefined}
    ></ds-loader>
  `,
};

export const WithLabel: Story = {
  args: { label: 'Loading' },
  render: args => html`
    <ds-loader size=${args['size']} color=${args['color'] || undefined} label=${args['label']}></ds-loader>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="${GRID}">
      ${SIZES.map(size => html`
        <div style="${CARD}">
          <ds-loader size=${size} color="primary"></ds-loader>
          <span style="${LABEL}">${size}</span>
        </div>`)}
    </div>
  `,
};

export const Colors: Story = {
  render: () => html`
    <div style="${GRID}">
      ${COLORS.filter(color => color !== 'inherit').map(color => html`
        <div style="${CARD}">
          <ds-loader size="lg" color=${color}></ds-loader>
          <span style="${LABEL}">${color}</span>
        </div>`)}
    </div>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-icon.js';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
const COLORS = [
  'primary', 'secondary', 'tertiary', 'quaternary',
  'brand', 'negative', 'positive', 'warning', 'caution', 'ai', 'guide', 'neutral',
  'faint-brand', 'medium-brand', 'bold-brand', 'strong-brand',
  'on-strong', 'on-bold', 'inherit',
] as const;

const PAGE = 'display: flex; flex-direction: column; gap: var(--dimension-space-300); color: var(--color-foreground-primary);';
const GRID = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--dimension-space-150);';
const GROUP = 'display: flex; flex-direction: column; gap: var(--dimension-space-100);';
const ROW = 'display: flex; align-items: center; gap: var(--dimension-space-150); flex-wrap: wrap;';
const CARD = 'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--dimension-space-075); min-height: calc(var(--dimension-size-base) * 10); padding: var(--dimension-space-150); border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary); border-radius: var(--dimension-radius-100); background: var(--color-background-primary);';
const LABEL = 'font-size: var(--typography-fontsize-xs); line-height: var(--typography-lineheight-xs); color: var(--color-foreground-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;';

const meta: Meta = {
  title: 'Primitives/Icon',
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    size: { control: 'select', options: SIZES },
    color: {
      control: 'text',
      description: `Color token (${COLORS.join(', ')}) or CSS var, for example var(--color-foreground-bold-brand).`,
    },
    label: { control: 'text' },
    flag: { control: 'boolean' },
  },
  args: {
    name: 'Bell',
    size: 'md',
    color: 'primary',
    label: '',
    flag: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-icon
      name=${args['name']}
      size=${args['size']}
      color=${args['color'] || undefined}
      label=${args['label'] || undefined}
      ?flag=${args['flag']}
    ></ds-icon>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="${GRID}">
      ${SIZES.map(size => html`
        <div style="${CARD}">
          <ds-icon name="Bell" size=${size} color="primary"></ds-icon>
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
          <ds-icon name="Bell" size="lg" color=${color}></ds-icon>
          <span style="${LABEL}">${color}</span>
        </div>`)}
    </div>
  `,
};

export const Accessibility: Story = {
  render: () => html`
    <div style="${PAGE}">
      <div style="${GROUP}">
        <span style="${LABEL}">Decorative: aria-hidden, role presentation</span>
        <div style="${ROW}">
          <ds-icon name="Bell" size="lg" color="primary"></ds-icon>
          <span>Notification icon used beside visible text</span>
        </div>
      </div>

      <div style="${GROUP}">
        <span style="${LABEL}">Informative: label sets role="img" and aria-label</span>
        <ds-icon name="Bell" size="lg" color="primary" label="Notifications"></ds-icon>
      </div>
    </div>
  `,
};

export const Flags: Story = {
  render: () => html`
    <div style="${GRID}">
      ${[
        'FlagUnitedStates',
        'FlagCanada',
        'FlagMexico',
        'FlagUnitedKingdom',
        'FlagFrance',
        'FlagGermany',
      ].map(name => html`
        <div style="${CARD}">
          <ds-icon name=${name} size="xl" ?flag=${true} label=${name.replace(/^Flag/, '')}></ds-icon>
          <span style="${LABEL}">${name}</span>
        </div>`)}
    </div>
  `,
};

export const CustomVarColor: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-icon name="Bell" size="lg" color="var(--color-foreground-bold-positive)"></ds-icon>
      <ds-icon name="Bell" size="lg" color="var(--color-foreground-bold-warning)"></ds-icon>
      <ds-icon name="Bell" size="lg" color="var(--color-foreground-bold-negative)"></ds-icon>
    </div>
  `,
};

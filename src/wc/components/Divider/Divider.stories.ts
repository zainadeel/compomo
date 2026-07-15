import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

// Side-effect import: self-registers <ds-divider> via customElements.define().
// Requires `npm run build` (stencil build) to have run first.
import '../../../../dist/components/ds-divider.js';

const BACKGROUND_CONTEXTS = [
  { id: 'default-primary', value: '', label: 'default · primary', background: 'var(--color-background-primary)', color: 'var(--color-foreground-primary)' },
  { id: 'default-secondary', value: '', label: 'default · secondary', background: 'var(--color-background-secondary)', color: 'var(--color-foreground-primary)' },
  { id: 'faint', value: 'faint', label: 'faint', background: 'var(--color-background-faint-neutral)', color: 'var(--color-foreground-primary)' },
  { id: 'medium', value: 'medium', label: 'medium', background: 'var(--color-background-medium-brand)', color: 'var(--color-foreground-on-medium-background-primary)' },
  { id: 'bold', value: 'bold', label: 'bold', background: 'var(--color-background-bold-brand)', color: 'var(--color-foreground-on-bold-background-primary)' },
  { id: 'strong', value: 'strong', label: 'strong', background: 'var(--color-background-strong-brand)', color: 'var(--color-foreground-on-strong-background-primary)' },
  { id: 'translucent', value: 'translucent', label: 'translucent', background: 'var(--color-translucent-translucent)', color: 'var(--color-translucent-foreground-primary)' },
  { id: 'inverted', value: 'inverted', label: 'inverted', background: 'var(--color-inverted-background)', color: 'var(--color-inverted-foreground-primary)' },
  { id: 'media', value: 'media', label: 'media', background: 'var(--color-media-background)', color: 'var(--color-media-foreground-primary)' },
  { id: 'navigation', value: 'navigation', label: 'navigation', background: 'var(--color-navigation-background)', color: 'var(--color-navigation-foreground-primary)' },
  { id: 'always-dark', value: 'always-dark', label: 'always-dark', background: 'var(--color-always-dark-background)', color: 'var(--color-always-dark-foreground-primary)' },
] as const;

const INSETS = [
  'none',
  'space-000',
  'space-012',
  'space-025',
  'space-050',
  'space-075',
  'space-100',
  'space-125',
  'space-150',
  'space-175',
  'space-200',
  'space-250',
  'space-300',
  'space-400',
  'space-600',
  'space-800',
] as const;

const meta: Meta = {
  title: 'Primitives/Divider',
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direction of the divider line.',
    },
    background: {
      control: 'select',
      options: [...new Set(BACKGROUND_CONTEXTS.map(context => context.value))],
      description: 'Actual parent background used to select the right divider token.',
    },
    inset: {
      control: 'select',
      options: INSETS,
      description: 'Visual inset from the divider start/end edges. Uses TokoMo spacing token names.',
    },
    length: {
      control: 'text',
      description: 'Line length. Use auto/full or any CSS length.',
    },
    semantic: {
      control: 'boolean',
      description: 'Expose role="separator"; defaults to decorative/aria-hidden.',
    },
  },
  args: {
    orientation: 'horizontal',
    background: '',
    inset: 'none',
    length: 'auto',
    semantic: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="display: flex; ${args['orientation'] === 'vertical' ? 'height: 80px; align-items: stretch;' : 'width: 320px;'}">
      <ds-divider
        orientation=${args['orientation']}
        background=${args['background'] || undefined}
        inset=${args['inset']}
        length=${args['length']}
        ?semantic=${args['semantic']}
      ></ds-divider>
    </div>
  `,
};

export const Horizontal: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--dimension-space-200); width: 300px">
      <p style="margin: 0">Section one content above the divider.</p>
      <ds-divider></ds-divider>
      <p style="margin: 0">Section two content below the divider.</p>
    </div>
  `,
};

export const Vertical: Story = {
  render: () => html`
    <div style="display: flex; align-items: stretch; gap: var(--dimension-space-200); height: 40px">
      <span>Left</span>
      <ds-divider orientation="vertical"></ds-divider>
      <span>Right</span>
    </div>
  `,
};

export const InList: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; width: 280px">
      <div style="padding: var(--dimension-space-150) 0">Item 1</div>
      <ds-divider inset="space-200"></ds-divider>
      <div style="padding: var(--dimension-space-150) 0">Item 2</div>
      <ds-divider inset="space-200"></ds-divider>
      <div style="padding: var(--dimension-space-150) 0">Item 3</div>
      <ds-divider inset="space-200"></ds-divider>
      <div style="padding: var(--dimension-space-150) 0">Item 4</div>
    </div>
  `,
};

export const Insets: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--dimension-space-200); width: 360px">
      ${INSETS.map(inset => html`
        <div style="display: flex; flex-direction: column; gap: var(--dimension-space-075);">
          <span style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-secondary);">${inset}</span>
          <ds-divider inset=${inset}></ds-divider>
        </div>`)}
    </div>
  `,
};

export const Backgrounds: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--dimension-space-150);">
      ${BACKGROUND_CONTEXTS.map(context => html`
        <div style="display: flex; flex-direction: column; gap: var(--dimension-space-100); padding: var(--dimension-space-150); border-radius: var(--dimension-radius-100); background: ${context.background}; color: ${context.color};">
          <span style="font-size: var(--typography-fontsize-sm);">${context.label}</span>
          <ds-divider background=${context.value || undefined}></ds-divider>
        </div>
      `)}
    </div>
  `,
};

export const VerticalLength: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: var(--dimension-space-200); height: 96px;">
      <span>Auto</span>
      <ds-divider orientation="vertical"></ds-divider>
      <span>24px</span>
      <ds-divider orientation="vertical" length="24px"></ds-divider>
      <span>48px</span>
      <ds-divider orientation="vertical" length="48px"></ds-divider>
      <span>End</span>
    </div>
  `,
};

export const SemanticSeparator: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--dimension-space-200); width: 320px">
      <p style="margin: 0">Visual-only divider is default and hidden from assistive tech.</p>
      <ds-divider></ds-divider>
      <p style="margin: 0">Use semantic only when the separator itself conveys document structure.</p>
      <ds-divider semantic></ds-divider>
    </div>
  `,
};

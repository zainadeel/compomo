import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

// Side-effect import: self-registers <ds-divider> via customElements.define().
// Requires `npm run build` (stencil build) to have run first.
import '../../../../dist/components/ds-divider.js';

const SURFACES = [
  'default',
  'on-bold-background',
  'on-strong-background',
  'on-medium-background',
  'on-translucent-background',
  'navigation',
  'media',
  'always-dark',
  'inverted',
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
    surface: {
      control: 'select',
      options: SURFACES,
      description: 'Surface context used to select the right divider token.',
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
    surface: 'default',
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
        surface=${args['surface']}
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

export const Surfaces: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--dimension-space-150);">
      ${SURFACES.map(surface => {
        const background =
          surface === 'on-bold-background' ? 'var(--color-background-bold-brand)' :
          surface === 'on-strong-background' ? 'var(--color-background-strong-brand)' :
          surface === 'on-medium-background' ? 'var(--color-background-medium-brand)' :
          surface === 'on-translucent-background' ? 'var(--color-translucent-translucent)' :
          surface === 'navigation' ? 'var(--color-navigation-background)' :
          surface === 'media' ? 'var(--color-media-background)' :
          surface === 'always-dark' ? 'var(--color-always-dark-background)' :
          surface === 'inverted' ? 'var(--color-inverted-background)' :
          'var(--color-background-primary)';
        const color =
          surface === 'on-bold-background' ? 'var(--color-foreground-on-bold-background-primary)' :
          surface === 'on-strong-background' ? 'var(--color-foreground-on-strong-background-primary)' :
          surface === 'on-medium-background' ? 'var(--color-foreground-on-medium-background-primary)' :
          surface === 'on-translucent-background' ? 'var(--color-translucent-foreground-primary)' :
          surface === 'navigation' ? 'var(--color-navigation-foreground-primary)' :
          surface === 'media' ? 'var(--color-media-foreground-primary)' :
          surface === 'always-dark' ? 'var(--color-always-dark-foreground-primary)' :
          surface === 'inverted' ? 'var(--color-inverted-foreground-primary)' :
          'var(--color-foreground-primary)';

        return html`
          <div style="display: flex; flex-direction: column; gap: var(--dimension-space-100); padding: var(--dimension-space-150); border-radius: var(--dimension-radius-100); background: ${background}; color: ${color};">
            <span style="font-size: var(--typography-fontsize-sm);">${surface}</span>
            <ds-divider surface=${surface}></ds-divider>
          </div>`;
      })}
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

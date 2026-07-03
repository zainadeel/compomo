import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-fade.js';
import '../../../../dist/components/ds-app-shell.js';

const SIDES = ['top', 'bottom', 'left', 'right'] as const;
const SIZES = [
  'size-000',
  'size-050',
  'size-075',
  'size-100',
  'size-150',
  'size-200',
  'size-250',
  'size-300',
  'size-400',
  'size-500',
  'size-600',
  'size-800',
] as const;
const SURFACES = ['default', 'primary', 'secondary', 'navigation', 'media', 'always-dark', 'inverted'] as const;

const meta: Meta = {
  title: 'Utility/Fade',
  tags: ['autodocs'],
  argTypes: {
    side:       { control: 'select', options: SIDES },
    size:       { control: 'select', options: SIZES },
    surface:    { control: 'select', options: SURFACES },
    background: { control: 'text', description: 'Optional direct background override, e.g. var(--_nav-bg).' },
    visible:    { control: 'boolean' },
  },
  args: {
    side: 'bottom',
    size: 'size-600',
    surface: 'secondary',
    background: '',
    visible: true,
  },
};

export default meta;
type Story = StoryObj;

const CARD = 'position: relative; width: 220px; height: 128px; overflow: hidden; border-radius: var(--dimension-radius-100); padding: var(--dimension-space-150); box-sizing: border-box;';
const COPY = 'margin: 0; line-height: var(--typography-lineheight-md); color: inherit;';

function surfaceBackground(surface: string): string {
  return surface === 'primary' ? 'var(--color-background-primary)' :
    surface === 'navigation' ? 'var(--color-navigation-background)' :
    surface === 'media' ? 'var(--color-media-background)' :
    surface === 'always-dark' ? 'var(--color-always-dark-background)' :
    surface === 'inverted' ? 'var(--color-inverted-background)' :
    'var(--color-background-secondary)';
}

function surfaceColor(surface: string): string {
  return surface === 'navigation' ? 'var(--color-navigation-foreground-primary)' :
    surface === 'media' ? 'var(--color-media-foreground-primary)' :
    surface === 'always-dark' ? 'var(--color-always-dark-foreground-primary)' :
    surface === 'inverted' ? 'var(--color-inverted-foreground-primary)' :
    'var(--color-foreground-primary)';
}

export const Playground: Story = {
  render: args => html`
    <div style="${CARD} background: ${args['background'] || surfaceBackground(args['surface'])}; color: ${surfaceColor(args['surface'])};">
      <p style="${COPY}">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam, quis nostrud exercitation ullamco.
      </p>
      <ds-fade
        side=${args['side']}
        size=${args['size']}
        surface=${args['surface']}
        background=${args['background'] || undefined}
        .visible=${args['visible']}
      ></ds-fade>
    </div>
  `,
};

export const AllSides: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-200); flex-wrap: wrap">
      ${SIDES.map(side => html`
        <div>
          <div style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-tertiary); margin-bottom: var(--dimension-space-075);">${side}</div>
          <div style="${CARD} width: 180px; height: 104px; background: var(--color-background-secondary);">
            <p style="${COPY}">Scrollable content edge affordance.</p>
            <ds-fade side=${side} size="size-500" surface="secondary"></ds-fade>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const Surfaces: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--dimension-space-200);">
      ${SURFACES.map(surface => html`
        <div style="${CARD} background: ${surfaceBackground(surface)}; color: ${surfaceColor(surface)};">
          <p style="${COPY}">${surface}</p>
          <ds-fade side="bottom" size="size-600" surface=${surface}></ds-fade>
        </div>
      `)}
    </div>
  `,
};

export const Visibility: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-200); flex-wrap: wrap;">
      <div style="${CARD} background: var(--color-background-secondary);">
        <p style="${COPY}">Visible while content continues beneath the footer.</p>
        <ds-fade side="bottom" size="size-600" surface="secondary"></ds-fade>
      </div>
      <div style="${CARD} background: var(--color-background-secondary);">
        <p style="${COPY}">Hidden when scrolled to the edge.</p>
        <ds-fade side="bottom" size="size-600" surface="secondary" .visible=${false}></ds-fade>
      </div>
    </div>
  `,
};

export const ShellGradientChrome: Story = {
  name: 'Shell gradient chrome',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Inside `ds-app-shell[gradient]`, fades on panel-nav scroll regions inherit the fixed shell wash ' +
          'via `fade--shell-gradient` modifiers — edges stay aligned with the viewport-locked chrome layer.',
      },
    },
  },
  render: () => html`
    <div
      style="
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      "
    >
      <ds-app-shell nav-style="dashboard" gradient style="height: 100%;">
        <div
          slot="panel"
          style="
            position: relative;
            width: var(--dimension-size-2400);
            height: 100%;
            overflow: hidden;
            background: transparent;
          "
        >
          <div
            style="
              height: 100%;
              overflow-y: auto;
              padding: var(--dimension-space-200);
              box-sizing: border-box;
            "
          >
            ${Array.from({ length: 18 }, (_, i) => html`
              <p style="margin: 0 0 var(--dimension-space-150); color: var(--color-foreground-secondary); font-size: 13px;">
                Scroll item ${i + 1}
              </p>
            `)}
          </div>
          <ds-fade side="bottom" size="size-600" surface="secondary"></ds-fade>
        </div>
        <div style="padding: var(--dimension-space-400); color: var(--color-foreground-secondary);">
          Scroll the panel column — bottom fade samples shell gradient chrome.
        </div>
      </ds-app-shell>
    </div>
  `,
};

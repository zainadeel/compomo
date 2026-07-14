import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-text.js';

const ELEVATION_LEVELS = [
  ['elevated-none', 'None'],
  ['depressed-sm', 'Depressed SM'],
  ['depressed-md', 'Depressed MD'],
  ['elevated-sm', 'Elevated SM'],
  ['elevated-md', 'Elevated MD'],
  ['elevated-floating', 'Floating'],
] as const;

const PANEL_LEVELS = [
  ['elevated-panel-top', 'Panel top'],
  ['elevated-panel-right', 'Panel right'],
  ['elevated-panel-bottom', 'Panel bottom'],
  ['elevated-panel-left', 'Panel left'],
] as const;

const MOTION_LEVELS = [
  ['short-1', '50 ms'],
  ['short-2', '100 ms'],
  ['short-3', '200 ms'],
  ['medium-1', '300 ms'],
  ['medium-2', '400 ms'],
  ['medium-3', '500 ms'],
  ['long-1', '750 ms'],
  ['long-2', '1000 ms'],
  ['long-3', '2000 ms'],
] as const;

const pageStyle = [
  'display:flex',
  'flex-direction:column',
  'gap:var(--dimension-space-300)',
  'padding:var(--dimension-space-300)',
  'background:var(--color-background-primary)',
  'color:var(--color-foreground-primary)',
  'min-height:100vh',
  'box-sizing:border-box',
].join(';');

const meta: Meta = {
  title: 'Foundation/Effects',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

function elevationGrid(levels: ReadonlyArray<readonly [string, string]>) {
  return html`
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--dimension-card-width-sm),1fr));gap:var(--dimension-space-300)">
      ${levels.map(([token, label]) => html`
        <div style="display:flex;flex-direction:column;align-items:center;gap:var(--dimension-space-150);padding:var(--dimension-space-200)">
          <div
            style="
              width:var(--dimension-size-800);
              height:var(--dimension-size-600);
              background:var(--color-background-primary);
              border-radius:var(--dimension-radius-100);
              box-shadow:var(--effect-elevation-${token});
            "
          ></div>
          <ds-text as="span" variant="text-body-small" color="secondary">${label}</ds-text>
          <code style="color:var(--color-foreground-tertiary)">--effect-elevation-${token}</code>
        </div>
      `)}
    </div>
  `;
}

export const Elevation: Story = {
  render: () => html`
    <div style=${pageStyle}>
      <section>
        <ds-text as="h2" variant="text-title-medium">Elevation</ds-text>
        ${elevationGrid(ELEVATION_LEVELS)}
      </section>
      <section>
        <ds-text as="h2" variant="text-title-medium">Directional panel elevation</ds-text>
        ${elevationGrid(PANEL_LEVELS)}
      </section>
    </div>
  `,
};

export const MotionAndBlur: Story = {
  name: 'Motion & Blur',
  render: () => html`
    <style>
      .effect-motion-demo {
        display: flex;
        align-items: center;
        gap: var(--dimension-space-150);
      }

      .effect-motion-track {
        position: relative;
        width: var(--dimension-panel-width-sm);
        height: var(--dimension-size-300);
        border-radius: var(--dimension-radius-half);
        background: var(--color-background-faint-neutral);
      }

      .effect-motion-dot {
        position: absolute;
        inset-block-start: var(--dimension-space-025);
        inset-inline-start: var(--dimension-space-025);
        width: var(--dimension-size-250);
        height: var(--dimension-size-250);
        border-radius: var(--dimension-radius-half);
        background: var(--color-background-bold-brand);
      }

      .effect-motion-track:hover .effect-motion-dot,
      .effect-motion-track:focus-visible .effect-motion-dot {
        inset-inline-start: calc(100% - var(--dimension-size-250) - var(--dimension-space-025));
      }
    </style>
    <div style=${pageStyle}>
      <section style="display:flex;flex-direction:column;gap:var(--dimension-space-150)">
        <ds-text as="h2" variant="text-title-medium">Motion presets</ds-text>
        <ds-text as="p" variant="text-body-medium" color="secondary">
          Hover or focus a track to compare duration and easing.
        </ds-text>
        ${MOTION_LEVELS.map(([token, duration]) => html`
          <div class="effect-motion-demo">
            <code style="width:var(--dimension-size-800);color:var(--color-foreground-secondary)">
              --effect-motion-${token}
            </code>
            <ds-text as="span" variant="text-body-small" color="tertiary">${duration}</ds-text>
            <div class="effect-motion-track" tabindex="0">
              <div
                class="effect-motion-dot"
                style="transition:inset-inline-start var(--effect-motion-${token})"
              ></div>
            </div>
          </div>
        `)}
      </section>
      <section style="display:flex;flex-direction:column;gap:var(--dimension-space-200)">
        <ds-text as="h2" variant="text-title-medium">Backdrop blur</ds-text>
        <div style="display:flex;flex-wrap:wrap;gap:var(--dimension-space-300)">
          ${['sm', 'md', 'lg'].map(size => html`
            <div style="display:flex;flex-direction:column;align-items:center;gap:var(--dimension-space-100)">
              <div
                style="
                  position:relative;
                  overflow:hidden;
                  width:var(--dimension-size-800);
                  height:var(--dimension-size-600);
                  border-radius:var(--dimension-radius-100);
                  background:var(--color-background-bold-brand);
                "
              >
                <div
                  style="
                    position:absolute;
                    inset:var(--dimension-space-150);
                    backdrop-filter:blur(var(--effect-blur-${size}));
                    background:var(--color-translucent-translucent);
                  "
                ></div>
              </div>
              <code style="color:var(--color-foreground-secondary)">--effect-blur-${size}</code>
            </div>
          `)}
        </div>
      </section>
    </div>
  `,
};

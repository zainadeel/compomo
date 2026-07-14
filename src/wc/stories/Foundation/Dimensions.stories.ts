import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-text.js';

const SPACE_TOKENS = [
  '000', '012', '025', '050', '075', '100', '125', '150',
  '175', '200', '250', '300', '400', '600', '800',
] as const;
const SIZE_TOKENS = [
  '000', '050', '075', '100', '150', '200', '250',
  '300', '400', '500', '600', '800',
] as const;
const RADIUS_TOKENS = [
  '000', '012', '025', '037', '050', '075', '100', '125',
  '150', '175', '200', '250', '275', '300', '400', '600', 'half',
] as const;
const STROKE_TOKENS = ['012', '015', '018', '025', '037', '050'] as const;

const pageStyle = [
  'display:flex',
  'flex-direction:column',
  'gap:var(--dimension-space-150)',
  'padding:var(--dimension-space-300)',
  'background:var(--color-background-primary)',
  'color:var(--color-foreground-primary)',
  'min-height:100vh',
  'box-sizing:border-box',
].join(';');

const rowStyle = [
  'display:flex',
  'align-items:center',
  'gap:var(--dimension-space-150)',
  'min-height:var(--dimension-size-300)',
].join(';');

const labelStyle = [
  'width:var(--dimension-size-800)',
  'flex:none',
  'font-family:monospace',
  'font-size:var(--typography-fontsize-sm)',
  'color:var(--color-foreground-secondary)',
].join(';');

const meta: Meta = {
  title: 'Foundation/Dimensions',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const Spacing: Story = {
  render: () => html`
    <div style=${pageStyle}>
      <ds-text as="h2" variant="text-title-medium">Spacing</ds-text>
      ${SPACE_TOKENS.map(token => html`
        <div style=${rowStyle}>
          <span style=${labelStyle}>--dimension-space-${token}</span>
          <div
            style="
              width:var(--dimension-space-${token});
              min-width:var(--dimension-stroke-width-012);
              height:var(--dimension-size-200);
              background:var(--color-background-bold-brand);
              border-radius:var(--dimension-radius-025);
            "
          ></div>
        </div>
      `)}
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style=${pageStyle}>
      <ds-text as="h2" variant="text-title-medium">Element sizes</ds-text>
      ${SIZE_TOKENS.map(token => html`
        <div style=${rowStyle}>
          <span style=${labelStyle}>--dimension-size-${token}</span>
          <div
            style="
              width:var(--dimension-size-${token});
              min-width:var(--dimension-stroke-width-012);
              height:var(--dimension-size-${token});
              min-height:var(--dimension-stroke-width-012);
              background:var(--color-background-faint-brand);
              border:var(--dimension-stroke-width-012) solid var(--color-border-brand);
              border-radius:var(--dimension-radius-050);
            "
          ></div>
        </div>
      `)}
    </div>
  `,
};

export const Radii: Story = {
  render: () => html`
    <div style=${pageStyle}>
      <ds-text as="h2" variant="text-title-medium">Border radii</ds-text>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--dimension-size-800),1fr));gap:var(--dimension-space-200)">
        ${RADIUS_TOKENS.map(token => html`
          <div style="display:flex;flex-direction:column;align-items:center;gap:var(--dimension-space-100)">
            <div
              style="
                width:var(--dimension-size-800);
                height:var(--dimension-size-800);
                background:var(--color-background-bold-brand);
                border-radius:var(--dimension-radius-${token});
              "
            ></div>
            <span style=${labelStyle}>--dimension-radius-${token}</span>
          </div>
        `)}
      </div>
    </div>
  `,
};

export const StrokesAndLayers: Story = {
  name: 'Strokes & Layers',
  render: () => html`
    <div style=${pageStyle}>
      <ds-text as="h2" variant="text-title-medium">Stroke widths</ds-text>
      ${STROKE_TOKENS.map(token => html`
        <div style=${rowStyle}>
          <span style=${labelStyle}>--dimension-stroke-width-${token}</span>
          <div
            style="
              width:var(--dimension-panel-width-sm);
              border-top:var(--dimension-stroke-width-${token}) solid var(--color-foreground-primary);
            "
          ></div>
        </div>
      `)}
      <ds-text as="h2" variant="text-title-medium">Z-index layers</ds-text>
      <div style="display:flex;flex-wrap:wrap;gap:var(--dimension-space-100)">
        ${['base', 'raised', 'overlay', 'modal', 'floating', 'tooltip'].map(token => html`
          <div
            style="
              padding:var(--dimension-space-150) var(--dimension-space-200);
              background:var(--color-background-faint-neutral);
              border:var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
              border-radius:var(--dimension-radius-100);
            "
          >
            <span style="font-family:monospace;color:var(--color-foreground-secondary)">
              --dimension-z-index-${token}
            </span>
          </div>
        `)}
      </div>
    </div>
  `,
};

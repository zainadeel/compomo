import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-icon.js';
import '../../../../dist/components/ds-text.js';
import { registerIcons } from '../../../../dist/lib/utils/index.js';

registerIcons({
  StoryStaticGlyph:
    '<svg viewBox="0 0 24 24"><defs><linearGradient id="paint"><stop offset="0" stop-color="currentColor" stop-opacity="0.3"/><stop offset="1" stop-color="currentColor"/></linearGradient><clipPath id="clip"><rect width="24" height="24" rx="6"/></clipPath></defs><rect width="24" height="24" fill="url(#paint)" clip-path="url(#clip)"/></svg>',
  StoryUnsupportedGlyph: '<svg viewBox="0 0 24 24"><foreignObject width="24" height="24"/></svg>',
});

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
const COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'quaternary',
  'brand',
  'negative',
  'positive',
  'warning',
  'caution',
  'ai',
  'guide',
  'neutral',
  'faint-brand',
  'medium-brand',
  'bold-brand',
  'strong-brand',
  'on-strong',
  'on-bold',
  'inherit',
] as const;
const FLAGS = [
  { name: 'FlagUnitedStates', label: 'United States' },
  { name: 'FlagCanada', label: 'Canada' },
  { name: 'FlagMexico', label: 'Mexico' },
  { name: 'FlagUnitedKingdom', label: 'United Kingdom' },
  { name: 'FlagFrance', label: 'France' },
  { name: 'FlagGermany', label: 'Germany' },
] as const;

const PAGE =
  'display: flex; flex-direction: column; gap: var(--dimension-space-300); color: var(--color-foreground-primary);';
const GRID =
  'display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--dimension-space-150);';
const GROUP = 'display: flex; flex-direction: column; gap: var(--dimension-space-100);';
const ROW = 'display: flex; align-items: center; gap: var(--dimension-space-150); flex-wrap: wrap;';
const CARD =
  'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--dimension-space-075); min-height: calc(var(--dimension-size-base) * 10); padding: var(--dimension-space-150); border: var(--dimension-stroke-width-012) solid var(--color-border-tertiary); border-radius: var(--dimension-radius-100); background: var(--color-background-primary);';
const LABEL =
  'font-size: var(--typography-fontsize-xs); line-height: var(--typography-lineheight-xs); color: var(--color-foreground-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;';

const meta: Meta = {
  title: 'Primitives/Icon',
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    size: { control: 'select', options: SIZES },
    color: {
      control: 'text',
      description: `Color token (${COLORS.join(', ')}) or CSS var. Tertiary and quaternary are restricted to icons inside genuinely inactive/disabled UI or to purely decorative icons; quaternary is the fainter tier. Informative icons must retain sufficient contrast.`,
    },
    label: { control: 'text' },
  },
  args: {
    name: 'Bell',
    size: 'md',
    color: 'inherit',
    label: '',
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
    ></ds-icon>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="${GRID}">
      ${SIZES.map(
        size =>
          html` <div style="${CARD}">
            <ds-icon name="Bell" size=${size} color="primary"></ds-icon>
            <span style="${LABEL}">${size}</span>
          </div>`
      )}
    </div>
  `,
};

export const Colors: Story = {
  render: () => html`
    <div style="${GRID}">
      ${COLORS.filter(color => !['inherit', 'tertiary', 'quaternary'].includes(color)).map(
        color =>
          html` <div style="${CARD}">
            <ds-icon name="Bell" size="lg" color=${color}></ds-icon>
            <span style="${LABEL}">${color}</span>
          </div>`
      )}
    </div>
  `,
};

export const InactiveTertiary: Story = {
  name: 'Inactive foreground hierarchy',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; align-items: flex-start; gap: var(--dimension-space-100)"
    >
      ${(['tertiary', 'quaternary'] as const).map(
        color => html`
          <button
            disabled
            style="display: inline-flex; align-items: center; gap: var(--dimension-space-100); padding: var(--dimension-space-100); color: inherit"
          >
            <ds-icon name="Bell" size="md" color=${color}></ds-icon>
            <span>${color} inactive</span>
          </button>
        `
      )}
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
      ${FLAGS.map(
        flag =>
          html` <div style="${CARD}">
            <ds-icon name=${flag.name} size="xl" label=${flag.label}></ds-icon>
            <span style="${LABEL}">${flag.name}</span>
          </div>`
      )}
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

export const StaticRegisteredGlyphs: Story = {
  render: () => html`
    <div style="${PAGE}">
      <ds-text as="p" variant="text-body-small" color="secondary">
        Static custom glyphs support local gradients and clipping. Repeated instances keep their own
        references. Unsupported artwork leaves the same empty icon box.
      </ds-text>
      <div style="${ROW}">
        <ds-icon name="StoryStaticGlyph" size="xl" color="brand"></ds-icon>
        <ds-icon name="StoryStaticGlyph" size="xl" color="positive"></ds-icon>
        <ds-text>Two independent custom glyphs</ds-text>
      </div>
      <div style="${ROW}">
        <ds-icon name="FlagUnitedStates" size="xl"></ds-icon>
        <ds-icon name="FlagCanada" size="xl"></ds-icon>
        <ds-text>Canonical flag colors are preserved</ds-text>
      </div>
      <div style="${ROW}">
        <ds-icon name="StoryUnsupportedGlyph" size="xl"></ds-icon>
        <ds-text>Unsupported embedded content: empty icon box</ds-text>
      </div>
    </div>
  `,
};

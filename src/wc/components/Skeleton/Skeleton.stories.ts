import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-skeleton.js';
import '../../../../dist/components/ds-text.js';
import '../../../../dist/components/ds-icon.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-tag.js';

const TEXT_VARIANTS = [
  'text-display-medium',
  'text-display-small',
  'text-title-large',
  'text-title-medium',
  'text-title-small',
  'text-body-large',
  'text-body-medium',
  'text-body-small',
  'text-caption',
] as const;

const ICON_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
const CONTROL_SIZES = ['xs', 'sm', 'md'] as const;
const BACKGROUND_CONTEXTS = [
  { id: 'default-primary', value: '', label: 'default · primary', background: 'var(--color-background-primary)' },
  { id: 'default-secondary', value: '', label: 'default · secondary', background: 'var(--color-background-secondary)' },
  { id: 'faint', value: 'faint', label: 'faint', background: 'var(--color-background-faint-neutral)' },
  { id: 'medium', value: 'medium', label: 'medium', background: 'var(--color-background-medium-brand)' },
  { id: 'bold', value: 'bold', label: 'bold', background: 'var(--color-background-bold-brand)' },
  { id: 'strong', value: 'strong', label: 'strong', background: 'var(--color-background-strong-brand)' },
  { id: 'translucent', value: 'translucent', label: 'translucent', background: 'var(--color-translucent-translucent)' },
  { id: 'inverted', value: 'inverted', label: 'inverted', background: 'var(--color-inverted-background)' },
  { id: 'media', value: 'media', label: 'media', background: 'var(--color-media-background)' },
  { id: 'navigation', value: 'navigation', label: 'navigation', background: 'var(--color-navigation-background)' },
  { id: 'always-dark', value: 'always-dark', label: 'always-dark', background: 'var(--color-always-dark-background)' },
] as const;

const REVIEW_STACK = 'display:flex;flex-direction:column;gap:var(--dimension-space-200);';
const REVIEW_LABEL = 'display:block;width:auto;color:var(--color-foreground-secondary);';
const CANVAS_OUTLINE = 'outline:var(--dimension-stroke-width-015) dashed var(--color-border-bold-brand);outline-offset:0;';

const meta: Meta = {
  title: 'Primitives/Skeleton',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Atomic loading placeholder whose outer canvas matches ds-text line heights, ds-icon canvases, or shared control-density heights. Text and icon shapes are inset by 2px per edge; controls fill their canvas. Its background context selects a quaternary foreground token for the base and the matching semantic shimmer token for the moving band.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'icon', 'control'],
      description: 'Selects the layout canvas recipe.',
    },
    textVariant: {
      control: 'select',
      options: TEXT_VARIANTS,
      description: 'Line-height canvas used by text skeletons.',
      if: { arg: 'variant', eq: 'text' },
    },
    iconSize: {
      control: 'select',
      options: ICON_SIZES,
      description: 'Square iconography canvas used by icon skeletons.',
      if: { arg: 'variant', eq: 'icon' },
    },
    controlSize: {
      control: 'select',
      options: CONTROL_SIZES,
      description: 'Shared 16/24/32px control-density canvas.',
      if: { arg: 'variant', eq: 'control' },
    },
    width: {
      control: 'text',
      description: 'Text/control canvas width. Ignored by icon skeletons.',
    },
    rounded: {
      control: 'boolean',
      description: 'Rounds icons into circles and controls into pills. Ignored by text.',
    },
    shimmer: {
      control: 'boolean',
      description: 'Enables the shared tokenized shimmer animation.',
    },
    background: {
      control: 'select',
      options: [...new Set(BACKGROUND_CONTEXTS.map(context => context.value))],
      description: 'Actual parent background used to select matching base and shimmer tokens.',
    },
  },
  args: {
    variant: 'text',
    textVariant: 'text-body-medium',
    iconSize: 'md',
    controlSize: 'md',
    width: '240px',
    rounded: false,
    shimmer: true,
    background: '',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    docs: { description: { story: 'Use the controls to inspect every public prop combination.' } },
  },
  render: args => html`
    <ds-skeleton
      variant=${args['variant']}
      text-variant=${args['textVariant']}
      icon-size=${args['iconSize']}
      control-size=${args['controlSize']}
      width=${args['width']}
      ?rounded=${args['rounded']}
      ?shimmer=${args['shimmer']}
      background=${args['background'] || undefined}
    ></ds-skeleton>
  `,
};

export const CanvasAnatomy: Story = {
  name: 'Canvas anatomy',
  parameters: {
    docs: {
      description: {
        story:
          'The dashed outline marks the real layout canvas. Text only reduces the inner shape vertically; icons inset on every edge; controls fill their canvas.',
      },
    },
  },
  render: () => html`
    <div style="${REVIEW_STACK}">
      <div style="display:grid;grid-template-columns:120px 240px 1fr;align-items:center;gap:var(--dimension-space-200);">
        <ds-text as="span" variant="text-body-small" color="secondary">Text · md</ds-text>
        <ds-skeleton variant="text" text-variant="text-body-medium" width="240px" ?shimmer=${false} style=${CANVAS_OUTLINE}></ds-skeleton>
        <ds-text as="span" variant="text-body-small" color="secondary">20px canvas → 16px shape</ds-text>
      </div>
      <div style="display:grid;grid-template-columns:120px 240px 1fr;align-items:center;gap:var(--dimension-space-200);">
        <ds-text as="span" variant="text-body-small" color="secondary">Icon · md</ds-text>
        <ds-skeleton variant="icon" icon-size="md" ?shimmer=${false} style=${CANVAS_OUTLINE}></ds-skeleton>
        <ds-text as="span" variant="text-body-small" color="secondary">20×20px canvas → 16×16px shape</ds-text>
      </div>
      <div style="display:grid;grid-template-columns:120px 240px 1fr;align-items:center;gap:var(--dimension-space-200);">
        <ds-text as="span" variant="text-body-small" color="secondary">Control · md</ds-text>
        <ds-skeleton variant="control" control-size="md" width="160px" ?shimmer=${false} style=${CANVAS_OUTLINE}></ds-skeleton>
        <ds-text as="span" variant="text-body-small" color="secondary">32px canvas → 32px shape</ds-text>
      </div>
    </div>
  `,
};

export const TextScale: Story = {
  name: 'Text · complete scale',
  parameters: {
    docs: {
      description: {
        story: 'Each skeleton is shown beside the corresponding ds-text metric box. Width remains composition-owned.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;grid-template-columns:160px 240px 240px;align-items:center;gap:var(--dimension-space-100) var(--dimension-space-200);">
      <ds-text as="span" variant="text-caption" color="secondary">Variant</ds-text>
      <ds-text as="span" variant="text-caption" color="secondary">Real text</ds-text>
      <ds-text as="span" variant="text-caption" color="secondary">Skeleton</ds-text>
      ${TEXT_VARIANTS.map(variant => html`
        <ds-text as="span" variant="text-body-small" color="secondary">${variant}</ds-text>
        <ds-text as="span" variant=${variant}>Text metric box</ds-text>
        <ds-skeleton variant="text" text-variant=${variant} width="240px"></ds-skeleton>
      `)}
    </div>
  `,
};

export const ComposedTextLines: Story = {
  name: 'Text · multiline composition',
  parameters: {
    docs: {
      description: {
        story: 'One skeleton represents one line box. Compose multiple atoms and vary their widths for multiline loading content.',
      },
    },
  },
  render: () => html`
    <div style="display:flex;flex-direction:column;width:320px;">
      <ds-skeleton variant="text" text-variant="text-body-medium" width="100%"></ds-skeleton>
      <ds-skeleton variant="text" text-variant="text-body-medium" width="88%"></ds-skeleton>
      <ds-skeleton variant="text" text-variant="text-body-medium" width="60%"></ds-skeleton>
    </div>
  `,
};

export const IconScale: Story = {
  name: 'Icon · complete scale',
  parameters: {
    docs: {
      description: {
        story: 'Skeleton and ds-icon share the exact same square canvas at every iconography size. Icon shapes support square and circular treatments.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;grid-template-columns:64px 80px 80px 80px;align-items:center;gap:var(--dimension-space-100) var(--dimension-space-150);">
      <ds-text as="span" variant="text-caption" color="secondary">Size</ds-text>
      <ds-text as="span" variant="text-caption" color="secondary">Real icon</ds-text>
      <ds-text as="span" variant="text-caption" color="secondary">Square</ds-text>
      <ds-text as="span" variant="text-caption" color="secondary">Rounded</ds-text>
      ${ICON_SIZES.map(size => html`
        <ds-text as="span" variant="text-body-small" color="secondary">${size}</ds-text>
        <ds-icon name="Gear" size=${size} color="secondary"></ds-icon>
        <ds-skeleton variant="icon" icon-size=${size}></ds-skeleton>
        <ds-skeleton variant="icon" icon-size=${size} rounded></ds-skeleton>
      `)}
    </div>
  `,
};

export const ControlScale: Story = {
  name: 'Control · size and radius',
  parameters: {
    docs: {
      description: {
        story: 'Controls use the complete 16/24/32px density canvas. Default skeletons use 2px radius; rounded skeletons use the shared pill radius.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;grid-template-columns:48px 120px 160px 120px 96px;align-items:center;gap:var(--dimension-space-150);">
      <ds-text as="span" variant="text-caption" color="secondary">Size</ds-text>
      <ds-text as="span" variant="text-caption" color="secondary">Button</ds-text>
      <ds-text as="span" variant="text-caption" color="secondary">Default</ds-text>
      <ds-text as="span" variant="text-caption" color="secondary">Rounded tag</ds-text>
      <ds-text as="span" variant="text-caption" color="secondary">Rounded</ds-text>
      ${CONTROL_SIZES.map(size => html`
        <ds-text as="span" variant="text-body-small" color="secondary">${size}</ds-text>
        <ds-button-filled size=${size} label="Action" intent="brand"></ds-button-filled>
        <ds-skeleton variant="control" control-size=${size} width="160px"></ds-skeleton>
        <ds-tag size=${size} label="Status" intent="brand" contrast="faint" rounded></ds-tag>
        <ds-skeleton variant="control" control-size=${size} width="96px" rounded></ds-skeleton>
      `)}
    </div>
  `,
};

export const ShimmerStates: Story = {
  name: 'Shimmer · animated and static',
  parameters: {
    docs: {
      description: {
        story: 'Shimmer defaults on. The shape base uses the faintest foreground token for its background context, while the moving band uses the corresponding semantic shimmer token with no added opacity or color underneath. A stationary paint layer animates an oversized background with a tokenized fixed spread and off-screen travel buffer. Set shimmer=false for a static placeholder; reduced-motion preferences also remove animation automatically.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;grid-template-columns:96px 240px;align-items:center;gap:var(--dimension-space-150);">
      <ds-text as="span" variant="text-body-small" color="secondary" style=${REVIEW_LABEL}>Animated</ds-text>
      <ds-skeleton variant="text" text-variant="text-body-medium" width="240px"></ds-skeleton>
      <ds-text as="span" variant="text-body-small" color="secondary" style=${REVIEW_LABEL}>Static</ds-text>
      <ds-skeleton variant="text" text-variant="text-body-medium" width="240px" ?shimmer=${false}></ds-skeleton>
      <ds-text as="span" variant="text-body-small" color="secondary" style=${REVIEW_LABEL}>Animated</ds-text>
      <ds-skeleton variant="control" control-size="md" width="160px" rounded></ds-skeleton>
      <ds-text as="span" variant="text-body-small" color="secondary" style=${REVIEW_LABEL}>Static</ds-text>
      <ds-skeleton variant="control" control-size="md" width="160px" rounded ?shimmer=${false}></ds-skeleton>
    </div>
  `,
};

export const BackgroundContexts: Story = {
  name: 'Background contexts',
  parameters: {
    docs: {
      description: {
        story:
          'Every supported background maps to its quaternary foreground token and matching shimmer token. Omitted default covers primary and secondary; explicit faint uses the same standard tokens.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--dimension-space-150);">
      ${BACKGROUND_CONTEXTS.map(context => html`
        <div style="display:flex;flex-direction:column;gap:var(--dimension-space-050);">
          <ds-text as="span" variant="text-caption" color="secondary">${context.label}</ds-text>
          <div
            style="display:flex;flex-direction:column;gap:var(--dimension-space-100);padding:var(--dimension-space-200);background:${context.background};border-radius:var(--dimension-radius-100);"
          >
            <ds-skeleton
              variant="text"
              text-variant="text-body-medium"
              width="100%"
              background=${context.value || undefined}
            ></ds-skeleton>
            <ds-skeleton
              variant="control"
              control-size="md"
              width="60%"
              rounded
              background=${context.value || undefined}
            ></ds-skeleton>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const Composition: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A representative composition built exclusively from icon, text, and control skeleton atoms.',
      },
    },
  },
  render: () => html`
    <div style="display:flex;align-items:flex-start;gap:var(--dimension-space-150);width:360px;padding:var(--dimension-space-200);border:var(--dimension-stroke-width-015) solid var(--color-border-secondary);border-radius:var(--dimension-radius-150);">
      <ds-skeleton variant="icon" icon-size="md"></ds-skeleton>
      <div style="display:flex;flex:1;flex-direction:column;gap:var(--dimension-space-100);">
        <div style="display:flex;flex-direction:column;">
          <ds-skeleton variant="text" text-variant="text-body-medium" width="72%"></ds-skeleton>
          <ds-skeleton variant="text" text-variant="text-body-small" width="48%"></ds-skeleton>
        </div>
        <ds-skeleton variant="control" control-size="sm" width="96px" rounded></ds-skeleton>
      </div>
    </div>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-button-filled.js';

const INTENTS = [
  'neutral',
  'brand',
  'positive',
  'negative',
  'warning',
  'caution',
  'ai',
  'guide',
  'walkthrough',
] as const;

const CONTRASTS = ['bold', 'strong', 'medium', 'faint'] as const;
const VARIANTS = ['label', 'icon', 'icon-label'] as const;
const SIZES = ['md', 'sm', 'xs'] as const;
const WIDTHS = ['hug', 'fill'] as const;
const BACKGROUNDS = [
  'faint',
  'medium',
  'bold',
  'strong',
  'translucent',
  'inverted',
  'media',
  'always-dark',
] as const;

const meta: Meta = {
  title: 'Primitives/ButtonFilled',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: [...VARIANTS] },
    size: { control: 'select', options: [...SIZES] },
    width: { control: 'select', options: [...WIDTHS] },
    label: { control: 'text' },
    icon: { control: 'text' },
    intent: { control: 'select', options: [...INTENTS] },
    contrast: { control: 'select', options: [...CONTRASTS] },
    hasBorder: { control: 'boolean' },
    background: { control: 'select', options: ['', ...BACKGROUNDS] },
    rounded: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    ariaLabel: { control: 'text' },
  },
  args: {
    variant: 'label',
    size: 'md',
    width: 'hug',
    label: 'Confirm',
    icon: 'Check',
    intent: 'brand',
    contrast: 'bold',
    hasBorder: false,
    background: '',
    rounded: false,
    isInactive: false,
    isLoading: false,
    ariaLabel: '',
  },
};

export default meta;
type Story = StoryObj;

const ROW = 'display:flex;gap:var(--dimension-space-100);align-items:center;flex-wrap:wrap;';
const COL = 'display:flex;flex-direction:column;gap:var(--dimension-space-150);align-items:flex-start;';
const LABEL =
  'min-width:96px;color:var(--color-foreground-tertiary);font:var(--typography-text-caption-font);';
const SURFACE =
  'display:flex;gap:var(--dimension-space-100);align-items:center;padding:var(--dimension-space-150);border-radius:var(--dimension-radius-100);';

export const Playground: Story = {
  render: args => html`
    <ds-button-filled
      variant=${args['variant']}
      size=${args['size']}
      width=${args['width']}
      label=${args['label']}
      icon=${args['icon']}
      intent=${args['intent']}
      contrast=${args['contrast']}
      .hasBorder=${args['hasBorder']}
      .background=${args['background'] || undefined}
      ?rounded=${args['rounded']}
      ?is-inactive=${args['isInactive']}
      ?is-loading=${args['isLoading']}
      aria-label=${args['ariaLabel'] || undefined}
    ></ds-button-filled>
  `,
};

export const VariantsAndSizes: Story = {
  render: () => html`
    <div style="${COL}">
      ${VARIANTS.map(
        variant => html`
          <div style="${ROW}">
            <span style="${LABEL}">${variant}</span>
            ${SIZES.map(
              size => html`
                <ds-button-filled
                  variant=${variant}
                  size=${size}
                  label="Confirm"
                  icon="Check"
                  intent="brand"
                  aria-label=${variant === 'icon' ? `Confirm ${size}` : undefined}
                ></ds-button-filled>
              `,
            )}
          </div>
        `,
      )}
    </div>
  `,
};

export const Rounded: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-button-filled rounded variant="label" label="Confirm"></ds-button-filled>
      <ds-button-filled rounded variant="icon-label" icon="Check" label="Confirm"></ds-button-filled>
      <ds-button-filled rounded variant="icon" icon="Check" aria-label="Confirm"></ds-button-filled>
    </div>
  `,
};

export const LoadingVariants: Story = {
  render: () => html`
    <div style="${ROW}">
      ${VARIANTS.map(
        variant => html`
          <ds-button-filled
            variant=${variant}
            label="Confirm"
            icon="Check"
            is-loading
            aria-label=${variant === 'icon' ? 'Confirm' : undefined}
          ></ds-button-filled>
        `,
      )}
    </div>
  `,
};

/** Hug vs fill in a fixed parent — fill stretches; hug sizes to the label. */
export const Widths: Story = {
  parameters: { controls: { exclude: ['width'] } },
  render: args => html`
    <div
      style="display:flex;flex-direction:column;gap:var(--dimension-space-200);width:280px;"
    >
      ${WIDTHS.map(
        width => html`
          <div style="display:flex;flex-direction:column;gap:var(--dimension-space-100);width:100%;">
            <span style="${LABEL}">width=${width}</span>
            <ds-button-filled
              variant=${args['variant'] === 'icon' ? 'label' : args['variant']}
              size=${args['size']}
              width=${width}
              label=${args['label']}
              icon=${args['icon']}
              intent=${args['intent']}
              contrast=${args['contrast']}
            ></ds-button-filled>
          </div>
        `,
      )}
    </div>
  `,
};

export const IntentsBold: Story = {
  render: () => html`
    <div style="${ROW}">
      ${INTENTS.map(
        intent => html`
          <ds-button-filled
            variant="icon"
            icon="Check"
            intent=${intent}
            aria-label=${intent}
          ></ds-button-filled>
        `,
      )}
    </div>
  `,
};

export const ContrastMatrix: Story = {
  render: () => html`
    <div style="${COL}">
      ${CONTRASTS.map(
        contrast => html`
          <div style="${ROW}">
            <span style="${LABEL}">${contrast}</span>
            ${INTENTS.map(
              intent => html`
                <ds-button-filled
                  variant="icon"
                  icon="Check"
                  intent=${intent}
                  contrast=${contrast}
                  aria-label="${intent} ${contrast}"
                ></ds-button-filled>
              `,
            )}
          </div>
        `,
      )}
    </div>
  `,
};

export const OnBoldBrand: Story = {
  render: () => html`
    <div
      style="display:flex;gap:var(--dimension-space-100);align-items:center;padding:var(--dimension-space-150);border-radius:var(--dimension-radius-100);background:var(--color-background-bold-brand);"
    >
      <ds-button-filled variant="icon" icon="Check" intent="neutral" contrast="faint" aria-label="Save"></ds-button-filled>
      <ds-button-filled variant="label" label="Save" intent="brand" contrast="faint"></ds-button-filled>
    </div>
  `,
};

export const BorderSurfaceContexts: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${SURFACE} background:var(--color-background-primary);">
        <span style="${LABEL}">default</span>
        <ds-button-filled has-border label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-background-faint-neutral);">
        <span style="${LABEL}">faint</span>
        <ds-button-filled has-border background="faint" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-background-medium-neutral);">
        <span style="${LABEL}">medium</span>
        <ds-button-filled has-border background="medium" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-background-bold-neutral);">
        <span style="${LABEL}">bold</span>
        <ds-button-filled has-border background="bold" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-background-strong-neutral);">
        <span style="${LABEL}">strong</span>
        <ds-button-filled has-border background="strong" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:linear-gradient(var(--color-translucent-translucent), var(--color-translucent-translucent)), var(--color-background-bold-brand);">
        <span style="${LABEL};color:var(--color-translucent-foreground-secondary)">translucent</span>
        <ds-button-filled has-border background="translucent" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-inverted-background);">
        <span style="${LABEL};color:var(--color-inverted-foreground-secondary)">inverted</span>
        <ds-button-filled has-border background="inverted" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-media-background);">
        <span style="${LABEL};color:var(--color-media-foreground-secondary)">media</span>
        <ds-button-filled has-border background="media" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-always-dark-background);">
        <span style="${LABEL};color:var(--color-always-dark-foreground-secondary)">always-dark</span>
        <ds-button-filled has-border background="always-dark" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
    </div>
  `,
};

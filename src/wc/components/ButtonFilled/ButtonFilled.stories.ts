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

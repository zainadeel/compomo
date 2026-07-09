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

const meta: Meta = {
  title: 'Actions/ButtonFilled',
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'text' },
    intent: { control: 'select', options: [...INTENTS] },
    contrast: { control: 'select', options: [...CONTRASTS] },
    isInactive: { control: 'boolean' },
    ariaLabel: { control: 'text' },
  },
  args: {
    icon: 'Check',
    intent: 'brand',
    contrast: 'bold',
    isInactive: false,
    ariaLabel: 'Confirm',
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
      icon=${args['icon']}
      intent=${args['intent']}
      contrast=${args['contrast']}
      ?is-inactive=${args['isInactive']}
      aria-label=${args['ariaLabel']}
    ></ds-button-filled>
  `,
};

export const IntentsBold: Story = {
  render: () => html`
    <div style="${ROW}">
      ${INTENTS.map(
        intent => html`
          <ds-button-filled icon="Check" intent=${intent} aria-label=${intent}></ds-button-filled>
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
      <ds-button-filled icon="Check" intent="neutral" contrast="faint" aria-label="Save"></ds-button-filled>
      <ds-button-filled icon="Check" intent="brand" contrast="faint" aria-label="Save brand"></ds-button-filled>
    </div>
  `,
};

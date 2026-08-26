import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-banner.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-shell-app.js';

const INTENTS = ['neutral', 'brand', 'positive', 'warning', 'caution', 'negative'];
const CONTRASTS = ['faint', 'medium', 'strong', 'bold'];

const meta: Meta = {
  title: 'Feedback/Banner',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    description: { control: 'text' },
    intent: { control: 'select', options: INTENTS },
    contrast: { control: 'select', options: CONTRASTS },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    open: { control: 'boolean' },
    dismissLabel: { control: 'text' },
    announcement: { control: 'select', options: ['none', 'polite', 'assertive'] },
  },
  args: {
    heading: 'Scheduled maintenance',
    description: 'Some dashboard data may be delayed for a few minutes.',
    intent: 'brand',
    contrast: 'faint',
    orientation: 'horizontal',
    open: true,
    dismissLabel: 'Dismiss banner',
    announcement: 'none',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <ds-banner
        heading=${args['heading'] || undefined}
        description=${args['description']}
        intent=${args['intent']}
        contrast=${args['contrast']}
        orientation=${args['orientation']}
        ?open=${args['open']}
        dismiss-label=${args['dismissLabel']}
        announcement=${args['announcement']}
        @dsClose=${() => updateArgs({ open: false })}
      >
        <ds-button-unfilled
          slot="actions"
          label="View status"
          size="md"
          background=${args['contrast']}
        ></ds-button-unfilled>
      </ds-banner>
    `;
  },
};

export const DescriptionOnly: Story = {
  render: () => html`
    <ds-banner
      description="Cameras detail has moved to the Device Status report."
      intent="neutral"
    ></ds-banner>
  `,
};

export const MultipleActions: Story = {
  render: () => html`
    <ds-banner
      heading="Connection interrupted"
      description="Changes are saved locally and will sync when service returns."
      intent="warning"
      contrast="medium"
    >
      <ds-button-unfilled
        slot="actions"
        label="Retry now"
        size="md"
        background="medium"
      ></ds-button-unfilled>
      <ds-button-unfilled
        slot="actions"
        label="View status"
        size="md"
        background="medium"
      ></ds-button-unfilled>
    </ds-banner>
  `,
};

export const IntentAndContrastMatrix: Story = {
  render: () => html`
    <div style="display:grid;gap:var(--dimension-space-200);">
      ${CONTRASTS.map(
        contrast => html`
          <div style="display:grid;gap:var(--dimension-space-100);">
            ${INTENTS.map(
              intent => html`
                <ds-banner
                  heading=${intent}
                  description=${`${contrast} contrast`}
                  intent=${intent}
                  contrast=${contrast}
                ></ds-banner>
              `
            )}
          </div>
        `
      )}
    </div>
  `,
};

export const NarrowWrapping: Story = {
  render: () => html`
    <div style="width:min(100%,320px);">
      <ds-banner
        orientation="vertical"
        heading="Service interruption"
        description="Some changes cannot sync until the connection is restored."
        intent="negative"
        contrast="faint"
      >
        <ds-button-unfilled
          slot="actions"
          label="Retry"
          size="md"
          background="faint"
        ></ds-button-unfilled>
        <ds-button-unfilled
          slot="actions"
          label="Details"
          size="md"
          background="faint"
        ></ds-button-unfilled>
      </ds-banner>
    </div>
  `,
};

export const HorizontalLongHeading: Story = {
  render: () => html`
    <div style="width:min(100%,720px);">
      <ds-banner
        heading="Scheduled maintenance will temporarily delay dashboard reporting for several connected vehicle groups"
        description="The application remains available."
        intent="brand"
        contrast="faint"
      >
        <ds-button-unfilled
          slot="actions"
          label="View status"
          size="md"
          background="faint"
        ></ds-button-unfilled>
      </ds-banner>
    </div>
  `,
};

export const HorizontalLongDescription: Story = {
  render: () => html`
    <div style="width:min(100%,720px);">
      <ds-banner
        heading="Reporting delay"
        description="Dashboard totals may take several minutes to reflect newly completed trips, but incoming vehicle activity and saved changes remain available while reporting catches up."
        intent="warning"
        contrast="faint"
      >
        <ds-button-unfilled
          slot="actions"
          label="View status"
          size="md"
          background="faint"
        ></ds-button-unfilled>
      </ds-banner>
    </div>
  `,
};

export const VerticalLongHeading: Story = {
  render: () => html`
    <div style="width:min(100%,360px);">
      <ds-banner
        orientation="vertical"
        heading="Scheduled maintenance is affecting dashboard reporting"
        description="The application remains available."
        intent="brand"
        contrast="faint"
      >
        <ds-button-unfilled
          slot="actions"
          label="View status"
          size="md"
          background="faint"
        ></ds-button-unfilled>
      </ds-banner>
    </div>
  `,
};

export const VerticalDescriptionOnly: Story = {
  render: () => html`
    <div style="width:min(100%,360px);">
      <ds-banner
        orientation="vertical"
        description="Reporting is delayed while the latest vehicle activity is processed."
        intent="warning"
        contrast="faint"
      ></ds-banner>
    </div>
  `,
};

export const VerticalLongDescriptionAndActions: Story = {
  render: () => html`
    <div style="width:min(100%,360px);">
      <ds-banner
        orientation="vertical"
        heading="Connection interrupted"
        description="Changes remain saved on this device and will sync automatically when the connection returns."
        intent="negative"
        contrast="faint"
      >
        <ds-button-unfilled
          slot="actions"
          label="Retry"
          size="md"
          background="faint"
        ></ds-button-unfilled>
        <ds-button-unfilled
          slot="actions"
          label="View details"
          size="md"
          background="faint"
        ></ds-button-unfilled>
      </ds-banner>
    </div>
  `,
};

export const ShellIntegration: Story = {
  render: () => html`
    <div style="height:560px;">
      <ds-shell-app composition="slotted">
        <ds-banner
          slot="banner"
          heading="Scheduled maintenance"
          description="The application remains available while reporting data catches up."
          intent="brand"
          contrast="faint"
        >
          <ds-button-unfilled
            slot="actions"
            label="Learn more"
            background="faint"
          ></ds-button-unfilled>
        </ds-banner>
        <div
          slot="panel"
          style="width:240px;height:100%;background:var(--color-background-secondary);"
        ></div>
        <div slot="bar" style="height:64px;background:var(--color-background-secondary);"></div>
        <main style="height:100%;padding:var(--dimension-space-200);box-sizing:border-box;">
          Application content
        </main>
      </ds-shell-app>
    </div>
  `,
};

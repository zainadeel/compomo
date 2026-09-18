import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-setting.js';
import '../../../../dist/components/ds-inline-banner-settings.js';

const EVENT_VALIDATION_DESCRIPTION =
  "Motive's Event Validation Engine uses cloud-based AI models and the Safety Team (human review) to validate safety events and remove false positives.";

const meta: Meta = {
  title: 'Settings/InlineBannerSettings',
  tags: ['autodocs'],
  argTypes: {
    description: { control: 'text' },
  },
  args: {
    description: 'Some settings require additional context before you make a change.',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:min(100%,640px);background:var(--color-background-primary);">
      <ds-inline-banner-settings description=${args['description']}></ds-inline-banner-settings>
    </div>
  `,
};

export const InSettingsCard: Story = {
  render: () => html`
    <div style="width:min(100%,640px);">
      <ds-card-setting heading="Event validation" card-width="md">
        <ds-inline-banner-settings
          description=${EVENT_VALIDATION_DESCRIPTION}
        ></ds-inline-banner-settings>
        <div style="padding:var(--dimension-space-200);">
          <p style="margin:0;">Settings content remains below the shared informational copy.</p>
        </div>
      </ds-card-setting>
    </div>
  `,
};

export const Wrapping: Story = {
  render: () => html`
    <div style="width:min(100%,320px);">
      <ds-inline-banner-settings
        description="This informational copy wraps naturally while keeping the same body-medium text and spacing recipe."
      ></ds-inline-banner-settings>
    </div>
  `,
};

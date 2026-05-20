import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-banner.js';

const meta: Meta = {
  title: 'Overlay/Banner',
  tags: ['autodocs'],
  argTypes: {
    intent: {
      control: 'select',
      options: ['brand', 'positive', 'negative', 'warning', 'caution', 'neutral'],
    },
    contrast: { control: 'select', options: ['faint', 'medium', 'bold', 'strong'] },
    message:  { control: 'text' },
    header:   { control: 'boolean' },
    showDismiss: { control: 'boolean' },
  },
  args: { intent: 'positive', contrast: 'medium', message: 'Settings saved successfully.', header: false, showDismiss: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="padding: 16px; max-width: 480px">
      <ds-banner
        intent=${args['intent'] ?? 'positive'}
        contrast=${args['contrast'] ?? 'medium'}
        message=${args['message'] ?? 'Settings saved successfully.'}
        ?header=${args['header'] ?? false}
        ?show-dismiss=${args['showDismiss'] ?? false}
      ></ds-banner>
    </div>
  `,
};

export const WithHeader: Story = {
  render: () => html`
    <div style="padding: 16px; max-width: 480px">
      <ds-banner intent="brand" contrast="faint" message="You have a new message from dispatch." ?header=${true}></ds-banner>
    </div>
  `,
};

export const Negative: Story = {
  render: () => html`
    <div style="padding: 16px; max-width: 480px">
      <ds-banner intent="negative" contrast="medium" message="Failed to update vehicle status." ?show-dismiss=${true}></ds-banner>
    </div>
  `,
};

export const Warning: Story = {
  render: () => html`
    <div style="padding: 16px; max-width: 480px">
      <ds-banner intent="warning" contrast="faint" message="ELD connection lost. Reconnect to continue logging."></ds-banner>
    </div>
  `,
};

export const Bold: Story = {
  render: () => html`
    <div style="padding: 16px; max-width: 480px">
      <ds-banner intent="brand" contrast="bold" message="Feature flag enabled for your account." ?show-dismiss=${true}></ds-banner>
    </div>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { MessageFeedback } from '../conversation-types';
import '../../../../dist/components/ds-message-actions.js';

export default {
  title: 'Conversation/Message actions',
  tags: ['autodocs'],
} satisfies Meta;
type Story = StoryObj;

export const Copy: Story = {
  render: () => html`
    <ds-message-actions copy-text="A message ready to copy."></ds-message-actions>
  `,
};

export const Feedback: Story = {
  render: () => html`
    <ds-message-actions
      copy-text="A completed agent response."
      .feedbackEnabled=${true}
      feedback="positive"
      @dsFeedbackChange=${(event: CustomEvent<MessageFeedback | undefined>) => {
        const actions = event.currentTarget as HTMLElement & {
          feedback?: MessageFeedback;
        };
        actions.feedback = event.detail;
      }}
    ></ds-message-actions>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-message-composer.js';
import '../../../../dist/components/ds-button-unfilled.js';

const meta = {
  title: 'Conversation/Message composer',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const composerFrame = (content: unknown) => html`
  <div style="width:min(600px, 90vw); padding:var(--dimension-space-100);">${content}</div>
`;

export const Ready: Story = {
  render: () =>
    composerFrame(
      html`<ds-message-composer
        label="Message"
        placeholder="Write a message"
      ></ds-message-composer>`
    ),
};

export const ToolsAndActions: Story = {
  name: 'Tools and trailing actions',
  render: () =>
    composerFrame(html`
      <ds-message-composer label="Message agent" placeholder="Ask the agent">
        <ds-button-unfilled
          slot="tools"
          variant="icon"
          icon="Plus"
          size="md"
          .hasBorder=${false}
          aria-label="Add to message"
        ></ds-button-unfilled>
        <ds-button-unfilled
          slot="actions"
          variant="icon"
          icon="Mic"
          size="md"
          .hasBorder=${false}
          aria-label="Dictate message"
        ></ds-button-unfilled>
      </ds-message-composer>
    `),
};

export const SixLines: Story = {
  name: 'Six-line growth limit',
  render: () =>
    composerFrame(html`
      <ds-message-composer
        label="Message"
        .value=${'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6'}
      ></ds-message-composer>
    `),
};

export const Streaming: Story = {
  render: () =>
    composerFrame(html`
      <ds-message-composer
        label="Message"
        value="Working draft"
        status="streaming"
      ></ds-message-composer>
    `),
};

export const Error: Story = {
  render: () =>
    composerFrame(html`
      <ds-message-composer
        label="Message"
        value="A message that could not be sent"
        status="error"
      ></ds-message-composer>
    `),
};

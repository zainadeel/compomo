import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-conversation-list-item.js';
import '../../../../dist/components/ds-button-unfilled.js';

export default { title: 'Conversation/List item', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Playground: Story = {
  render: () =>
    html`<ds-conversation-list-item
      conversation-id="one"
      conversation-title="Plan a service route"
      preview="I grouped the stops by proximity."
      updated-at="2026-07-18T12:00:00Z"
    ></ds-conversation-list-item>`,
};
export const Busy: Story = {
  render: () =>
    html`<ds-conversation-list-item
      conversation-id="two"
      conversation-title="Review records"
      state="busy"
      status-label="Working…"
    ></ds-conversation-list-item>`,
};
export const Unread: Story = {
  render: () =>
    html`<ds-conversation-list-item
      conversation-id="unread"
      conversation-title="Review inspection notes"
      preview="Five vehicles need follow-up this week."
      updated-at="2026-07-18T12:00:00Z"
      unread-count="2"
    ></ds-conversation-list-item>`,
};
export const WithActions: Story = {
  render: () =>
    html`<div style="width:300px;">
      <ds-conversation-list-item
        conversation-id="three"
        conversation-title="A long conversation name that truncates"
        preview="This long preview stays on one line and the action overlays its right edge."
        updated-at="2026-07-18T12:00:00Z"
        unread-count="2"
        ><ds-button-unfilled
          slot="actions"
          id="conversation-actions-trigger"
          variant="icon"
          icon="Ellipses"
          rounded
          has-border="false"
          aria-label="Chat options"
        ></ds-button-unfilled
      ></ds-conversation-list-item>
    </div>`,
};

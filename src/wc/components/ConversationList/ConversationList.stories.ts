import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-conversation-list.js';
import '../../../../dist/components/ds-conversation-list-section.js';
import '../../../../dist/components/ds-conversation-list-item.js';
import '../../../../dist/components/ds-empty-state.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-avatar.js';

const meta: Meta = {
  title: 'Conversation/Conversation list',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj;

export const GroupedHistory: Story = {
  render: () => html`
    <div style="height:640px; width:var(--dimension-panel-width-xs);">
      <ds-conversation-list action-layout="footer">
        <ds-conversation-list-section heading="Pinned chats">
          <ds-conversation-list-item
            conversation-id="route-plan"
            conversation-title="Plan a service route"
            preview="I grouped the stops by proximity and time window."
            updated-at="2026-07-18T14:20:00-07:00"
            unread-count="1"
          ></ds-conversation-list-item>
        </ds-conversation-list-section>
        <ds-conversation-list-section heading="Today">
          <ds-conversation-list-item
            conversation-id="working"
            conversation-title="Review inspection notes"
            preview="Preparing a concise summary…"
            updated-at="2026-07-18T13:10:00-07:00"
            state="busy"
            status-label="Working…"
          ></ds-conversation-list-item>
        </ds-conversation-list-section>
        <ds-conversation-list-section heading="Yesterday">
          <ds-conversation-list-item
            conversation-id="customer"
            conversation-title="Avery Chen"
            preview="Can you send the revised arrival window?"
            updated-at="2026-07-17T16:05:00-07:00"
            unread-count="2"
          >
            <ds-avatar slot="leading" icon="Person" label="Direct chat"></ds-avatar>
          </ds-conversation-list-item>
          <ds-conversation-list-item
            conversation-id="error"
            conversation-title="Export service records"
            preview="The export could not be completed."
            updated-at="2026-07-17T10:35:00-07:00"
            state="error"
            status-label="Needs attention"
          ></ds-conversation-list-item>
        </ds-conversation-list-section>
        <ds-button-filled
          slot="actions"
          variant="icon-label"
          icon="SquarePencil"
          label="New conversation"
          rounded
          width="fill"
          aria-label="New conversation"
        ></ds-button-filled>
      </ds-conversation-list>
    </div>
  `,
};

export const Empty: Story = {
  render: () => html`
    <div style="height: 640px; width: var(--dimension-panel-width-xs);">
      <ds-conversation-list>
        <ds-empty-state
          slot="empty"
          heading="No conversations yet"
          body="Start one when you are ready."
        ></ds-empty-state>
        <ds-button-filled
          slot="actions"
          variant="icon"
          icon="SquarePencil"
          rounded
          aria-label="New conversation"
        ></ds-button-filled>
      </ds-conversation-list>
    </div>
  `,
};

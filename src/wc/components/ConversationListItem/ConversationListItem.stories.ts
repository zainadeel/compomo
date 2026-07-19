import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-conversation-list-item.js';
import '../../../../dist/components/ds-conversation-list-section.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-avatar.js';

export default { title: 'Conversation/List item', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Playground: Story = {
  render: () =>
    html`<ds-conversation-list-section data-a11y-fixture heading="Today">
      <ds-conversation-list-item
        conversation-id="one"
        conversation-title="Plan a service route"
        preview="I grouped the stops by proximity."
        updated-at="2026-07-18T12:00:00Z"
      ></ds-conversation-list-item>
    </ds-conversation-list-section>`,
};
export const Busy: Story = {
  render: () =>
    html`<ds-conversation-list-section data-a11y-fixture heading="Today">
      <ds-conversation-list-item
        conversation-id="two"
        conversation-title="Review records"
        state="busy"
        status-label="Working…"
      ></ds-conversation-list-item>
    </ds-conversation-list-section>`,
};
export const Unread: Story = {
  render: () =>
    html`<ds-conversation-list-section data-a11y-fixture heading="Today">
      <ds-conversation-list-item
        conversation-id="unread"
        conversation-title="Review inspection notes"
        preview="Five vehicles need follow-up this week."
        updated-at="2026-07-18T12:00:00Z"
        unread-count="2"
      ></ds-conversation-list-item>
    </ds-conversation-list-section>`,
};
export const WithActions: Story = {
  render: () =>
    html`<ds-conversation-list-section
      data-a11y-fixture
      heading="Today"
      style="display:block; width:300px;"
    >
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
          .hasBorder=${false}
          aria-label="Chat options"
        ></ds-button-unfilled
      ></ds-conversation-list-item>
    </ds-conversation-list-section>`,
};

export const WithLeadingAvatar: Story = {
  name: 'With leading avatar',
  render: () => html`
    <ds-conversation-list-section
      data-a11y-fixture
      heading="Today"
      style="display:block; width:300px;"
    >
      <ds-conversation-list-item
        conversation-id="avery"
        conversation-title="Avery Chen"
        preview="I can cover the late route today."
        updated-at="2026-07-18T12:00:00Z"
      >
        <ds-avatar slot="leading" icon="Person" label="Direct chat"></ds-avatar>
      </ds-conversation-list-item>
    </ds-conversation-list-section>
  `,
};

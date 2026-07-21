import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { AgentResponsePart, ConversationAttachment } from '../conversation-types';
import '../../../../dist/components/ds-agent-response.js';
import '../../../../dist/components/ds-message-scroller.js';
import '../../../../dist/components/ds-message.js';
import '../../../../dist/components/ds-message-bubble.js';
import '../../../../dist/components/ds-message-composer.js';
import '../../../../dist/components/ds-button-unfilled.js';

export default { title: 'Agent/Response', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Playground: Story = {
  render: () =>
    html`<ds-agent-response
      author="Agent"
      .showAuthor=${false}
      .parts=${[
        {
          id: 'answer',
          type: 'markdown',
          content: '## Summary\n\nA reusable rich response.',
          state: 'complete',
        },
      ]}
    ></ds-agent-response>`,
};

const attachments: ConversationAttachment[] = [
  {
    id: 'a1',
    name: 'service-summary.csv',
    mediaType: 'text/csv',
    size: '24 KB',
    url: 'https://example.com/service-summary.csv',
  },
];

const richParts: AgentResponsePart[] = [
  {
    id: 'activity',
    type: 'activity',
    items: [
      {
        id: 'step-1',
        label: 'Reviewed service records',
        detail: '12 records matched the requested period.',
        state: 'complete',
      },
      { id: 'step-2', label: 'Prepared summary', state: 'complete' },
    ],
  },
  {
    id: 'copy',
    type: 'markdown',
    state: 'complete',
    content:
      '## Service summary\n\nThe highest-priority finding is **repeat battery drain** on three vehicles.\n\n```ts\nconst affected = records.filter(record => record.issue === "battery")\n```',
  },
  {
    id: 'tool',
    type: 'tool',
    name: 'records.search',
    label: 'Searched service records',
    state: 'success',
    input: { period: 'last 30 days' },
    output: { matches: 12 },
  },
  { id: 'attachments', type: 'attachments', items: attachments },
  {
    id: 'sources',
    type: 'sources',
    items: [
      {
        id: 'source-1',
        title: 'Preventive maintenance guide',
        description: 'Battery inspection guidance',
        url: 'https://example.com/maintenance',
      },
    ],
  },
];

export const Conversation: Story = {
  render: () => html`
    <div style="height:720px; width:min(880px, 90vw);">
      <ds-message-scroller messages-label="Agent conversation" default-position="end">
        <ds-message
          message-id="u1"
          direction="outgoing"
          author="You"
          timestamp="2:14 PM"
          group-position="single"
        >
          <ds-message-bubble variant="user"
            >Summarize recent service issues and attach the records.</ds-message-bubble
          >
        </ds-message>
        <ds-agent-response
          message-id="a1"
          author="Agent"
          .showAuthor=${false}
          timestamp="2:15 PM"
          .parts=${richParts}
        ></ds-agent-response>
        <div slot="overlay" style="padding:var(--dimension-space-100);">
          <ds-message-composer label="Message agent" placeholder="Ask a follow-up">
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
        </div>
      </ds-message-scroller>
    </div>
  `,
};

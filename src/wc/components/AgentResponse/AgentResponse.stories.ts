import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { AgentResponsePart, ConversationAttachment } from '../conversation-types';
import '../../../../dist/components/ds-agent-response.js';
import '../../../../dist/components/ds-message-scroller.js';
import '../../../../dist/components/ds-message.js';
import '../../../../dist/components/ds-message-bubble.js';
import '../../../../dist/components/ds-message-composer.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-message-actions.js';
import '../../../../dist/components/ds-markdown.js';
import '../../../../dist/components/ds-agent-tool-call.js';
import '../../../../dist/components/ds-agent-source-list.js';
import '../../../../dist/components/ds-agent-questionnaire.js';

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

export const ComposedResponse: Story = {
  render: () => html`
    <div style="width:min(800px, 90vw);">
      <ds-agent-response author="Agent" .showAuthor=${false} render-mode="composed">
        <ds-markdown
          content="## Investigation complete\n\nThe repeated failures share one charging-system signature."
        ></ds-markdown>
        <ds-agent-tool-call
          name="records.search"
          label="Searched 12 service records"
          state="success"
        ></ds-agent-tool-call>
        <div data-ds-prose="off">
          <ds-text variant="text-body-small" emphasis>Application-owned result</ds-text>
          <ds-text variant="text-body-small" color="secondary">
            A composed response can interleave domain-specific components.
          </ds-text>
        </div>
        <ds-agent-source-list
          .items=${[
            {
              id: 'guide',
              title: 'Preventive maintenance guide',
              url: 'https://example.com/maintenance',
            },
          ]}
        ></ds-agent-source-list>
      </ds-agent-response>
    </div>
  `,
};

export const AnsweredQuestionnairePart: Story = {
  render: () => html`
    <div style="width:min(800px, 90vw);">
      <ds-agent-response
        author="Agent"
        .showAuthor=${false}
        .parts=${[
          {
            id: 'questionnaire-record',
            type: 'questionnaire',
            requestId: 'request-42',
            status: 'answered',
            questions: [
              {
                id: 'priority',
                type: 'single',
                question: 'Which issue should I investigate first?',
                choices: [
                  { value: 'battery', label: 'Repeated battery failures' },
                  { value: 'tires', label: 'Overdue tire inspections' },
                ],
              },
            ],
            answers: [{ questionId: 'priority', value: 'battery' }],
          },
        ] satisfies AgentResponsePart[]}
      ></ds-agent-response>
    </div>
  `,
};

export const MeasuredProseAndFullWidthStructures: Story = {
  render: () => html`
    <div style="width:min(800px, 90vw);">
      <ds-agent-response
        author="Agent"
        .showAuthor=${false}
        .parts=${[
          {
            id: 'measure',
            type: 'markdown',
            state: 'complete',
            content: `## Findings

This paragraph uses the response's readable text measure while remaining start-aligned. The prose foundation keeps the streaming rhythm stable and safely wraps https://example.com/a/very/long/path/that/does/not/need/to/widen/the/conversation/lane.

| Vehicle | Finding | Recommendation |
| --- | --- | --- |
| Unit 104 | Repeated battery drain | Run a complete charging-system test and inspect service history |

\`\`\`ts
const affected = records.filter(record => record.issue === 'battery')
\`\`\``,
          },
        ] satisfies AgentResponsePart[]}
      ></ds-agent-response>
    </div>
  `,
};

export const WithMetadataActions: Story = {
  render: () =>
    html`<ds-agent-response
      author="Agent"
      .showAuthor=${false}
      timestamp="2:15 PM"
      metadata-visibility="hover"
      .parts=${[
        {
          id: 'answer',
          type: 'markdown',
          content: 'The requested summary is ready.',
          state: 'complete',
        },
      ]}
    >
      <ds-message-actions
        slot="metadata-actions"
        copy-text="The requested summary is ready."
        .feedbackEnabled=${true}
      ></ds-message-actions>
    </ds-agent-response>`,
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

const representativeParts: AgentResponsePart[] = [
  {
    id: 'intro',
    type: 'markdown',
    state: 'complete',
    content: `## Service summary

The highest-priority finding is **repeat battery drain** on three vehicles. Review the [maintenance guide](https://example.com/maintenance) before running \`scheduleInspection()\`.

1. Inspect the affected vehicles.
   - Confirm battery age.
   - Record charging voltage.
2. Schedule follow-up service.`,
  },
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
    id: 'details',
    type: 'markdown',
    state: 'complete',
    content: `### Findings

> Three repeat failures share the same charging-system signature.

\`\`\`ts
const affected = records.filter(record => record.issue === "battery")
\`\`\`

| Vehicle | Repeat visits | Next step |
| --- | ---: | --- |
| Unit 104 | 3 | Charging-system test |
| Unit 228 | 2 | Battery replacement |

Long diagnostic identifier: battery_drain_follow_up_required_for_vehicle_unit_104_without_breaks`,
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
  {
    id: 'streaming-close',
    type: 'markdown',
    state: 'streaming',
    content: 'I can also prepare the follow-up work orders and notify',
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
          .parts=${representativeParts}
          .streaming=${true}
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

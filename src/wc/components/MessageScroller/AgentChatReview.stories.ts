import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { AgentQuestion, AgentSource } from '../conversation-types';
import './AgentChatReview.stories.css';
import '../../../../dist/components/ds-message-scroller.js';
import '../../../../dist/components/ds-message.js';
import '../../../../dist/components/ds-message-bubble.js';
import '../../../../dist/components/ds-message-composer.js';
import '../../../../dist/components/ds-agent-response.js';
import '../../../../dist/components/ds-agent-tool-call.js';
import '../../../../dist/components/ds-agent-source-list.js';
import '../../../../dist/components/ds-agent-questionnaire.js';
import '../../../../dist/components/ds-agent-activity.js';
import '../../../../dist/components/ds-message-actions.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-text.js';

const meta: Meta = {
  title: 'Agent/Agent chat review',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const questions: AgentQuestion[] = [
  {
    id: 'priority',
    type: 'single',
    question: 'Which issue should I investigate first?',
    description: 'Choose the work that should lead the next agent turn.',
    required: true,
    allowOther: true,
    choices: [
      {
        value: 'battery',
        label: 'Repeated battery failures',
        description: 'Three vehicles share the same charging-system signature.',
      },
      {
        value: 'tires',
        label: 'Overdue tire inspections',
        description: 'Two vehicles are past the inspection interval.',
      },
    ],
  },
];

const sources: AgentSource[] = [
  {
    id: 'service-guide',
    title: 'Charging-system diagnostic guide',
    description: 'Inspection sequence and expected voltage ranges.',
    url: 'https://docs.example.com/maintenance/charging-system',
  },
  {
    id: 'work-orders',
    title: 'Open maintenance work',
    description: 'Current follow-up work for the affected vehicles.',
    url: 'https://fleet.example.com/work-orders',
  },
];

const modelSelector = () => html`
  <ds-select
    slot="tools"
    size="sm"
    aria-label="Model"
    .options=${[
      { label: 'Fast model', value: 'fast' },
      { label: 'Reasoning model', value: 'reasoning' },
    ]}
    value="reasoning"
    .allowClear=${false}
  ></ds-select>
`;

const outgoingTurn = (id: string, text: string, anchor = false) => html`
  <ds-message
    message-id=${id}
    direction="outgoing"
    author="You"
    timestamp="2026-08-12T10:42:00-07:00"
    .scrollAnchor=${anchor}
  >
    <ds-message-bubble variant="user">${text}</ds-message-bubble>
  </ds-message>
`;

const reviewFrame = (content: unknown, narrow = false) => html`
  <div class="agent-chat-review">
    <div
      class=${`agent-chat-review__viewport${narrow ? ' agent-chat-review__viewport--narrow' : ''}`}
      style=${narrow
        ? '--agent-chat-review-width:360px;--agent-chat-review-height:680px;--agent-chat-review-min-height:320px;'
        : '--agent-chat-review-width:720px;--agent-chat-review-height:720px;--agent-chat-review-min-height:480px;'}
    >
      ${content}
    </div>
  </div>
`;

const completedResponse = () => html`
  <ds-message-scroller
    data-a11y-fixture
    messages-label="Maintenance agent conversation"
    default-position="end"
  >
    ${outgoingTurn(
      'review-completed-user',
      'Review recent maintenance issues and prepare the highest-priority follow-up.',
      true,
    )}
    <ds-agent-response
      message-id="review-completed-agent"
      author="Maintenance agent"
      timestamp="2026-08-12T10:43:00-07:00"
      render-mode="composed"
    >
      <div class="agent-chat-review__prose">
        <ds-text as="h2" variant="text-title-small" emphasis>Maintenance review</ds-text>
        <ds-text as="p" variant="text-body-medium">
          I found three repeat battery failures with matching charging-system symptoms. Unit 104
          has the highest operational risk, followed by Units 118 and 203.
        </ds-text>
        <ds-text as="p" variant="text-body-medium">
          I prepared a follow-up issue with the diagnostic sequence and affected vehicles.
        </ds-text>
      </div>
      <ds-agent-tool-call name="github.createIssue" state="success">
        <ds-text slot="summary" as="span" variant="text-body-small" emphasis>
          Created GitHub issue
        </ds-text>
        <a
          class="agent-chat-review__result-link"
          slot="result"
          href="https://github.com/zainadeel/compomo/issues/443"
        >
          <ds-text
            as="span"
            variant="text-body-medium"
            color="brand"
            decoration="underline"
            emphasis
          >
            #443 · Expand agent conversation UX
          </ds-text>
        </a>
      </ds-agent-tool-call>
      <ds-agent-source-list .items=${sources}></ds-agent-source-list>
      <ds-message-actions
        slot="actions"
        copy-text="Three repeat battery failures require follow-up."
        feedback-enabled
      ></ds-message-actions>
    </ds-agent-response>
    <div class="agent-chat-review__overlay" slot="overlay">
      <ds-message-composer label="Message maintenance agent" placeholder="Ask a follow-up">
        ${modelSelector()}
      </ds-message-composer>
    </div>
  </ds-message-scroller>
`;

const waitingForInput = () => html`
  <ds-message-scroller
    data-a11y-fixture
    messages-label="Maintenance agent conversation"
    default-position="end"
  >
    ${outgoingTurn(
      'review-waiting-user',
      'Review the maintenance backlog and prepare follow-up work.',
      true,
    )}
    <ds-agent-response
      message-id="review-waiting-agent"
      author="Maintenance agent"
      timestamp="2026-08-12T10:43:00-07:00"
      render-mode="composed"
    >
      <ds-text as="p" variant="text-body-medium">
        I found two clusters that need attention. Choose which one should lead the next turn.
      </ds-text>
      <ds-agent-tool-call
        name="maintenance.prepare"
        label="Choose the first follow-up"
        state="waiting-for-user"
      ></ds-agent-tool-call>
    </ds-agent-response>
    <div class="agent-chat-review__interaction" slot="interaction">
      <ds-agent-questionnaire
        request-id="review-priority"
        .questions=${questions}
        allow-cancel
      ></ds-agent-questionnaire>
    </div>
    <div class="agent-chat-review__overlay" slot="overlay">
      <ds-message-composer label="Message maintenance agent" placeholder="Add context">
        ${modelSelector()}
      </ds-message-composer>
    </div>
  </ds-message-scroller>
`;

export const CompletedResponse: Story = {
  render: () => reviewFrame(completedResponse()),
};

export const WaitingForInput: Story = {
  render: () => reviewFrame(waitingForInput()),
};

export const StreamingAtLiveEdge: Story = {
  render: () =>
    reviewFrame(html`
      <ds-message-scroller
        data-a11y-fixture
        messages-label="Maintenance agent conversation"
        default-position="end"
        busy
      >
        ${outgoingTurn(
          'review-streaming-user',
          'Summarize repeat service issues from the last 30 days.',
          true,
        )}
        <ds-agent-response
          message-id="review-streaming-agent"
          author="Maintenance agent"
          render-mode="composed"
          streaming
        >
          <ds-agent-activity
            .items=${[
              { id: 'records', label: 'Reviewed 12 service records', state: 'complete' },
              { id: 'patterns', label: 'Comparing repeat-failure patterns', state: 'active' },
            ]}
          ></ds-agent-activity>
          <div class="agent-chat-review__prose">
            <ds-text as="h2" variant="text-title-small" emphasis>Emerging pattern</ds-text>
            <ds-text as="p" variant="text-body-medium">
              Three vehicles have repeat battery failures with matching charging-system symptoms.
            </ds-text>
          </div>
          <ds-agent-tool-call
            name="records.compare"
            label="Comparing maintenance records"
            state="running"
          ></ds-agent-tool-call>
        </ds-agent-response>
        <div class="agent-chat-review__overlay" slot="overlay">
          <ds-message-composer
            label="Message maintenance agent"
            value="Add the affected unit numbers"
            status="streaming"
          >
            ${modelSelector()}
          </ds-message-composer>
        </div>
      </ds-message-scroller>
    `),
};

export const ComposerFailure: Story = {
  render: () =>
    reviewFrame(html`
      <ds-message-scroller
        data-a11y-fixture
        messages-label="Maintenance agent conversation"
        default-position="end"
      >
        ${outgoingTurn(
          'review-error-user',
          'Create work orders for the three affected vehicles.',
          true,
        )}
        <ds-agent-response
          message-id="review-error-agent"
          author="Maintenance agent"
          .showAuthor=${false}
          .parts=${[
            {
              id: 'ready',
              type: 'markdown',
              state: 'complete',
              content: 'I have the affected vehicles and diagnostic sequence ready.',
            },
          ]}
        ></ds-agent-response>
        <div class="agent-chat-review__overlay" slot="overlay">
          <ds-message-composer
            label="Message maintenance agent"
            value="Include the charging-system inspection checklist."
            status="error"
            error-message="The message could not be sent. Your draft is still available."
          >
            ${modelSelector()}
            <ds-button-unfilled
              slot="error-actions"
              label="Retry"
              size="sm"
            ></ds-button-unfilled>
          </ds-message-composer>
        </div>
      </ds-message-scroller>
    `),
};

export const NarrowWaitingForInput: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => reviewFrame(waitingForInput(), true),
};

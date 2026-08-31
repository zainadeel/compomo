import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import '../../../../dist/components/ds-message-scroller.js';
import '../../../../dist/components/ds-message.js';
import '../../../../dist/components/ds-message-bubble.js';
import '../../../../dist/components/ds-message-composer.js';
import '../../../../dist/components/ds-typing-indicator.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-text.js';
import '../../../../dist/components/ds-agent-questionnaire.js';
import '../../../../dist/components/ds-agent-response.js';
import '../../../../dist/components/ds-agent-tool-call.js';
import '../../../../dist/components/ds-select.js';

const meta: Meta = {
  title: 'Conversation/Message scroller',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: isolatedOverlayDocs('800px'),
  },
};
export default meta;
type Story = StoryObj;

const wiredThreadSwitchStories = new WeakSet<Element>();

export const GenericConversation: Story = {
  render: () => html`
    <div style="height:720px; width:min(880px, 90vw);">
      <ds-message-scroller messages-label="Support conversation" default-position="end">
        <ds-message
          message-id="u1"
          direction="outgoing"
          author="You"
          timestamp="2:14 PM"
          group-position="single"
        >
          <ds-message-bubble variant="user"
            >Could you summarize the recent service issues?</ds-message-bubble
          >
        </ds-message>
        <ds-message
          message-id="s1"
          direction="incoming"
          author="Support"
          timestamp="2:15 PM"
          group-position="single"
        >
          <ds-message-bubble variant="received"
            >Yes. I found three repeat battery issues and two overdue tire
            inspections.</ds-message-bubble
          >
        </ds-message>
        <div slot="overlay" style="padding:var(--dimension-space-100);">
          <ds-message-composer label="Message support" placeholder="Write a follow-up">
            <ds-button-unfilled
              slot="tools"
              variant="icon"
              icon="Plus"
              size="md"
              .hasBorder=${false}
              aria-label="Add to message"
            ></ds-button-unfilled>
          </ds-message-composer>
        </div>
      </ds-message-scroller>
    </div>
  `,
};

export const PersonToPersonReuse: Story = {
  render: () => html`
    <div style="height:640px; width:min(720px, 90vw);">
      <ds-message-scroller messages-label="Conversation with Avery" default-position="end">
        <ds-message
          message-id="p1"
          direction="incoming"
          author="Avery"
          timestamp="9:41 AM"
          group-position="first"
        >
          <ds-message-bubble variant="received"
            >Could you send the revised arrival window?</ds-message-bubble
          >
        </ds-message>
        <ds-message
          message-id="p2"
          direction="incoming"
          author="Avery"
          timestamp="9:42 AM"
          group-position="last"
        >
          <ds-message-bubble variant="received"
            >The customer is available after noon.</ds-message-bubble
          >
        </ds-message>
        <ds-message
          message-id="p3"
          direction="outgoing"
          author="You"
          timestamp="9:45 AM"
          delivery-state="read"
        >
          <ds-message-bubble variant="user">Yes — I’ll confirm it now.</ds-message-bubble>
        </ds-message>
        <ds-message message-id="typing" direction="incoming" author="Avery" streaming>
          <ds-typing-indicator label="Avery is typing…"></ds-typing-indicator>
        </ds-message>
        <div slot="overlay" style="padding:var(--dimension-space-100);">
          <ds-message-composer label="Message Avery" placeholder="Write a message">
            <ds-button-unfilled
              slot="tools"
              variant="icon"
              icon="Plus"
              size="md"
              .hasBorder=${false}
              aria-label="Add to message"
            ></ds-button-unfilled>
          </ds-message-composer>
        </div>
      </ds-message-scroller>
    </div>
  `,
};

export const ReusedAcrossConversations: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A persistent MessageScroller can replace its complete application-owned transcript when the active conversation changes. Removed message elements are released from internal tracking and the replacement begins from its own default position.',
      },
    },
  },
  render: () => html`
    <div
      style="display:grid; grid-template-rows:auto minmax(0, 1fr); gap:var(--dimension-space-100); height:640px; width:min(720px, 90vw);"
      ${ref(root => {
        if (!root || wiredThreadSwitchStories.has(root)) return;
        wiredThreadSwitchStories.add(root);
        const scroller = root.querySelector('ds-message-scroller');
        const switchAction = root.querySelector('#switch-conversation');
        const status = root.querySelector('#conversation-status');
        if (!scroller || !switchAction || !status) return;

        switchAction.addEventListener('dsClick', () => {
          scroller.querySelectorAll(':scope > ds-message').forEach(message => message.remove());
          [
            ['incoming', 'Avery', 'The replacement conversation starts with its own history.'],
            [
              'outgoing',
              'You',
              'This scroller instance stayed mounted while its transcript changed.',
            ],
          ].forEach(([direction, author, text], index) => {
            const message = document.createElement('ds-message');
            message.setAttribute('message-id', `replacement-${index}`);
            message.setAttribute('direction', direction);
            message.setAttribute('author', author);
            const bubble = document.createElement('ds-message-bubble');
            bubble.setAttribute('variant', direction === 'outgoing' ? 'user' : 'received');
            bubble.textContent = text;
            message.append(bubble);
            scroller.append(message);
          });
          scroller.setAttribute('messages-label', 'Conversation with Avery');
          status.textContent = 'Showing conversation with Avery';
        });
      })}
    >
      <div
        style="display:flex; align-items:center; gap:var(--dimension-space-100); padding-inline:var(--dimension-space-100);"
      >
        <ds-button-unfilled
          id="switch-conversation"
          label="Switch conversation"
          size="sm"
        ></ds-button-unfilled>
        <ds-text id="conversation-status" as="span" variant="text-body-small" color="secondary">
          Showing conversation with Morgan
        </ds-text>
      </div>
      <ds-message-scroller messages-label="Conversation with Morgan" default-position="end">
        <ds-message
          message-id="initial-1"
          direction="incoming"
          author="Morgan"
          group-position="single"
        >
          <ds-message-bubble variant="received">
            The initial conversation remains application-owned.
          </ds-message-bubble>
        </ds-message>
        <ds-message
          message-id="initial-2"
          direction="outgoing"
          author="You"
          group-position="single"
          scroll-anchor
        >
          <ds-message-bubble variant="user">
            Switch threads without recreating the scroller.
          </ds-message-bubble>
        </ds-message>
        <div slot="overlay" style="padding:var(--dimension-space-100);">
          <ds-message-composer label="Message Morgan"></ds-message-composer>
        </div>
      </ds-message-scroller>
    </div>
  `,
};

export const AgentTurnWithPendingQuestionnaire: Story = {
  render: () => html`
    <div style="height:720px; width:min(880px, 90vw);">
      <ds-message-scroller messages-label="Agent conversation" default-position="end">
        <ds-message message-id="u1" direction="outgoing" author="You">
          <ds-message-bubble variant="user">
            Review recent maintenance issues and prepare follow-up work.
          </ds-message-bubble>
        </ds-message>
        <ds-agent-response
          message-id="a1"
          author="Agent"
          .showAuthor=${false}
          .parts=${[
            {
              id: 'tool',
              type: 'tool',
              name: 'records.search',
              label: 'Reviewed 12 service records',
              state: 'success',
            },
            {
              id: 'question',
              type: 'tool',
              name: 'work.prepare',
              label: 'Choose the first follow-up',
              state: 'waiting-for-user',
            },
          ]}
        ></ds-agent-response>
        <ds-message message-id="u2" direction="outgoing" author="You" scroll-anchor>
          <ds-message-bubble variant="user"
            >Continue with the highest-priority work.</ds-message-bubble
          >
        </ds-message>
        <div
          slot="interaction"
          style="padding:var(--dimension-space-100) var(--dimension-space-100) 0;"
        >
          <ds-agent-questionnaire
            request-id="maintenance-follow-up"
            .questions=${[
              {
                id: 'priority',
                type: 'single',
                question: 'Which issue should I investigate first?',
                required: true,
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
            ]}
            allow-cancel
          ></ds-agent-questionnaire>
        </div>
        <div slot="overlay" style="padding:var(--dimension-space-100);">
          <ds-message-composer label="Message agent" placeholder="Add context">
            <ds-select
              slot="tools"
              size="sm"
              aria-label="Model"
              .options=${[
                { label: 'Fast model', value: 'fast' },
                { label: 'Reasoning model', value: 'reasoning' },
              ]}
              value="fast"
              .allowClear=${false}
            ></ds-select>
          </ds-message-composer>
        </div>
      </ds-message-scroller>
    </div>
  `,
};

export const FirstUsePromptSuggestions: Story = {
  render: () => html`
    <div style="height:640px; width:min(880px, 90vw);">
      <ds-message-scroller messages-label="New agent conversation" default-position="start">
        <div
          style="display:grid; gap:var(--dimension-space-100); max-width:var(--dimension-panel-width-lg);"
        >
          <ds-text as="h2" variant="text-title-medium">What should we work on?</ds-text>
          <ds-text color="secondary">
            Suggestions are optional application composition. Selecting one should fill and focus
            the draft unless the product explicitly chooses immediate submission.
          </ds-text>
          <div style="display:flex; flex-wrap:wrap; gap:var(--dimension-space-075);">
            <ds-button-unfilled label="Summarize recent service issues"></ds-button-unfilled>
            <ds-button-unfilled label="Prepare overdue work orders"></ds-button-unfilled>
          </div>
        </div>
        <div slot="overlay" style="padding:var(--dimension-space-100);">
          <ds-message-composer
            label="Message agent"
            placeholder="Ask the agent"
          ></ds-message-composer>
        </div>
      </ds-message-scroller>
    </div>
  `,
};

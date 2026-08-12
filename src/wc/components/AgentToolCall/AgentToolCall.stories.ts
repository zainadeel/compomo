import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { AgentToolState } from '../conversation-types';
import '../../../../dist/components/ds-agent-tool-call.js';
import '../../../../dist/components/ds-text.js';

export default { title: 'Agent/Tool call', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;

const frame = (content: unknown) => html`
  <div style="width:min(720px, 90vw);">${content}</div>
`;

const lifecycle = (state: AgentToolState, label: string, statusLabel?: string) =>
  frame(html`
    <ds-agent-tool-call
      name="records.search"
      .label=${label}
      .state=${state}
      .statusLabel=${statusLabel}
    ></ds-agent-tool-call>
  `);

export const Preparing: Story = {
  render: () => lifecycle('preparing', 'Preparing service-record search'),
};

export const Queued: Story = {
  render: () => lifecycle('queued', 'Service-record search'),
};

export const Running: Story = {
  render: () => lifecycle('running', 'Searching service records…'),
};

export const WaitingForUser: Story = {
  render: () => lifecycle('waiting-for-user', 'Confirm the service period'),
};

export const SuccessWithoutDetails: Story = {
  render: () => lifecycle('success', 'Searched 8 sources'),
};

export const SuccessWithGenericDiagnostics: Story = {
  render: () =>
    frame(html`
      <ds-agent-tool-call
        open
        name="records.search"
        label="Searched service records"
        state="success"
        .input=${{ period: '30 days' }}
        .output=${{ matches: 12 }}
      ></ds-agent-tool-call>
    `),
};

export const Error: Story = {
  render: () =>
    frame(html`
      <ds-agent-tool-call
        name="records.search"
        label="Could not search service records"
        state="error"
        error="The records service did not respond."
      ></ds-agent-tool-call>
    `),
};

export const Denied: Story = {
  render: () => lifecycle('denied', 'Create work orders'),
};

export const Canceled: Story = {
  render: () => lifecycle('canceled', 'Export service records'),
};

export const CustomGitHubResult: Story = {
  render: () =>
    frame(html`
      <ds-agent-tool-call name="github.createIssue" state="success">
        <ds-text slot="summary" as="span" variant="text-body-small" emphasis>
          Created GitHub issue
        </ds-text>
        <a
          slot="result"
          href="https://github.com/zainadeel/compomo/issues/443"
          style="color:var(--color-foreground-primary);"
        >
          #443 · Expand conversation UX
        </a>
      </ds-agent-tool-call>
    `),
};

export const CustomResultWithGenericDiagnostics: Story = {
  render: () =>
    frame(html`
      <ds-agent-tool-call
        name="github.createIssue"
        label="Created GitHub issue"
        state="success"
        .input=${{ repository: 'zainadeel/compomo' }}
        .output=${{ number: 443 }}
      >
        <div slot="result">
          <ds-text variant="text-body-small" emphasis>#443 · Expand conversation UX</ds-text>
        </div>
      </ds-agent-tool-call>
    `),
};

export const CustomDetails: Story = {
  render: () =>
    frame(html`
      <ds-agent-tool-call open name="deploy.preview" label="Created preview" state="success">
        <div slot="details">
          <ds-text variant="text-body-small">Application-owned deployment detail</ds-text>
        </div>
      </ds-agent-tool-call>
    `),
};

export const NarrowLongName: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => html`
    <div style="width:300px;">
      <ds-agent-tool-call
        name="service_records_search_for_the_complete_preventive_maintenance_period"
        state="waiting-for-user"
      ></ds-agent-tool-call>
    </div>
  `,
};

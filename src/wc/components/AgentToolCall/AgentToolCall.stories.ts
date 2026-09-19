import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { AgentToolState } from '../conversation-types';
import '../../../../dist/components/ds-agent-tool-call.js';
import '../../../../dist/components/ds-text.js';
import '../../../../dist/components/ds-button-unfilled.js';

export default { title: 'Agent/Tool call', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;

const frame = (content: unknown) => html` <div style="width:min(720px, 90vw);">${content}</div> `;

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
          style="color:inherit;text-decoration:none;"
        >
          <ds-text
            as="span"
            variant="text-body-medium"
            color="brand"
            decoration="underline"
            emphasis
          >
            #443 · Expand conversation UX
          </ds-text>
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

export const PlainTextResult: Story = {
  render: () =>
    frame(html`
      <ds-agent-tool-call name="records.update" label="Updated maintenance plan" state="success">
        <span slot="result">The revised plan now includes three priority vehicles.</span>
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

export const Reconnection: Story = {
  render: () => {
    let tool: HTMLElement | undefined;
    const reinsert = () => {
      const parent = tool?.parentElement;
      if (!tool || !parent) return;
      tool.remove();
      parent.append(tool);
    };
    const toggleDetails = () => {
      if (!tool) return;
      const existing = tool.querySelector('[slot="details"]');
      if (existing) {
        existing.remove();
      } else {
        const details = document.createElement('ds-text');
        details.slot = 'details';
        details.variant = 'text-body-small';
        details.textContent = 'Application-supplied diagnostics added after the tool was rendered.';
        tool.append(details);
      }
    };
    return frame(html`
      <div style="display:grid;gap:var(--dimension-space-200);">
        <ds-text as="p" variant="text-body-small" color="secondary">
          Reinsert the tool, then add or remove its details. The disclosure should follow the
          supplied content.
        </ds-text>
        <div style="display:flex;flex-wrap:wrap;gap:var(--dimension-space-100);">
          <ds-button-unfilled label="Reinsert tool" @dsClick=${reinsert}></ds-button-unfilled>
          <ds-button-unfilled label="Toggle details" @dsClick=${toggleDetails}></ds-button-unfilled>
        </div>
        <div>
          <ds-agent-tool-call
            name="records.search"
            label="Searched service records"
            state="success"
            open
            ${ref(element => {
              tool = element as HTMLElement | undefined;
            })}
          >
            <span slot="result">Found 12 matching records.</span>
          </ds-agent-tool-call>
        </div>
      </div>
    `);
  },
};

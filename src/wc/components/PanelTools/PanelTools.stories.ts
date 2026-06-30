import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-panel-tools.js';

const meta: Meta = {
  title: 'Navigation/PanelTools',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

function toolsShell(open: boolean, activeTool: 'search' | 'inbox' | 'agents') {
  return html`
    <div
      style="
        display: flex;
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      "
    >
      <div
        style="
          flex: 1;
          min-width: 0;
          padding: var(--dimension-space-400);
          color: var(--color-foreground-secondary);
        "
      >
        Page content — tools panel pushes this area when open.
      </div>
      <ds-panel-tools ?open=${open} active-tool=${activeTool}>
        <p slot="search">Search content placeholder</p>
        <p slot="inbox">Inbox content placeholder</p>
        <p slot="agents">Agents content placeholder</p>
      </ds-panel-tools>
    </div>
  `;
}

export const SearchOpen: Story = {
  name: 'Search open',
  render: () => toolsShell(true, 'search'),
};

export const InboxOpen: Story = {
  name: 'Inbox open',
  render: () => toolsShell(true, 'inbox'),
};

export const AgentsOpen: Story = {
  name: 'Agents open',
  render: () => toolsShell(true, 'agents'),
};

export const Closed: Story = {
  name: 'Closed',
  render: () => toolsShell(false, 'agents'),
};

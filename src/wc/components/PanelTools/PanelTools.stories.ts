import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-panel-tools.js';
import type { PanelToolsToolId } from './panel-tools-types';

const meta: Meta = {
  title: 'Navigation/PanelTools',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

function toolsShell(open: boolean, activeTool: PanelToolsToolId) {
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
        <p slot="messages">Messages content placeholder</p>
        <p slot="stacks">Stacks content placeholder</p>
        <p slot="activity">Activity content placeholder</p>
        <p slot="agents">Agents content placeholder</p>
      </ds-panel-tools>
    </div>
  `;
}

export const SearchOpen: Story = {
  name: 'Search open',
  render: () => toolsShell(true, 'search'),
};

export const MessagesOpen: Story = {
  name: 'Messages open',
  render: () => toolsShell(true, 'messages'),
};

export const StacksOpen: Story = {
  name: 'Stacks open',
  render: () => toolsShell(true, 'stacks'),
};

export const ActivityOpen: Story = {
  name: 'Activity open',
  render: () => toolsShell(true, 'activity'),
};

export const AgentsOpen: Story = {
  name: 'Agents open',
  render: () => toolsShell(true, 'agents'),
};

export const Closed: Story = {
  name: 'Closed',
  render: () => toolsShell(false, 'agents'),
};

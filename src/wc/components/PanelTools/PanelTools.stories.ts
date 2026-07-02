import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-panel-tools.js';
import '../../../../dist/components/ds-app-shell.js';
import type { PanelToolsItem, PanelToolsToolId } from './panel-tools-types';

const RAIL_ITEMS: PanelToolsItem[] = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents', selected: true },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true },
];

const meta: Meta = {
  title: 'Navigation/PanelTools',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

function toolsShell(open: boolean, activeTool: PanelToolsToolId) {
  const items = RAIL_ITEMS.map(item => ({
    ...item,
    selected: open && item.id === activeTool,
  }));

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
          display: flex;
          flex-direction: column;
        "
      >
        <div
          style="
            height: var(--dimension-size-600);
            border-bottom: 1px solid var(--color-border-tertiary);
            background: var(--color-background-secondary);
          "
        ></div>
        <div
          style="
            flex: 1;
            min-height: 0;
            padding: var(--dimension-space-400);
            color: var(--color-foreground-secondary);
          "
        >
          Page content — drawer opens beside the rail and narrows this column.
        </div>
      </div>
      <ds-panel-tools ?open=${open} active-tool=${activeTool} .items=${items}>
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

export const RailOnly: Story = {
  name: 'Rail only',
  render: () => toolsShell(false, 'agents'),
};

export const Interactive: Story = {
  name: 'Interactive rail',
  parameters: {
    docs: {
      description: {
        story:
          'Click rail icons to toggle the drawer. `dsToolChange` emits `{ id, selected }` — ' +
          'hosts mirror selection into `open` and `activeTool`.',
      },
    },
  },
  render: () => html`
    <div
      style="
        display: flex;
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      "
      ${ref(root => {
        if (!root) return;
        const tools = root.querySelector('ds-panel-tools') as HTMLElement & {
          open: boolean;
          activeTool: PanelToolsToolId | '';
          items: PanelToolsItem[];
        } | null;
        const status = root.querySelector('#panel-tools-status');
        if (!tools || !status) return;

        tools.items = RAIL_ITEMS.map(item => ({ ...item, selected: false }));
        tools.open = false;
        tools.activeTool = '';

        tools.addEventListener('dsToolChange', (e: Event) => {
          const { id, selected } = (e as CustomEvent<{ id: PanelToolsToolId; selected: boolean }>).detail;
          tools.open = selected;
          tools.activeTool = selected ? id : '';
          tools.items = RAIL_ITEMS.map(item => ({
            ...item,
            selected: selected && item.id === id,
          }));
          status.textContent = selected
            ? `open · activeTool="${id}"`
            : 'closed';
        });
      })}
    >
      <div style="flex: 1; min-width: 0; padding: var(--dimension-space-400); color: var(--color-foreground-secondary);">
        <p style="margin: 0 0 8px;">Click a rail icon — drawer opens beside the 48px column.</p>
        <p style="margin: 0; font-size: 12px;" id="panel-tools-status">closed</p>
      </div>
      <ds-panel-tools>
        <p slot="search">Search content</p>
        <p slot="messages">Messages content</p>
        <p slot="stacks">Stacks content</p>
        <p slot="activity">Activity content</p>
        <p slot="agents">Agents content</p>
      </ds-panel-tools>
    </div>
  `,
};

export const InGradientShell: Story = {
  name: 'In gradient shell',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Drawer and rail surfaces are transparent under `ds-app-shell[gradient]` — chrome paints behind them.',
      },
    },
  },
  render: () => html`
    <div
      style="
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      "
    >
      <ds-app-shell nav-style="dashboard" gradient style="height: 100%;">
        <div style="flex: 1; min-width: 0; padding: var(--dimension-space-400); color: var(--color-foreground-secondary);">
          Page content beside the tools rail.
        </div>
        <ds-panel-tools
          slot="tools"
          open
          active-tool="agents"
          .items=${RAIL_ITEMS.map(item => ({
            ...item,
            selected: item.id === 'agents',
          }))}
        >
          <p slot="agents">Agents drawer over shell chrome</p>
        </ds-panel-tools>
      </ds-app-shell>
    </div>
  `,
};

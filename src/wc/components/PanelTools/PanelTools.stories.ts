import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-panel-tools.js';
import '../../../../dist/components/ds-app-shell.js';
import type { PanelToolsItem, PanelToolsToolId } from './panel-tools-types';

const RAIL_ITEMS: PanelToolsItem[] = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true },
  { id: 'help', icon: 'CircleQuestion', ariaLabel: 'Help & Support' },
];

const meta: Meta = {
  title: 'Navigation/PanelTools',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Tool rail + sliding drawer. Each tool has a **named slot** (`search`, `agents`, `messages`, `stacks`, `activity`, `help`) for its own composed UI. Search sits in the rail header; **Help & Support** is flush to the rail footer. The component shows the active tool’s slot while the drawer is open; closing slides the drawer shut without unmounting slotted content.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const wiredGradientTools = new WeakSet<Element>();

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
        <p slot="search">Search tool UI — compose a full feature panel here.</p>
        <p slot="messages">Messages tool UI</p>
        <p slot="stacks">Stacks tool UI</p>
        <p slot="activity">Activity tool UI</p>
        <p slot="agents">Agents tool UI</p>
        <p slot="help">Help &amp; Support tool UI</p>
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

export const HelpOpen: Story = {
  name: 'Help & Support open',
  render: () => toolsShell(true, 'help'),
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
          'Rail selection follows `open` immediately. Each tool’s slotted UI stays mounted when switching tools or closing the drawer.',
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

        tools.items = RAIL_ITEMS;
        tools.open = false;
        tools.activeTool = '';

        tools.addEventListener('dsToolChange', (e: Event) => {
          const { id, selected } = (e as CustomEvent<{ id: PanelToolsToolId; selected: boolean }>).detail;
          tools.open = selected;
          if (selected) tools.activeTool = id;
          status.textContent = selected
            ? `open · activeTool="${id}"`
            : `closed · lastTool="${tools.activeTool}"`;
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
        <p slot="help">Help &amp; Support content</p>
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
      ${ref(root => {
        if (!root || wiredGradientTools.has(root)) return;
        wiredGradientTools.add(root);
        const shell = root.querySelector('ds-app-shell');
        const tools = root.querySelector('ds-panel-tools') as HTMLElement & {
          open: boolean;
          activeTool: PanelToolsToolId | '';
          items: PanelToolsItem[];
        } | null;
        if (!tools) return;
        tools.items = RAIL_ITEMS;
        tools.open = false;
        tools.activeTool = '';
        tools.addEventListener('dsToolChange', (e: Event) => {
          const { id, selected } = (e as CustomEvent<{ id: PanelToolsToolId; selected: boolean }>).detail;
          tools.open = selected;
          if (selected) tools.activeTool = id;
        });
        void shell;
      })}
    >
      <ds-app-shell nav-style="dashboard" gradient style="height: 100%;">
        <div style="flex: 1; min-width: 0; padding: var(--dimension-space-400); color: var(--color-foreground-secondary);">
          Page content beside the tools rail. Shell shortcuts: K search, A agents, S stacks, M messages, N activity — repeat toggles closed.
        </div>
        <ds-panel-tools slot="tools">
          <p slot="search">Search drawer over shell chrome</p>
          <p slot="agents">Agents drawer over shell chrome</p>
          <p slot="messages">Messages drawer over shell chrome</p>
          <p slot="stacks">Stacks drawer over shell chrome</p>
          <p slot="activity">Activity drawer over shell chrome</p>
          <p slot="help">Help &amp; Support drawer over shell chrome</p>
        </ds-panel-tools>
      </ds-app-shell>
    </div>
  `,
};

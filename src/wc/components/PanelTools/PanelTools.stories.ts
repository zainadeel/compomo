import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-panel-tools.js';
import '../../../../dist/components/ds-shell-app.js';
import '../../../../dist/components/ds-panel-tool-header.js';
import '../../../../dist/components/ds-message-scroller.js';
import '../../../../dist/components/ds-message-composer.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-empty-state.js';
import type {
  PanelToolsHeaderAction,
  PanelToolsHeaders,
  PanelToolsItem,
  PanelToolsToolId,
} from './panel-tools-types';

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
          'Tool rail + sliding 300px drawer. Each tool supports a backward-compatible body slot (`search`, `agents`, `messages`, `stacks`, `activity`, `help`) and a full-view slot (`search-view`, `agents-view`, and so on). PanelTools owns the shared drawer header; split fullscreen layouts may compose one header per visible pane. Closing uses a clipped reveal and keeps slotted content mounted.',
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

function agentsFullView(presentation: 'drawer' | 'fullscreen') {
  const headers: PanelToolsHeaders = {
    agents: {
      title: 'New agent chat',
      showBack: true,
      actions: [
        {
          id: 'menu',
          icon: 'Ellipses',
          ariaLabel: 'Chat options',
          triggerId: 'storybook-agent-menu',
          haspopup: 'menu',
        },
      ],
    },
  };
  const listActions: PanelToolsHeaderAction[] = [
    {
      id: 'menu',
      icon: 'Ellipses',
      ariaLabel: 'Agents options',
      haspopup: 'menu',
    },
  ];
  const chatActions: PanelToolsHeaderAction[] = [
    {
      id: 'fullscreen',
      icon: 'PanelCollapse',
      ariaLabel: 'Exit fullscreen',
      pressed: true,
    },
    {
      id: 'menu',
      icon: 'Ellipses',
      ariaLabel: 'Chat options',
      haspopup: 'menu',
    },
  ];
  const fullscreen = presentation === 'fullscreen';
  return html`
    <div style="height:100vh; background:var(--color-background-primary);">
      <ds-shell-app style="height:100%;">
        <div style="padding:var(--dimension-space-400);">
          Page content becomes inert in fullscreen.
        </div>
        <ds-panel-tools
          slot="tools"
          open
          active-tool="agents"
          presentation=${presentation}
          fullscreen-header-mode=${fullscreen ? 'split' : 'shared'}
          .items=${RAIL_ITEMS}
          .headers=${headers}
        >
          ${fullscreen
            ? html`
                <section
                  slot="agents-view"
                  style="display:grid; grid-template-columns:var(--dimension-panel-width-xs) minmax(0,1fr); height:100%;"
                >
                  <div
                    style="display:grid; grid-template-rows:auto minmax(0,1fr); min-width:0; border-right:var(--dimension-stroke-width-012) solid var(--color-border-tertiary); background:var(--color-background-primary);"
                  >
                    <ds-panel-tool-header
                      heading="Agents"
                      .showMenu=${false}
                      .actions=${listActions}
                    ></ds-panel-tool-header>
                    <div style="padding:var(--dimension-space-200);">
                      Chat history remains visible here.
                    </div>
                  </div>
                  <div style="display:grid; grid-template-rows:auto minmax(0,1fr); min-width:0;">
                    <ds-panel-tool-header
                      heading="Plan a service route"
                      .showMenu=${false}
                      .actions=${chatActions}
                    ></ds-panel-tool-header>
                    <ds-message-scroller messages-label="Agent conversation">
                      <ds-empty-state
                        heading="What can I help with?"
                        body="This prototype uses scripted responses."
                      ></ds-empty-state>
                      <div slot="overlay" style="padding:var(--dimension-space-100);">
                        <ds-message-composer label="Message agent" placeholder="Ask the agent">
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
                </section>
              `
            : html`
                <section slot="agents-view" style="height:100%;">
                  <ds-message-scroller messages-label="Agent conversation">
                    <ds-empty-state
                      heading="What can I help with?"
                      body="This prototype uses scripted responses."
                    ></ds-empty-state>
                    <div slot="overlay" style="padding:var(--dimension-space-100);">
                      <ds-message-composer label="Message agent" placeholder="Ask the agent">
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
                </section>
              `}
        </ds-panel-tools>
      </ds-shell-app>
    </div>
  `;
}

export const AgentsFullViewDrawer: Story = {
  name: 'Agents full view · drawer',
  render: () => agentsFullView('drawer'),
};

export const AgentsFullViewFullscreen: Story = {
  name: 'Agents full view · fullscreen',
  render: () => agentsFullView('fullscreen'),
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
        const tools = root.querySelector('ds-panel-tools') as
          | (HTMLElement & {
              open: boolean;
              activeTool: PanelToolsToolId | '';
              items: PanelToolsItem[];
            })
          | null;
        const status = root.querySelector('#panel-tools-status');
        if (!tools || !status) return;

        tools.items = RAIL_ITEMS;
        tools.open = false;
        tools.activeTool = '';

        tools.addEventListener('dsToolChange', (e: Event) => {
          const { id, selected } = (e as CustomEvent<{ id: PanelToolsToolId; selected: boolean }>)
            .detail;
          tools.open = selected;
          if (selected) tools.activeTool = id;
          status.textContent = selected
            ? `open · activeTool="${id}"`
            : `closed · lastTool="${tools.activeTool}"`;
        });
      })}
    >
      <div
        style="flex: 1; min-width: 0; padding: var(--dimension-space-400); color: var(--color-foreground-secondary);"
      >
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
          'Drawer and rail surfaces are transparent when ShellApp uses a wash preset — chrome paints behind them.',
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
        const shell = root.querySelector('ds-shell-app');
        const tools = root.querySelector('ds-panel-tools') as
          | (HTMLElement & {
              open: boolean;
              activeTool: PanelToolsToolId | '';
              items: PanelToolsItem[];
            })
          | null;
        if (!tools) return;
        tools.items = RAIL_ITEMS;
        tools.open = false;
        tools.activeTool = '';
        tools.addEventListener('dsToolChange', (e: Event) => {
          const { id, selected } = (e as CustomEvent<{ id: PanelToolsToolId; selected: boolean }>)
            .detail;
          tools.open = selected;
          if (selected) tools.activeTool = id;
        });
        void shell;
      })}
    >
      <ds-shell-app nav-style="dashboard" gradient style="height: 100%;">
        <div
          style="flex: 1; min-width: 0; padding: var(--dimension-space-400); color: var(--color-foreground-secondary);"
        >
          Page content beside the tools rail. Shell shortcuts: K search, A agents, S stacks, M
          messages, N activity, / help — repeat toggles closed.
        </div>
        <ds-panel-tools slot="tools">
          <p slot="search">Search drawer over shell chrome</p>
          <p slot="agents">Agents drawer over shell chrome</p>
          <p slot="messages">Messages drawer over shell chrome</p>
          <p slot="stacks">Stacks drawer over shell chrome</p>
          <p slot="activity">Activity drawer over shell chrome</p>
          <p slot="help">Help &amp; Support drawer over shell chrome</p>
        </ds-panel-tools>
      </ds-shell-app>
    </div>
  `,
};

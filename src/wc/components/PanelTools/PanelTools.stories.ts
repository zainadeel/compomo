import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-panel-tools.js';
import '../../../../dist/components/ds-shell-app.js';
import '../../../../dist/components/ds-panel-tool-header.js';
import '../../../../dist/components/ds-message-scroller.js';
import '../../../../dist/components/ds-message-composer.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-empty-state.js';
import type {
  PanelToolsHeaderAction,
  PanelToolsHeaders,
  PanelToolsItem,
  PanelToolsRailAccessory,
  PanelToolsToolId,
} from './panel-tools-types';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';

const RAIL_ITEMS: PanelToolsItem[] = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
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
      ...isolatedOverlayDocs('720px'),
      description: {
        component:
          'Tool rail + sliding 300px drawer with an optional governed rail-accessory collection for decorative boundaries and direct application intents. Each tool supports a backward-compatible body slot (`search`, `agents`, `messages`, `stacks`, `activity`, `help`) and a full-view slot (`search-view`, `agents-view`, and so on). PanelTools owns rail geometry, keyboard order, overflow, the shared drawer header, and accessory intent events; split fullscreen layouts may compose one header per visible pane. Rail tooltips are shell-owned and may cross the tools lane into the viewport. Closing uses a clipped reveal and keeps slotted content mounted.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const wiredGradientTools = new WeakSet<Element>();
const wiredDynamicAccessories = new WeakSet<Element>();

function toolsShell(
  open: boolean,
  activeTool: PanelToolsToolId,
  accessories: PanelToolsRailAccessory[] = []
) {
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
        font-family: var(--typography-font-family-ui, system-ui);
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
      <ds-panel-tools
        ?open=${open}
        active-tool=${activeTool}
        .items=${items}
        .accessories=${accessories}
      >
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

export const ExistingToolsNoAccessories: Story = {
  name: 'Existing tools · no accessories',
  parameters: {
    docs: {
      description: {
        story:
          'The existing PanelToolsItem rail and dsToolChange drawer behavior are unchanged when accessories are omitted.',
      },
    },
  },
  render: () => toolsShell(false, 'search'),
};

const ACTIVE_SESSION_ACCESSORIES: PanelToolsRailAccessory[] = [
  {
    type: 'divider',
    id: 'active-session-boundary',
    railPlacement: 'body',
    order: 10,
  },
  {
    type: 'transient',
    id: 'active-session',
    railPlacement: 'body',
    order: 11,
    ariaLabel: 'Active session',
    visual: { type: 'initial', initial: 'AS' },
    statusText: 'Active for 12 minutes',
    statusTone: 'positive',
    primaryAction: { id: 'restore', ariaLabel: 'Restore active session' },
    secondaryAction: {
      id: 'cancel',
      icon: 'PhoneDisconnect',
      ariaLabel: 'Cancel call',
    },
  },
];

export const ActiveSessionAccessory: Story = {
  name: 'Accessory · active session',
  parameters: {
    docs: {
      description: {
        story:
          'A decorative group boundary followed by a bold positive-status surface for an active call. The initial restores the session and the rounded PhoneDisconnect action cancels it without opening a drawer.',
      },
    },
  },
  render: () => toolsShell(false, 'search', ACTIVE_SESSION_ACCESSORIES),
};

const PINNED_CONVERSATION_ACCESSORIES: PanelToolsRailAccessory[] = [
  {
    type: 'divider',
    id: 'pinned-conversation-boundary',
    railPlacement: 'body',
    order: 11,
  },
  {
    type: 'shortcut',
    id: 'pinned-conversation',
    railPlacement: 'body',
    order: 12,
    ariaLabel: 'Pinned conversation',
    initials: 'PC',
    dot: true,
    action: {
      id: 'open',
      ariaLabel: 'Open pinned conversation',
    },
  },
];

export const PinnedConversationAccessory: Story = {
  name: 'Accessory · pinned conversation',
  parameters: {
    docs: {
      description: {
        story:
          'A compact initial-orb shortcut with a supplemental notification dot. It emits an application intent without selecting a tool or owning a drawer.',
      },
    },
  },
  render: () => toolsShell(false, 'search', PINNED_CONVERSATION_ACCESSORIES),
};

const ACTIVE_CALL_AND_PINNED_CONVERSATION_ACCESSORIES: PanelToolsRailAccessory[] = [
  ...ACTIVE_SESSION_ACCESSORIES,
  {
    type: 'divider',
    id: 'pinned-conversations-boundary',
    railPlacement: 'body',
    order: 12,
  },
  {
    type: 'shortcut',
    id: 'pinned-conversation',
    railPlacement: 'body',
    order: 13,
    ariaLabel: 'Pinned conversation',
    initials: 'PC',
    dot: true,
    action: {
      id: 'open',
      ariaLabel: 'Open pinned conversation with new messages',
    },
  },
  {
    type: 'shortcut',
    id: 'pinned-broadcast',
    railPlacement: 'body',
    order: 14,
    ariaLabel: 'Pinned broadcast',
    initials: 'B',
    action: {
      id: 'open',
      ariaLabel: 'Open pinned broadcast',
    },
  },
  {
    type: 'shortcut',
    id: 'pinned-route-team',
    railPlacement: 'body',
    order: 15,
    ariaLabel: 'Pinned route team conversation',
    initials: 'RT',
    dot: true,
    action: {
      id: 'open',
      ariaLabel: 'Open pinned route team conversation with new messages',
    },
  },
];

export const ActiveCallAndPinnedConversations: Story = {
  name: 'Accessory · active call and pinned conversations',
  parameters: {
    docs: {
      description: {
        story:
          'When both accessory types are present, the active call stays first. A second decorative boundary separates it from three ordered pinned-conversation shortcuts below; notification dots remain shortcut-only.',
      },
    },
  },
  render: () => toolsShell(false, 'search', ACTIVE_CALL_AND_PINNED_CONVERSATION_ACCESSORIES),
};

export const DynamicAccessories: Story = {
  name: 'Accessory · dynamic add and remove',
  parameters: {
    docs: {
      description: {
        story:
          'Adds and removes an active-session accessory while Search remains open. The mounted Search view and active drawer are preserved.',
      },
    },
  },
  render: () => html`
    <div
      style="
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family-ui, system-ui);
      "
      ${ref(root => {
        if (!root || wiredDynamicAccessories.has(root)) return;
        wiredDynamicAccessories.add(root);
        const tools = root.querySelector('ds-panel-tools') as
          | (HTMLDsPanelToolsElement & { accessories: PanelToolsRailAccessory[] })
          | null;
        const toggle = root.querySelector('#toggle-panel-accessory');
        const status = root.querySelector('#dynamic-accessory-status');
        if (!tools || !toggle || !status) return;
        let visible = true;
        tools.items = RAIL_ITEMS;
        tools.accessories = ACTIVE_SESSION_ACCESSORIES;
        toggle.addEventListener('dsClick', () => {
          visible = !visible;
          tools.accessories = visible ? ACTIVE_SESSION_ACCESSORIES : [];
          status.textContent = visible
            ? 'Accessory present · Search drawer remains open'
            : 'Accessory removed · Search drawer remains open';
        });
      })}
    >
      <div
        style="
          display: flex;
          align-items: center;
          gap: var(--dimension-space-100);
          padding: var(--dimension-space-100);
          border-bottom: var(--dimension-stroke-width-012) solid var(--color-border-tertiary);
        "
      >
        <ds-button-filled id="toggle-panel-accessory" label="Add or remove accessory" />
        <ds-text id="dynamic-accessory-status" as="span" variant="text-body-small">
          Accessory present · Search drawer remains open
        </ds-text>
      </div>
      <div style="display: flex; min-height: 0;">
        <main style="flex: 1; min-width: 0; padding: var(--dimension-space-400);">
          Routed page content
        </main>
        <ds-panel-tools open active-tool="search">
          <label slot="search">
            Mounted Search draft
            <input value="This input keeps its value" />
          </label>
        </ds-panel-tools>
      </div>
    </div>
  `,
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
        font-family: var(--typography-font-family-ui, system-ui);
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
        font-family: var(--typography-font-family-ui, system-ui);
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

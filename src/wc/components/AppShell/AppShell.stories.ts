import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-app-shell.js';
import '../../../../dist/components/ds-panel-nav.js';
import '../../../../dist/components/ds-bar-nav.js';
import '../../../../dist/components/ds-panel-tools.js';
import type { PanelNavGroup } from '../PanelNav/panel-nav-types';
import type { PanelToolsItem } from '../PanelTools/panel-tools-types';

const PANEL_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'area-a', icon: 'MapPage', label: 'Area A' },
      { id: 'area-b', icon: 'ShieldCircle', label: 'Area B' },
    ],
  },
  {
    label: 'Section 1',
    items: [
      { id: 'area-c', icon: 'Chart', label: 'Area C' },
      { id: 'area-d', icon: 'FuelPump', label: 'Area D' },
    ],
  },
];

const BAR_TABS = [
  { id: 'tab-1', label: 'Tab 1' },
  { id: 'tab-2', label: 'Tab 2', dot: true },
];

const PANEL_TOOLS_ITEMS: PanelToolsItem[] = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
];

const wiredPanelTools = new WeakSet<Element>();

function bindTabChange(nav: HTMLElement & { value: string }) {
  nav.addEventListener('dsTabChange', (e: Event) => {
    nav.value = (e as CustomEvent<string>).detail;
  });
}

function wirePanelTools(el: Element | null) {
  if (!el || wiredPanelTools.has(el)) return;
  wiredPanelTools.add(el);

  const tools = el as HTMLElement & {
    open: boolean;
    activeTool: string;
    items: PanelToolsItem[];
  };
  tools.items = PANEL_TOOLS_ITEMS;
  tools.open = false;
  tools.activeTool = '';

  tools.addEventListener('dsToolChange', (e: Event) => {
    const { id, selected } = (e as CustomEvent<{ id: string; selected: boolean }>).detail;
    tools.open = selected;
    if (selected) tools.activeTool = id;
  });
}

function shellLayout(gradient: boolean): TemplateResult {
  return html`
    <div
      style="
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      "
    >
      <ds-app-shell nav-style="dashboard" ?gradient=${gradient} style="height: 100%;">
        <ds-panel-nav
          slot="panel"
          nav-style="dashboard"
          .groups=${PANEL_GROUPS}
          active-id="area-b"
          user-name="User Name"
          user-initial="U"
        ></ds-panel-nav>
        <ds-bar-nav
          slot="bar"
          nav-style="dashboard"
          base-path="/example"
          .tabs=${BAR_TABS}
          value="tab-2"
          ${ref(el => {
            if (!el) return;
            bindTabChange(el as HTMLElement & { value: string });
          })}
        ></ds-bar-nav>
        <ds-panel-tools slot="tools" ${ref(wirePanelTools)}></ds-panel-tools>
      </ds-app-shell>
    </div>
  `;
}

const meta: Meta = {
  title: 'Navigation/AppShell',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const WithGradient: Story = {
  name: 'With gradient',
  render: () => shellLayout(true),
};

export const WithoutGradient: Story = {
  name: 'Without gradient',
  render: () => shellLayout(false),
};

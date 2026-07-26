import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-shell-app.js';
import '../../../../dist/components/ds-panel-nav.js';
import '../../../../dist/components/ds-bar-nav.js';
import '../../../../dist/components/ds-bar-title.js';
import '../../../../dist/components/ds-panel-tools.js';
import '../../../../dist/components/ds-shell-tools.js';
import '../../../../dist/components/ds-mobile-bar-nav.js';
import '../../../../dist/components/ds-mobile-sheet-nav.js';
import '../../../../dist/components/ds-mobile-header.js';
import '../../../../dist/components/ds-shell-page.js';
import type { PanelNavGroup } from '../PanelNav/panel-nav-types';
import type { PanelToolsItem } from '../PanelTools/panel-tools-types';
import type { ShellGradientPreset } from '../../shell/shell-gradient-presets';

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
  { id: 'help', icon: 'CircleQuestion', ariaLabel: 'Help & Support' },
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

function shellLayout(gradientPreset: ShellGradientPreset): TemplateResult {
  return html`
    <div
      style="
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      "
    >
      <ds-shell-app nav-style="dashboard" gradient-preset=${gradientPreset} style="height: 100%;">
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
      </ds-shell-app>
    </div>
  `;
}

const meta: Meta = {
  title: 'Layout/ShellApp',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const WithGradient: Story = {
  name: 'With gradient',
  render: () => shellLayout('neutral'),
};

export const WithoutGradient: Story = {
  name: 'Without gradient',
  render: () => shellLayout('none'),
};

export const MobileFoundation: Story = {
  name: 'Mobile foundation',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: () => html`
    <div style="height: 100vh;">
      <ds-shell-app
        nav-style="dashboard"
        gradient-preset="warm"
        mobile-destination="area"
        style="height: 100%;"
      >
        <ds-panel-nav slot="panel" .groups=${PANEL_GROUPS}></ds-panel-nav>
        <ds-mobile-sheet-nav
          slot="mobile-sheet-nav"
          .dashboardGroups=${PANEL_GROUPS}
          .settingsGroups=${[]}
          current-url="/dashboard/area-a/tab-2"
        ></ds-mobile-sheet-nav>
        <ds-bar-nav
          slot="bar"
          .tabs=${BAR_TABS}
          base-path="/dashboard/area-a"
          current-url="/dashboard/area-a/tab-2"
        ></ds-bar-nav>
        <ds-shell-tools slot="tools" .items=${PANEL_TOOLS_ITEMS}>
          <div slot="search-view">Search tool</div>
          <div slot="agents-view">Agents tool</div>
          <div slot="messages-view">Messages tool</div>
        </ds-shell-tools>
        <ds-shell-page responsive-mode="mobile">
          <ds-bar-title slot="header" heading="Tab 2"></ds-bar-title>
          <ds-mobile-header
            slot="mobile-header"
            .sections=${BAR_TABS}
            value="tab-2"
            sections-aria-label="Change Area A page"
          ></ds-mobile-header>
          <main style="min-height: 100%; padding: var(--dimension-space-200); box-sizing: border-box;">
            Routed Area A content
          </main>
        </ds-shell-page>
        <ds-mobile-bar-nav
          slot="mobile-bar-nav"
          .currentArea=${{ id: 'area-a', icon: 'MapPage', label: 'Area A' }}
          active-destination="area"
          inbox-dot
        ></ds-mobile-bar-nav>
      </ds-shell-app>
    </div>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-app-shell.js';
import '../../../../dist/components/ds-panel-nav.js';
import '../../../../dist/components/ds-bar-nav.js';
import '../../../../dist/components/ds-panel-tools.js';
import {
  ensureShellNavVtStyle,
  runShellNavStyleRevealOnReady,
} from '../../nav/shell-view-transition';
import type { NavChromeStyle } from '../../nav/nav-chrome';
import type { PanelNavGroup } from '../PanelNav/panel-nav-types';
import type { PanelToolsItem } from '../PanelTools/panel-tools-types';

const DASHBOARD_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'fleet-view', icon: 'MapPage', label: 'Fleet View', href: '/dashboard/fleet-view' },
      { id: 'safety', icon: 'ShieldCircle', label: 'Safety', href: '/dashboard/safety' },
    ],
  },
];

const SETTINGS_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'user-settings', icon: 'Avatar', label: 'User Settings', href: '/settings/user-settings' },
    ],
  },
];

const SAFETY_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events', dot: true },
];

const PANEL_TOOLS_ITEMS: PanelToolsItem[] = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents', selected: true },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true },
];

function wireBarNav(el: Element | null) {
  if (!el) return;
  const nav = el as HTMLElement & {
    tabs: typeof SAFETY_TABS;
    basePath: string;
    currentUrl: string;
  };
  nav.tabs = SAFETY_TABS;
  nav.basePath = '/dashboard/safety';
  nav.currentUrl = '/dashboard/safety/events';
}

function wirePanelTools(el: Element | null) {
  if (!el) return;
  const tools = el as HTMLElement & {
    open: boolean;
    activeTool: string;
    items: PanelToolsItem[];
  };
  tools.open = true;
  tools.activeTool = 'agents';
  tools.items = PANEL_TOOLS_ITEMS;
}

function applySection(shellId: string, next: NavChromeStyle) {
  const shell = document.getElementById(shellId) as HTMLElement & { navStyle: NavChromeStyle } | null;
  const panel = shell?.querySelector('ds-panel-nav') as HTMLElement & {
    navStyle: NavChromeStyle;
    groups: string | PanelNavGroup[];
    activeId: string;
  } | null;
  const bar = shell?.querySelector('ds-bar-nav') as HTMLElement & { navStyle: NavChromeStyle } | null;
  if (!shell || !panel) return;

  shell.navStyle = next;
  panel.navStyle = next;
  if (bar) bar.navStyle = next;
  panel.groups = JSON.stringify(next === 'dashboard' ? DASHBOARD_GROUPS : SETTINGS_GROUPS);
  panel.activeId = next === 'dashboard' ? 'safety' : 'user-settings';
}

function toggleSection(shellId: string) {
  const shell = document.getElementById(shellId) as HTMLElement & { navStyle: NavChromeStyle } | null;
  if (!shell) return;
  const next: NavChromeStyle = shell.navStyle === 'dashboard' ? 'settings' : 'dashboard';
  applySection(shellId, next);
}

function toggleSectionWithViewTransition(shellId: string) {
  const shell = document.getElementById(shellId) as HTMLElement & { navStyle: NavChromeStyle } | null;
  if (!shell) return;

  const next: NavChromeStyle = shell.navStyle === 'dashboard' ? 'settings' : 'dashboard';
  const apply = () => applySection(shellId, next);

  if (!document.startViewTransition) {
    apply();
    return;
  }

  ensureShellNavVtStyle();
  const transition = document.startViewTransition(apply);
  runShellNavStyleRevealOnReady(transition);
}

function shellLayout(shellId: string, gradient: boolean): TemplateResult {
  return html`
    <div
      style="
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      "
    >
      <ds-app-shell id=${shellId} nav-style="dashboard" ?gradient=${gradient} style="height: 100%;">
        <ds-panel-nav
          slot="panel"
          nav-style="dashboard"
          disable-view-transition
          groups=${JSON.stringify(DASHBOARD_GROUPS)}
          active-id="safety"
          user-name="Zain Adeel"
          user-initial="Z"
          @dsNavFooterAction=${() => toggleSection(shellId)}
        ></ds-panel-nav>
        <ds-bar-nav slot="bar" nav-style="dashboard" ${ref(wireBarNav)}></ds-bar-nav>
        <ds-panel-tools slot="tools" ${ref(wirePanelTools)}>
          <p slot="agents">Agents tool content</p>
        </ds-panel-tools>
        <div style="padding: var(--dimension-space-400); color: var(--color-foreground-primary);">
          <p style="margin: 0 0 8px;">
            <code>ds-app-shell</code> syncs <code>navStyle</code> and optional L-gradient.
          </p>
          <p style="margin: 0; color: var(--color-foreground-secondary);">
            Footer gear toggles <code>dashboard</code> ↔ <code>settings</code> style slots.
          </p>
        </div>
      </ds-app-shell>
    </div>
  `;
}

const meta: Meta = {
  title: 'Navigation/AppShell',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const WithGradient: Story = {
  name: 'With gradient',
  render: () => shellLayout('shell-gradient', true),
};

export const NoGradient: Story = {
  name: 'No gradient',
  render: () => shellLayout('shell-plain', false),
};

export const SectionViewTransition: Story = {
  name: 'Section view transition',
  parameters: {
    docs: {
      description: {
        story:
          'Host-owned radial reveal when crossing `dashboard` ↔ `settings`. ' +
          'Uses `document.startViewTransition` + `runShellNavStyleRevealOnReady` from `@ds-mo/ui/nav`. ' +
          'Panel-nav sets `disable-view-transition` so the router (or Storybook) owns the animation.',
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
      <ds-app-shell id="shell-vt" nav-style="dashboard" gradient style="height: 100%;">
        <ds-panel-nav
          slot="panel"
          nav-style="dashboard"
          disable-view-transition
          groups=${JSON.stringify(DASHBOARD_GROUPS)}
          active-id="safety"
          user-name="Zain Adeel"
          user-initial="Z"
          @dsNavFooterAction=${() => toggleSectionWithViewTransition('shell-vt')}
        ></ds-panel-nav>
        <ds-bar-nav slot="bar" nav-style="dashboard" ${ref(wireBarNav)}></ds-bar-nav>
        <ds-panel-tools slot="tools" ${ref(wirePanelTools)}>
          <p slot="agents">Agents tool content</p>
        </ds-panel-tools>
        <div style="padding: var(--dimension-space-400); color: var(--color-foreground-primary);">
          <p style="margin: 0 0 8px;">
            Click the footer gear or the button below to run the radial reveal.
          </p>
          <button
            style="padding: 6px 14px; cursor: pointer; font-size: 13px;"
            @click=${() => toggleSectionWithViewTransition('shell-vt')}
          >
            Toggle section with view transition
          </button>
        </div>
      </ds-app-shell>
    </div>
  `,
};

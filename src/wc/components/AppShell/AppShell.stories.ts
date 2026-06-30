import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-app-shell.js';
import '../../../../dist/components/ds-panel-nav.js';
import '../../../../dist/components/ds-bar-nav.js';
import type { PanelNavGroup } from '../PanelNav/panel-nav-types';
import type { NavChromeStyle } from '../../nav/nav-chrome';
import {
  ensureShellNavVtStyle,
  runShellNavStyleRevealOnReady,
} from '../../nav/shell-view-transition';

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

const STYLE_BG: Record<NavChromeStyle, string> = {
  navigation: 'var(--color-background-primary)',
  default: 'var(--color-background-primary)',
};

const STYLE_GROUPS: Record<NavChromeStyle, PanelNavGroup[]> = {
  navigation: DASHBOARD_GROUPS,
  default: SETTINGS_GROUPS,
};

const SAFETY_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events', dot: true },
];

const BAR_ACTIONS = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
];

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

function wireBarNav(el: Element | null) {
  if (!el) return;
  const nav = el as HTMLElement & {
    tabs: typeof SAFETY_TABS;
    actions: typeof BAR_ACTIONS;
    basePath: string;
    currentUrl: string;
  };
  nav.tabs = SAFETY_TABS;
  nav.actions = BAR_ACTIONS;
  nav.basePath = '/dashboard/safety';
  nav.currentUrl = '/dashboard/safety/events';
}

function revealShellStyle(applyChange: () => void) {
  const doc = document as DocWithVT;
  if (typeof doc.startViewTransition !== 'function') {
    applyChange();
    return;
  }
  ensureShellNavVtStyle();
  const transition = doc.startViewTransition(() => applyChange());
  runShellNavStyleRevealOnReady(transition);
}

function switchShellStyle(shellId: string) {
  const shell = document.getElementById(shellId) as HTMLElement & {
    navStyle: NavChromeStyle;
  } | null;
  const panel = shell?.querySelector('ds-panel-nav') as HTMLElement & {
    navStyle: NavChromeStyle;
    groups: string | PanelNavGroup[];
    activeId: string;
  } | null;
  if (!shell || !panel) return;

  const next: NavChromeStyle = shell.navStyle === 'navigation' ? 'default' : 'navigation';
  revealShellStyle(() => {
    shell.navStyle = next;
    panel.groups = JSON.stringify(STYLE_GROUPS[next]);
    panel.activeId = next === 'navigation' ? 'safety' : 'user-settings';
  });
}

function shellLayout(
  shellId: string,
  navStyle: NavChromeStyle,
  gradient: boolean,
): TemplateResult {
  return html`
    <div
      style="
        height: 100vh;
        background: ${STYLE_BG[navStyle]};
        font-family: var(--typography-font-family, system-ui);
      "
    >
      <ds-app-shell
        id=${shellId}
        nav-style=${navStyle}
        ?gradient=${gradient}
        style="height: 100%;"
      >
        <ds-panel-nav
          slot="panel"
          disable-view-transition
          groups=${JSON.stringify(STYLE_GROUPS[navStyle])}
          active-id=${navStyle === 'navigation' ? 'safety' : 'user-settings'}
          user-name="Zain Adeel"
          user-initial="Z"
          @dsNavFooterAction=${() => switchShellStyle(shellId)}
        ></ds-panel-nav>
        <ds-bar-nav
          slot="bar"
          ${ref(wireBarNav)}
        ></ds-bar-nav>
        <div
          style="padding: var(--dimension-space-400); color: var(--color-foreground-primary);"
        >
          <p style="margin: 0 0 8px;">
            <code>ds-app-shell</code> syncs <code>navStyle</code> and optional L-gradient
            (unified radial at 10% opacity — blue medium → strong intent tokens).
          </p>
          <p style="margin: 0; color: var(--color-foreground-secondary);">
            Toggle chrome via panel footer gear. Main content has no gradient.
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

export const NavigationWithGradient: Story = {
  name: 'Navigation + gradient',
  render: () => shellLayout('shell-nav-gradient', 'navigation', true),
};

export const DefaultWithGradient: Story = {
  name: 'Default + gradient',
  render: () => shellLayout('shell-default-gradient', 'default', true),
};

export const NavigationNoGradient: Story = {
  name: 'Navigation (no gradient)',
  render: () => shellLayout('shell-nav-plain', 'navigation', false),
};

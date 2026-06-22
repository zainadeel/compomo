import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
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
  navigation: '#0f0f0f',
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
  { id: 'inbox', icon: 'Inbox', ariaLabel: 'Inbox', dot: true },
];

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

function revealShellStyle(applyChange: () => void) {
  const doc = document as DocWithVT;
  if (typeof doc.startViewTransition !== 'function') {
    applyChange();
    return;
  }

  ensureShellNavVtStyle();
  const transition = doc.startViewTransition(() => {
    applyChange();
  });
  runShellNavStyleRevealOnReady(transition);
}

function switchShellStyle(shellId: string) {
  const wrap = document.getElementById(shellId);
  const panel = wrap?.querySelector('ds-panel-nav') as HTMLElement & { navStyle: NavChromeStyle; groups: string | PanelNavGroup[] };
  const bar = wrap?.querySelector('ds-bar-nav') as HTMLElement & { navStyle: NavChromeStyle };
  if (!panel || !bar) return;

  const next: NavChromeStyle = panel.navStyle === 'navigation' ? 'default' : 'navigation';
  revealShellStyle(() => {
    panel.navStyle = next;
    panel.groups = JSON.stringify(STYLE_GROUPS[next]);
    bar.navStyle = next;
    if (wrap) wrap.style.background = STYLE_BG[next];
  });
}

function shellLayout(shellId: string, style: NavChromeStyle): TemplateResult {
  return html`
    <div
      id=${shellId}
      style="
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: ${STYLE_BG[style]};
        font-family: var(--typography-font-family, system-ui);
      "
    >
      <div style="display: flex; flex: 1; min-height: 0;">
        <ds-panel-nav
          nav-style=${style}
          disable-view-transition
          groups=${JSON.stringify(STYLE_GROUPS[style])}
          active-id=${style === 'navigation' ? 'safety' : 'user-settings'}
          user-name="Zain Adeel"
          user-initial="Z"
          @dsNavFooterAction=${() => switchShellStyle(shellId)}
        ></ds-panel-nav>
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
          <ds-bar-nav
            nav-style=${style}
            ${ref(el => {
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
            })}
          ></ds-bar-nav>
          <div style="flex: 1; padding: var(--dimension-space-400); color: var(--color-foreground-primary);">
            <p style="margin: 0 0 8px;">
              Panel nav + bar nav share <code>nav-style</code> — toggle via the footer gear button.
            </p>
            <p style="margin: 0; color: var(--color-foreground-secondary);">
              Radial reveal runs on both the page and the bar nav (Phase B).
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

const meta: Meta = {
  title: 'Navigation/Shell',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const NavigationStyle: Story = {
  name: 'Navigation style (synced)',
  render: () => shellLayout('shell-navigation', 'navigation'),
};

export const DefaultStyle: Story = {
  name: 'Default style (synced)',
  render: () => shellLayout('shell-default', 'default'),
};

export const ToggleStyle: Story = {
  name: 'Toggle style with radial reveal',
  render: () => shellLayout('shell-toggle', 'navigation'),
};

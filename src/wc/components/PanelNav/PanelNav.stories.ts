import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import '../../../../dist/components/ds-panel-nav.js';
import '../../../../dist/components/ds-icon.js';
import '../../../../dist/components/ds-text.js';
import type { NavChromeStyle } from '../../shell/nav-chrome';
import type { PanelNavGroup } from './panel-nav-types';

// ── Sample data (icon names verified against IcoMo) ───────────────────────

const DASHBOARD_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'area-a',            icon: 'MapPage',            label: 'Area A'              },
      { id: 'area-b',            icon: 'ShieldCircle',       label: 'Area B'              },
      { id: 'area-c',            icon: 'Chart',              label: 'Area C'              },
      { id: 'area-d',            icon: 'FuelPump',           label: 'Area D'              },
      { id: 'area-e',            icon: 'Card',               label: 'Area E'              },
      { id: 'area-f',            icon: 'Wrench',             label: 'Area F'              },
      { id: 'area-g',            icon: 'Person',             label: 'Area G'              },
    ],
  },
  {
    label: 'Section 1',
    items: [
      { id: 'area-h',            icon: 'Whistle',            label: 'Area H'              },
      { id: 'area-i',            icon: 'ShieldLock',         label: 'Area I'              },
      { id: 'area-j',            icon: 'WorkflowA',          label: 'Area J'              },
      { id: 'area-k',            icon: 'LocationPinArrows',  label: 'Area K'              },
      { id: 'area-l',            icon: 'Devices',            label: 'Area L'              },
    ],
  },
  {
    label: 'Section 2',
    items: [
      { id: 'area-m',            icon: 'AI',                 label: 'Area M'              },
      { id: 'area-n',            icon: 'MessageBubbleStack', label: 'Area N',     dot: true },
      { id: 'area-o',            icon: 'Document',           label: 'Area O'              },
      { id: 'area-p',            icon: 'GraphArrow',         label: 'Area P'              },
      { id: 'area-q',            icon: 'ShoppingBag',        label: 'Area Q'              },
      { id: 'area-r',            icon: 'Beaker',             label: 'Area R'              },
    ],
  },
];

const SETTINGS_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'item-1',            icon: 'Avatar',             label: 'Item 1'              },
    ],
  },
  {
    label: 'Section 3',
    items: [
      { id: 'item-2',            icon: 'BuildingOffice',     label: 'Item 2'              },
      { id: 'item-3',            icon: 'PersonManager',      label: 'Item 3'              },
      { id: 'item-4',            icon: 'PersonGroup',        label: 'Item 4'              },
    ],
  },
  {
    label: 'Section 4',
    items: [
      { id: 'item-5',            icon: 'DocumentGear',       label: 'Item 5'              },
      { id: 'item-6',            icon: 'Preferences',        label: 'Item 6'              },
      { id: 'item-7',            icon: 'Bolt',               label: 'Item 7'              },
      { id: 'item-8',            icon: 'Notification',       label: 'Item 8',     dot: true },
    ],
  },
  {
    label: 'Section 5',
    items: [
      { id: 'item-9',            icon: 'Mobile',             label: 'Item 9'              },
      { id: 'item-10',           icon: 'LockClosed',         label: 'Item 10'             },
      { id: 'item-11',           icon: 'BackslashBrackets',  label: 'Item 11'             },
      { id: 'item-12',           icon: 'DocumentPencil',     label: 'Item 12'             },
    ],
  },
];

// ── Shared story helpers ───────────────────────────────────────────────────

const STYLE_GROUPS: Record<NavChromeStyle, PanelNavGroup[]> = {
  dashboard: DASHBOARD_GROUPS,
  settings: SETTINGS_GROUPS,
};

const STYLE_ACTIVE: Record<NavChromeStyle, string> = {
  dashboard: 'area-a',
  settings: 'item-1',
};

function switchFooterStyle(id: string) {
  const el = document.getElementById(id) as HTMLElement & {
    navStyle: NavChromeStyle;
    groups: string | PanelNavGroup[];
    activeId: string;
  };
  if (!el) return;

  const next: NavChromeStyle = el.navStyle === 'dashboard' ? 'settings' : 'dashboard';
  el.navStyle = next;
  el.groups = JSON.stringify(STYLE_GROUPS[next]);
  el.activeId = STYLE_ACTIVE[next];
}

function interactiveDashboard(activeId = 'area-a', collapsed = false, breakpoint = 0): TemplateResult {
  return html`
    <div id="dash-nav-wrap" style="
      display: flex;
      height: 100vh;
      background: var(--color-background-primary);
      font-family: var(--typography-font-family, system-ui);
    ">
      <ds-panel-nav
        id="dash-nav"
        nav-style="dashboard"
        groups=${JSON.stringify(DASHBOARD_GROUPS)}
        active-id=${activeId}
        user-name="User Name"
        user-initial="U"
        .breakpoint=${breakpoint}
        ?collapsed=${collapsed}
        @dsNavSelect=${(e: CustomEvent<string>) => {
          const el = document.getElementById('dash-nav') as any;
          if (el) el.activeId = e.detail;
        }}
        @dsNavToggle=${(e: CustomEvent<boolean>) => {
          const el = document.getElementById('dash-nav') as any;
          if (el) el.collapsed = e.detail;
        }}
        @dsNavFooterAction=${() => switchFooterStyle('dash-nav')}
      ></ds-panel-nav>

      <div style="flex:1; padding: 24px; color: rgba(255,255,255,0.5); font-size: 13px;">
        <p style="margin: 0;">← Hover the logo to reveal the collapse toggle. Click the bottom-left button to switch sections.</p>
      </div>
    </div>
  `;
}

function interactiveSettings(activeId = 'item-1', collapsed = false): TemplateResult {
  return html`
    <div id="settings-nav-wrap" style="
      display: flex;
      height: 100vh;
      background: var(--color-background-primary);
      font-family: var(--typography-font-family, system-ui);
    ">
      <ds-panel-nav
        id="settings-nav"
        nav-style="settings"
        groups=${JSON.stringify(SETTINGS_GROUPS)}
        active-id=${activeId}
        user-name="User Name"
        user-initial="U"
        ?collapsed=${collapsed}
        @dsNavSelect=${(e: CustomEvent<string>) => {
          const el = document.getElementById('settings-nav') as any;
          if (el) el.activeId = e.detail;
        }}
        @dsNavToggle=${(e: CustomEvent<boolean>) => {
          const el = document.getElementById('settings-nav') as any;
          if (el) el.collapsed = e.detail;
        }}
        @dsNavFooterAction=${() => switchFooterStyle('settings-nav')}
      ></ds-panel-nav>

      <div style="flex:1; padding: 24px; color: var(--color-foreground-secondary); font-size: 13px;">
        <p style="margin: 0;">← Hover the logo to reveal the collapse toggle. Click the bottom-left button to switch sections.</p>
      </div>
    </div>
  `;
}

function sideBySide(): TemplateResult {
  const dashGroups     = JSON.stringify(DASHBOARD_GROUPS);
  const settingsGroups = JSON.stringify(SETTINGS_GROUPS);

  return html`
    <div style="
      display: flex;
      gap: 32px;
      padding: 32px;
      min-height: 100%;
      background: var(--color-background-secondary);
      font-family: var(--typography-font-family, system-ui);
      flex-wrap: wrap;
      box-sizing: border-box;
    ">
      <!-- Dashboard expanded -->
      <div style="display:flex; flex-direction:column; gap:8px;">
        <span style="font-size:12px; font-weight:500; color:var(--color-foreground-secondary)">Dashboard — expanded</span>
        <div style="flex:1; min-height:560px; display:flex;">
          <ds-panel-nav
            id="sb-dash-exp"
            nav-style="dashboard"
            groups=${dashGroups}
            active-id="area-a"
            user-name="User Name"
            user-initial="U"
            @dsNavSelect=${(e: CustomEvent<string>) => {
              const el = document.getElementById('sb-dash-exp') as any;
              if (el) el.activeId = e.detail;
            }}
            @dsNavToggle=${(e: CustomEvent<boolean>) => {
              const el = document.getElementById('sb-dash-exp') as any;
              if (el) el.collapsed = e.detail;
            }}
          ></ds-panel-nav>
        </div>
      </div>

      <!-- Dashboard collapsed -->
      <div style="display:flex; flex-direction:column; gap:8px;">
        <span style="font-size:12px; font-weight:500; color:var(--color-foreground-secondary)">Dashboard — collapsed</span>
        <div style="flex:1; min-height:560px; display:flex;">
          <ds-panel-nav
            id="sb-dash-col"
            nav-style="dashboard"
            groups=${dashGroups}
            active-id="area-a"
            user-name="User Name"
            user-initial="U"
            collapsed
            @dsNavSelect=${(e: CustomEvent<string>) => {
              const el = document.getElementById('sb-dash-col') as any;
              if (el) el.activeId = e.detail;
            }}
            @dsNavToggle=${(e: CustomEvent<boolean>) => {
              const el = document.getElementById('sb-dash-col') as any;
              if (el) el.collapsed = e.detail;
            }}
          ></ds-panel-nav>
        </div>
      </div>

      <!-- Settings expanded -->
      <div style="display:flex; flex-direction:column; gap:8px;">
        <span style="font-size:12px; font-weight:500; color:var(--color-foreground-secondary)">Settings — expanded</span>
        <div style="flex:1; min-height:560px; display:flex; background:var(--color-background-primary);">
          <ds-panel-nav
            id="sb-settings-exp"
            nav-style="settings"
            groups=${settingsGroups}
            active-id="item-1"
            user-name="User Name"
            user-initial="U"
            @dsNavSelect=${(e: CustomEvent<string>) => {
              const el = document.getElementById('sb-settings-exp') as any;
              if (el) el.activeId = e.detail;
            }}
            @dsNavToggle=${(e: CustomEvent<boolean>) => {
              const el = document.getElementById('sb-settings-exp') as any;
              if (el) el.collapsed = e.detail;
            }}
          ></ds-panel-nav>
        </div>
      </div>

      <!-- Settings collapsed -->
      <div style="display:flex; flex-direction:column; gap:8px;">
        <span style="font-size:12px; font-weight:500; color:var(--color-foreground-secondary)">Settings — collapsed</span>
        <div style="flex:1; min-height:560px; display:flex; background:var(--color-background-primary);">
          <ds-panel-nav
            id="sb-settings-col"
            nav-style="settings"
            groups=${settingsGroups}
            active-id="item-1"
            user-name="User Name"
            user-initial="U"
            collapsed
            @dsNavSelect=${(e: CustomEvent<string>) => {
              const el = document.getElementById('sb-settings-col') as any;
              if (el) el.activeId = e.detail;
            }}
            @dsNavToggle=${(e: CustomEvent<boolean>) => {
              const el = document.getElementById('sb-settings-col') as any;
              if (el) el.collapsed = e.detail;
            }}
          ></ds-panel-nav>
        </div>
      </div>
    </div>
  `;
}

// ── Meta ───────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Navigation/PanelNav',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Dashboard: Story = {
  name: 'Dashboard Variant',
  render: () => interactiveDashboard(),
};

export const Settings: Story = {
  name: 'Settings Variant',
  render: () => interactiveSettings(),
};

export const BreakpointLocked: Story = {
  name: 'Breakpoint locked',
  render: () => interactiveDashboard('area-a', false, 1200),
};

export const SideBySide: Story = {
  name: 'All States',
  render: () => sideBySide(),
};

const ROUTER_GROUPS: PanelNavGroup[] = DASHBOARD_GROUPS.map(g => ({
  ...g,
  items: g.items.map(item => ({
    ...item,
    href: `/dashboard/${item.id}`,
  })),
}));

const DASHBOARD_ITEM_COUNT = DASHBOARD_GROUPS.reduce((n, g) => n + g.items.length, 0);

/** Simulate Angular ngAfterViewInit: props land after customElements.whenDefined. */
function assignPanelNavAfterUpgrade(
  navId: string,
  statusId: string,
  assign: (el: HTMLElement & Record<string, unknown>) => void,
) {
  customElements.whenDefined('ds-panel-nav').then(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById(navId) as HTMLElement & Record<string, unknown> | null;
      const status = document.getElementById(statusId);
      if (!el || !status) return;
      assign(el);
      requestAnimationFrame(() => {
        const count = el.querySelectorAll('.panel-nav__body .panel-nav__item').length;
        const mode = (el as HTMLElement & { routerMode?: string }).routerMode ?? 'anchor';
        const anchors = el.querySelectorAll('.panel-nav__body a.panel-nav__item').length;
        const buttons = el.querySelectorAll('.panel-nav__body button.panel-nav__item').length;
        status.textContent =
          `${count} nav items · routerMode=${mode} · ${anchors} anchors / ${buttons} buttons`;
      });
    });
  });
}

export const AngularHostTiming: Story = {
  name: 'Angular host timing',
  parameters: {
    docs: {
      description: {
        story:
          'Mounts an empty `<ds-panel-nav>`, then assigns `groups` and `routerMode` after ' +
          '`customElements.whenDefined` (simulates Angular `ngAfterViewInit`). Expects all nav items ' +
          'to render as buttons without JSON.stringify or double-assignment.',
      },
    },
  },
  render: () => {
    assignPanelNavAfterUpgrade('angular-timing-nav', 'angular-timing-status', el => {
      el.groups = ROUTER_GROUPS;
      el.routerMode = 'event';
      el.currentUrl = '/dashboard/area-a/tab-1';
    });

    return html`
      <div style="
        display: flex;
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      ">
        <ds-panel-nav
          id="angular-timing-nav"
          nav-style="dashboard"
          router-mode="event"
          user-name="User Name"
          user-initial="U"
        ></ds-panel-nav>
        <div style="flex:1; padding:24px; color:rgba(255,255,255,0.55); font-size:13px;">
          <p style="margin:0 0 8px;">
            Props assigned after upgrade — expect <strong>${DASHBOARD_ITEM_COUNT}</strong> nav items.
          </p>
          <p style="margin:0;" id="angular-timing-status">Waiting for host prop assignment…</p>
        </div>
      </div>
    `;
  },
};

export const RouterModeEvent: Story = {
  name: 'Router mode — event (SPA)',
  render: () => {
    let currentUrl = '/dashboard/area-a/tab-1';

    const navigate = (path: string) => {
      currentUrl = path;
      const el = document.getElementById('router-nav') as HTMLElement & {
        currentUrl: string;
      } | null;
      if (el) el.currentUrl = path;
      const label = document.getElementById('router-url-label');
      if (label) label.textContent = path;
    };

    return html`
      <div style="
        display: flex;
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      ">
        <ds-panel-nav
          id="router-nav"
          nav-style="dashboard"
          router-mode="event"
          .groups=${ROUTER_GROUPS}
          current-url=${currentUrl}
          user-name="User Name"
          user-initial="U"
          @dsNavSelect=${(e: CustomEvent<string>) => {
            const item = ROUTER_GROUPS.flatMap(g => g.items).find(i => i.id === e.detail);
            if (item?.href) navigate(item.href);
          }}
          @dsNavUserAction=${(e: CustomEvent<{ anchor: HTMLElement; menuPlacement: { side: string; align: string } }>) => {
            const status = document.getElementById('router-user-status');
            if (status) {
              status.textContent = `User menu clicked (anchor: ${e.detail.anchor.id || e.detail.anchor.className}, side: ${e.detail.menuPlacement.side})`;
            }
          }}
        ></ds-panel-nav>

        <div style="flex:1; padding: 24px; color: rgba(255,255,255,0.55); font-size: 13px;">
          <p style="margin: 0 0 8px;">
            <strong>routerMode="event"</strong> — items keep <code>href</code> for URL matching but render as buttons.
            No full-page navigation; <code>dsNavSelect</code> drives routing.
          </p>
          <p style="margin: 0 0 4px;">Current URL: <code id="router-url-label">${currentUrl}</code></p>
          <p style="margin: 0;" id="router-user-status">Click the user footer button to test <code>dsNavUserAction</code>.</p>
        </div>
      </div>
    `;
  },
};

export const LiveSwitch: Story = {
  name: 'Live section switch',
  render: () => {
    const toggleLive = () => switchFooterStyle('live-nav');
    return html`
      <div style="
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: var(--color-background-primary);
        font-family: var(--typography-font-family, system-ui);
      " id="live-wrap">
        <div style="padding: 12px 16px; display: flex; align-items: center; gap: 12px; background: var(--color-background-secondary); border-bottom: 1px solid var(--color-border-tertiary);">
          <button
            style="padding: 6px 14px; cursor: pointer; font-size: 13px;"
            @click=${toggleLive}
          >Toggle section (same instance)</button>
          <span style="font-size: 12px; color: var(--color-foreground-secondary);">
            Switches dashboard ↔ settings groups on the same mounted &lt;ds-panel-nav&gt;.
          </span>
        </div>
        <div style="display: flex; flex: 1;">
          <ds-panel-nav
            id="live-nav"
            nav-style="dashboard"
            groups=${JSON.stringify(DASHBOARD_GROUPS)}
            active-id="area-a"
            user-name="User Name"
            user-initial="U"
            @dsNavSelect=${(e: CustomEvent<string>) => {
              const el = document.getElementById('live-nav') as any;
              if (el) el.activeId = e.detail;
            }}
            @dsNavToggle=${(e: CustomEvent<boolean>) => {
              const el = document.getElementById('live-nav') as any;
              if (el) el.collapsed = e.detail;
            }}
            @dsNavFooterAction=${toggleLive}
          ></ds-panel-nav>
        </div>
      </div>
    `;
  },
};

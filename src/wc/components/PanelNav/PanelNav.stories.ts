import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import '../../../../dist/components/ds-panel-nav.js';
import '../../../../dist/components/ds-icon.js';
import '../../../../dist/components/ds-text.js';
import type { PanelNavGroup } from './PanelNav';

// ── Sample data (icon names verified against IcoMo) ───────────────────────

const DASHBOARD_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'fleet-view',        icon: 'MapPage',            label: 'Fleet View'          },
      { id: 'safety',            icon: 'ShieldCircle',       label: 'Safety'              },
      { id: 'compliance',        icon: 'Chart',              label: 'Compliance'          },
      { id: 'fuel',              icon: 'FuelPump',           label: 'Fuel'                },
      { id: 'cards',             icon: 'Card',               label: 'Cards'               },
      { id: 'maintenance',       icon: 'Wrench',             label: 'Maintenance'         },
      { id: 'workforce',         icon: 'Person',             label: 'Workforce'           },
    ],
  },
  {
    items: [
      { id: 'performance',       icon: 'Whistle',            label: 'Performance'         },
      { id: 'security',          icon: 'ShieldLock',         label: 'Security'            },
      { id: 'service-ops',       icon: 'WorkflowA',          label: 'Service Operations'  },
      { id: 'dispatch',          icon: 'LocationPinArrows',  label: 'Dispatch'            },
      { id: 'devices',           icon: 'Devices',            label: 'Devices'             },
    ],
  },
  {
    items: [
      { id: 'atlas',             icon: 'AI',                 label: 'Atlas'               },
      { id: 'messages',          icon: 'MessageBubbleStack', label: 'Messages',   dot: true },
      { id: 'documents',         icon: 'Document',           label: 'Documents'           },
      { id: 'analytics',         icon: 'GraphArrow',         label: 'Analytics'           },
      { id: 'marketplace',       icon: 'ShoppingBag',        label: 'Marketplace'         },
      { id: 'labs',              icon: 'Beaker',             label: 'Labs'                },
    ],
  },
];

const SETTINGS_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'user-settings',     icon: 'Avatar',             label: 'User Settings'       },
    ],
  },
  {
    label: 'Organization',
    items: [
      { id: 'company',           icon: 'BuildingOffice',     label: 'Company'             },
      { id: 'fleet-users',       icon: 'PersonManager',      label: 'Fleet Users'         },
      { id: 'groups',            icon: 'PersonGroup',        label: 'Groups'              },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { id: 'settings-profiles', icon: 'DocumentGear',       label: 'Settings Profiles'   },
      { id: 'product-settings',  icon: 'Preferences',        label: 'Product Settings'    },
      { id: 'automations',       icon: 'Bolt',               label: 'Automations'         },
      { id: 'alerts',            icon: 'Notification',       label: 'Alerts',     dot: true },
    ],
  },
  {
    label: 'Developer',
    items: [
      { id: 'driver-app',        icon: 'Mobile',             label: 'Driver & Fleet App'  },
      { id: 'security-data',     icon: 'LockClosed',         label: 'Security & Data'     },
      { id: 'developers',        icon: 'BackslashBrackets',  label: 'Developers'          },
      { id: 'audit-log',         icon: 'DocumentPencil',     label: 'Audit Log'           },
    ],
  },
];

// ── Shared story helpers ───────────────────────────────────────────────────

const VARIANT_BG: Record<string, string> = {
  dashboard: '#0f0f0f',
  settings:  'var(--color-background-primary)',
};

const VARIANT_GROUPS: Record<string, PanelNavGroup[]> = {
  dashboard: DASHBOARD_GROUPS,
  settings:  SETTINGS_GROUPS,
};

const VARIANT_ACTIVE: Record<string, string> = {
  dashboard: 'fleet-view',
  settings:  'user-settings',
};

// ── App-level radial reveal ────────────────────────────────────────────────
// Direct port of motive-webapp-lab/src/app/view-transitions.ts. Real apps drive
// the panel-nav reveal at the app/router level (the nav sets
// `disable-view-transition`, so the component's own VT path is off and there is
// a single driver). Storybook has no router, so the story plays that role here
// instead of relying on the component's built-in transition.

let vtStyleInjected = false;

/** Suppress the browser's default root cross-fade and pin the new snapshot to a
 *  0px circle so the WAAPI reveal starts cleanly with no flash. */
function ensureVtStyle() {
  if (vtStyleInjected) return;
  const id = 'sb-panel-nav-vt-style';
  if (document.getElementById(id)) { vtStyleInjected = true; return; }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = [
    '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}',
    '::view-transition-new(root){clip-path:circle(0px at var(--vt-x,50%) var(--vt-y,50%))}',
  ].join('\n');
  document.head.appendChild(style);
  vtStyleInjected = true;
}

/** Parse a CSS <time> value to milliseconds. `parseFloat('.75s')` is 0.75, which
 *  WAAPI treats as 0.75ms (invisible), so the `s` unit must be scaled to ms. */
function parseCssTimeMs(value: string, fallback: number): number {
  const v = value.trim();
  const num = parseFloat(v);
  if (Number.isNaN(num)) return fallback;
  if (/ms\s*$/.test(v)) return num;
  if (/s\s*$/.test(v)) return num * 1000;
  return num;
}

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { ready: Promise<void> };
};

/** Animate a panel-nav variant change with the radial circle reveal, driven from
 *  the app side. `applyChange` mutates the nav props; we wait for Stencil to flush
 *  the re-render before the new snapshot is captured so the reveal shows the new
 *  variant rather than the old one. */
function revealVariant(nav: HTMLElement, applyChange: () => void) {
  const doc = document as DocWithVT;
  if (typeof doc.startViewTransition !== 'function') {
    applyChange();
    return;
  }
  ensureVtStyle();

  const btn = nav.querySelector<HTMLElement>('.panel-nav__footer-btn');
  const rect = btn?.getBoundingClientRect();
  const x = rect ? Math.round(rect.left + rect.width / 2) : Math.round(window.innerWidth / 2);
  const y = rect ? Math.round(rect.top + rect.height / 2) : Math.round(window.innerHeight / 2);
  const maxR = Math.ceil(
    Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)),
  );

  document.documentElement.style.setProperty('--vt-x', `${x}px`);
  document.documentElement.style.setProperty('--vt-y', `${y}px`);

  const transition = doc.startViewTransition(async () => {
    applyChange();
    // The component renders asynchronously; yield two frames so the captured
    // "new" snapshot reflects the new variant.
    await new Promise<void>(res =>
      requestAnimationFrame(() => requestAnimationFrame(() => res())),
    );
  });

  transition.ready
    .then(() => {
      const durToken = getComputedStyle(document.documentElement)
        .getPropertyValue('--effect-animation-duration-long-1').trim();
      const duration = parseCssTimeMs(durToken, 750);
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxR}px at ${x}px ${y}px)`] },
        { duration, easing: 'ease-in-out', fill: 'forwards', pseudoElement: '::view-transition-new(root)' },
      );
    })
    .catch(() => { /* transition skipped or superseded */ });
}

function switchFooterVariant(id: string) {
  const el = document.getElementById(id) as any;
  const wrap = document.getElementById(`${id}-wrap`);
  if (!el) return;

  const next = el.variant === 'dashboard' ? 'settings' : 'dashboard';
  revealVariant(el, () => {
    el.variant  = next;
    el.groups   = JSON.stringify(VARIANT_GROUPS[next]);
    el.activeId = VARIANT_ACTIVE[next];
    if (wrap) wrap.style.background = VARIANT_BG[next];
  });
}

function interactiveDashboard(activeId = 'fleet-view', collapsed = false): TemplateResult {
  return html`
    <div id="dash-nav-wrap" style="
      display: flex;
      height: 100vh;
      background: ${VARIANT_BG['dashboard']};
      font-family: var(--typography-font-family, system-ui);
    ">
      <ds-panel-nav
        id="dash-nav"
        variant="dashboard"
        groups=${JSON.stringify(DASHBOARD_GROUPS)}
        active-id=${activeId}
        user-name="Zain Adeel"
        user-initial="Z"
        disable-view-transition
        ?collapsed=${collapsed}
        @dsNavSelect=${(e: CustomEvent<string>) => {
          const el = document.getElementById('dash-nav') as any;
          if (el) el.activeId = e.detail;
        }}
        @dsNavToggle=${(e: CustomEvent<boolean>) => {
          const el = document.getElementById('dash-nav') as any;
          if (el) el.collapsed = e.detail;
        }}
        @dsNavFooterAction=${() => switchFooterVariant('dash-nav')}
      ></ds-panel-nav>

      <div style="flex:1; padding: 24px; color: rgba(255,255,255,0.5); font-size: 13px;">
        <p style="margin: 0;">← Hover the logo to reveal the collapse toggle. Click the bottom-left button to switch variants.</p>
      </div>
    </div>
  `;
}

function interactiveSettings(activeId = 'user-settings', collapsed = false): TemplateResult {
  return html`
    <div id="settings-nav-wrap" style="
      display: flex;
      height: 100vh;
      background: ${VARIANT_BG['settings']};
      font-family: var(--typography-font-family, system-ui);
    ">
      <ds-panel-nav
        id="settings-nav"
        variant="settings"
        groups=${JSON.stringify(SETTINGS_GROUPS)}
        active-id=${activeId}
        user-name="Zain Adeel"
        user-initial="Z"
        disable-view-transition
        ?collapsed=${collapsed}
        @dsNavSelect=${(e: CustomEvent<string>) => {
          const el = document.getElementById('settings-nav') as any;
          if (el) el.activeId = e.detail;
        }}
        @dsNavToggle=${(e: CustomEvent<boolean>) => {
          const el = document.getElementById('settings-nav') as any;
          if (el) el.collapsed = e.detail;
        }}
        @dsNavFooterAction=${() => switchFooterVariant('settings-nav')}
      ></ds-panel-nav>

      <div style="flex:1; padding: 24px; color: var(--color-foreground-secondary); font-size: 13px;">
        <p style="margin: 0;">← Hover the logo to reveal the collapse toggle. Click the bottom-left button to switch variants.</p>
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
            variant="dashboard"
            groups=${dashGroups}
            active-id="fleet-view"
            user-name="Zain Adeel"
            user-initial="Z"
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
            variant="dashboard"
            groups=${dashGroups}
            active-id="fleet-view"
            user-name="Zain Adeel"
            user-initial="Z"
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
            variant="settings"
            groups=${settingsGroups}
            active-id="user-settings"
            user-name="Zain Adeel"
            user-initial="Z"
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
            variant="settings"
            groups=${settingsGroups}
            active-id="user-settings"
            user-name="Zain Adeel"
            user-initial="Z"
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

export const SideBySide: Story = {
  name: 'All States',
  render: () => sideBySide(),
};

export const LiveSwitch: Story = {
  name: 'Live Variant Switch',
  render: () => {
    let current: 'dashboard' | 'settings' = 'dashboard';
    const toggleLive = () => {
      const nav = document.getElementById('live-nav') as HTMLElement | null;
      const wrap = document.getElementById('live-wrap');
      if (!nav) return;
      current = current === 'dashboard' ? 'settings' : 'dashboard';
      revealVariant(nav, () => {
        const el = nav as any;
        el.variant  = current;
        el.groups   = JSON.stringify(VARIANT_GROUPS[current]);
        el.activeId = VARIANT_ACTIVE[current];
        if (wrap) wrap.style.background = VARIANT_BG[current];
      });
    };
    return html`
      <div style="
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: ${VARIANT_BG['dashboard']};
        font-family: var(--typography-font-family, system-ui);
      " id="live-wrap">
        <div style="padding: 12px 16px; display: flex; align-items: center; gap: 12px; background: var(--color-background-secondary); border-bottom: 1px solid var(--color-border-tertiary);">
          <button
            style="padding: 6px 14px; cursor: pointer; font-size: 13px;"
            @click=${toggleLive}
          >Toggle variant (same instance)</button>
          <span style="font-size: 12px; color: var(--color-foreground-secondary);">
            Switches dashboard ↔ settings on the same mounted &lt;ds-panel-nav&gt; — no remount.
          </span>
        </div>
        <div style="display: flex; flex: 1;">
          <ds-panel-nav
            id="live-nav"
            variant="dashboard"
            groups=${JSON.stringify(DASHBOARD_GROUPS)}
            active-id="fleet-view"
            user-name="Zain Adeel"
            user-initial="Z"
            disable-view-transition
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

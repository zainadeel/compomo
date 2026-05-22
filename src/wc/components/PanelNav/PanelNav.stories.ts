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
    items: [
      { id: 'company',           icon: 'BuildingOffice',     label: 'Company'             },
      { id: 'fleet-users',       icon: 'PersonManager',      label: 'Fleet Users'         },
      { id: 'groups',            icon: 'PersonGroup',        label: 'Groups'              },
    ],
  },
  {
    items: [
      { id: 'settings-profiles', icon: 'DocumentGear',       label: 'Settings Profiles'   },
      { id: 'product-settings',  icon: 'Preferences',        label: 'Product Settings'    },
      { id: 'automations',       icon: 'Bolt',               label: 'Automations'         },
      { id: 'alerts',            icon: 'Notification',       label: 'Alerts',     dot: true },
    ],
  },
  {
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

function switchFooterVariant(id: string) {
  const el = document.getElementById(id) as any;
  const wrap = document.getElementById(`${id}-wrap`);
  if (!el) return;

  const next = el.variant === 'dashboard' ? 'settings' : 'dashboard';

  // Origin: centre of the footer button
  const btn = el.querySelector('.panel-nav__footer-btn');
  const btnRect = btn?.getBoundingClientRect();
  const x = btnRect ? Math.round(btnRect.left + btnRect.width  / 2) : 0;
  const y = btnRect ? Math.round(btnRect.top  + btnRect.height / 2) : 0;
  const maxR = Math.ceil(Math.hypot(
    Math.max(x, window.innerWidth  - x),
    Math.max(y, window.innerHeight - y),
  ));

  const applySwitch = () => {
    el.variant  = next;
    el.groups   = JSON.stringify(VARIANT_GROUPS[next]);
    el.activeId = VARIANT_ACTIVE[next];
    if (wrap) wrap.style.background = VARIANT_BG[next];
  };

  if (typeof (document as any).startViewTransition !== 'function') {
    applySwitch();
    return;
  }

  // Pin the circle origin on :root before calling startViewTransition so the
  // CSS rule in preview-head.html (`::view-transition-new(root) { clip-path:
  // circle(0px at var(--vt-x) var(--vt-y)) }`) hides the new-state snapshot
  // from the very first committed compositor frame — preventing the one-frame
  // flash that made the animation look "weird" at normal speed.
  document.documentElement.style.setProperty('--vt-x', `${x}px`);
  document.documentElement.style.setProperty('--vt-y', `${y}px`);

  // Stencil v4 schedules re-renders via microtasks (Promise.resolve / queueMicrotask).
  // Yielding four times lets Stencil's render queue fully flush before the VT
  // captures the new-state snapshot — no paint frame needed, so this avoids
  // the rAF deadlock where Chrome suspends painting while awaiting the callback.
  const applyAndFlush = async () => {
    applySwitch();
    await Promise.resolve(); // tick 1: Stencil queues its render microtask
    await Promise.resolve(); // tick 2: Stencil's render runs
    await Promise.resolve(); // tick 3: any post-render microtasks
    await Promise.resolve(); // tick 4: defensive extra flush
  };

  const transition = (document as any).startViewTransition(applyAndFlush);

  transition.ready.then(() => {
    const durToken = getComputedStyle(document.documentElement).getPropertyValue('--effect-animation-duration-long-1').trim();
    const duration = parseFloat(durToken) || 750;
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxR}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: 'ease-in-out',
        // fill: 'forwards' keeps the final clip-path (circle(maxR)) in effect
        // until the VT cleans up — prevents the snapshot snapping back to the
        // CSS initial state (circle(0px)) for a frame before removal.
        fill: 'forwards',
        pseudoElement: '::view-transition-new(root)',
      },
    );
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

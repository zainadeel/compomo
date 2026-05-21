import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type { TemplateResult } from 'lit';
import '../../../../dist/components/ds-panel-nav.js';
import '../../../../dist/components/ds-icon.js';
import type { PanelNavGroup } from './PanelNav';

// ── Sample data ────────────────────────────────────────────────────────────

const DASHBOARD_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'fleet-view',    icon: 'Dashboard',    label: 'Fleet View'    },
      { id: 'safety',        icon: 'Shield',        label: 'Safety'        },
      { id: 'compliance',    icon: 'ShieldCheck',   label: 'Compliance'    },
      { id: 'fuel',          icon: 'FuelPump',      label: 'Fuel'          },
      { id: 'cards',         icon: 'Card',          label: 'Cards'         },
      { id: 'maintenance',   icon: 'GearCheck',     label: 'Maintenance'   },
      { id: 'workforce',     icon: 'PersonGroup',   label: 'Workforce'     },
    ],
  },
  {
    items: [
      { id: 'performance',    icon: 'Chart',          label: 'Performance'         },
      { id: 'security',       icon: 'ShieldLock',     label: 'Security'            },
      { id: 'service-ops',    icon: 'PersonGear',     label: 'Service Operations'  },
      { id: 'dispatch',       icon: 'MapNavigation',  label: 'Dispatch'            },
      { id: 'devices',        icon: 'Devices',        label: 'Devices'             },
    ],
  },
  {
    items: [
      { id: 'atlas',       icon: 'GlobeWorldMap',    label: 'Atlas'       },
      { id: 'documents',   icon: 'DocumentStacked',  label: 'Documents'   },
      { id: 'analytics',   icon: 'DocumentChart',    label: 'Analytics'   },
      { id: 'marketplace', icon: 'AssetTracker',     label: 'Marketplace' },
      { id: 'labs',        icon: 'Bulb',             label: 'Labs'        },
    ],
  },
];

const SETTINGS_GROUPS: PanelNavGroup[] = [
  {
    items: [
      { id: 'user-settings', icon: 'PersonGear', label: 'User Settings' },
    ],
  },
  {
    items: [
      { id: 'company',     icon: 'BuildingOffice', label: 'Company'     },
      { id: 'fleet-users', icon: 'PersonGroup',   label: 'Fleet Users' },
      { id: 'groups',      icon: 'GroupBy',        label: 'Groups'      },
    ],
  },
  {
    items: [
      { id: 'settings-profiles', icon: 'DocumentGear',    label: 'Settings Profiles' },
      { id: 'product-settings',  icon: 'Gear',            label: 'Product Settings'  },
      { id: 'automations',       icon: 'CircleArrow',     label: 'Automations'       },
      { id: 'alerts',            icon: 'Bell',            label: 'Alerts'            },
    ],
  },
  {
    items: [
      { id: 'driver-app',    icon: 'EntityDriver',  label: 'Driver & Fleet App' },
      { id: 'security-data', icon: 'ShieldLock',    label: 'Security & Data'    },
      { id: 'developers',    icon: 'Braces',        label: 'Developers'         },
      { id: 'audit-log',     icon: 'DocumentCheck', label: 'Audit Log'          },
    ],
  },
];

// ── Shared story helpers ───────────────────────────────────────────────────

function interactiveDashboard(activeId = 'fleet-view', collapsed = false): TemplateResult {
  const groups = JSON.stringify(DASHBOARD_GROUPS);

  return html`
    <div style="
      display: flex;
      height: 600px;
      background: #0f0f0f;
      font-family: var(--typography-font-family, system-ui);
    ">
      <ds-panel-nav
        id="dash-nav"
        variant="dashboard"
        groups=${groups}
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
      ></ds-panel-nav>

      <div style="flex:1; padding: 24px; color: rgba(255,255,255,0.7); font-size: 14px;">
        <p style="margin: 0; opacity: 0.5">← Click a nav item or the chevron to interact</p>
      </div>
    </div>
  `;
}

function interactiveSettings(activeId = 'user-settings', collapsed = false): TemplateResult {
  const groups = JSON.stringify(SETTINGS_GROUPS);

  return html`
    <div style="
      display: flex;
      height: 600px;
      background: var(--color-background-primary);
      font-family: var(--typography-font-family, system-ui);
    ">
      <ds-panel-nav
        id="settings-nav"
        variant="settings"
        groups=${groups}
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
      ></ds-panel-nav>

      <div style="flex:1; padding: 24px; color: var(--color-foreground-secondary); font-size: 14px;">
        <p style="margin: 0; opacity: 0.5">← Click a nav item or the chevron to interact</p>
      </div>
    </div>
  `;
}

function sideBySide(): TemplateResult {
  const dashGroups    = JSON.stringify(DASHBOARD_GROUPS);
  const settingsGroups = JSON.stringify(SETTINGS_GROUPS);

  return html`
    <div style="
      display: flex;
      gap: 32px;
      padding: 32px;
      background: var(--color-background-secondary);
      font-family: var(--typography-font-family, system-ui);
      flex-wrap: wrap;
    ">
      <!-- Dashboard expanded -->
      <div style="display:flex; flex-direction:column; gap:8px;">
        <span style="font-size:12px; font-weight:500; color:var(--color-foreground-secondary)">Dashboard — expanded</span>
        <div style="height:480px; display:flex;">
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
        <div style="height:480px; display:flex;">
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
        <div style="height:480px; display:flex; background:var(--color-background-primary);">
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
        <div style="height:480px; display:flex; background:var(--color-background-primary);">
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

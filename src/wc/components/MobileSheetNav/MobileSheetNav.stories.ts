import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-mobile-sheet-nav.js';

const dashboardGroups = [
  {
    id: 'operations',
    items: [
      { id: 'tracking', label: 'Tracking', icon: 'MapPage', href: '/dashboard/tracking' },
      { id: 'operations', label: 'Operations', icon: 'Task', href: '/dashboard/operations' },
      { id: 'workforce', label: 'Workforce', icon: 'Person', href: '/dashboard/workforce' },
    ],
  },
  {
    id: 'administration',
    items: [
      { id: 'security', label: 'Security', icon: 'Shield', href: '/dashboard/security' },
      { id: 'devices', label: 'Devices', icon: 'Devices', href: '/dashboard/devices' },
    ],
  },
];

const settingsGroups = [
  {
    id: 'personal',
    items: [
      { id: 'account', label: 'Account', icon: 'Avatar', href: '/settings/account' },
      { id: 'preferences', label: 'Preferences', icon: 'Gear', href: '/settings/preferences' },
    ],
  },
  {
    id: 'organization',
    items: [
      { id: 'users', label: 'Users', icon: 'Person', href: '/settings/users' },
      { id: 'security', label: 'Security', icon: 'Shield', href: '/settings/security' },
    ],
  },
];

const meta: Meta = {
  title: 'Navigation/MobileSheetNav',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Foundation: Story = {
  render: () => html`
    <div style="height: 720px; max-width: 430px; margin: 0 auto;">
      <ds-mobile-sheet-nav
        open
        current-url="/dashboard/tracking/live-map"
        .dashboardGroups=${dashboardGroups}
        .settingsGroups=${settingsGroups}
      ></ds-mobile-sheet-nav>
    </div>
  `,
};

export const Nested: Story = {
  render: () => html`
    <div style="height: 720px; max-width: 430px; margin: 0 auto;">
      <ds-mobile-sheet-nav
        open
        presentation="nested"
        current-url="/dashboard/tracking/live-map"
        .dashboardGroups=${[
          {
            items: [
              {
                id: 'tracking',
                label: 'Tracking',
                icon: 'MapPage',
                children: [
                  { id: 'live-map', label: 'Live Map', href: '/dashboard/tracking/live-map' },
                  { id: 'history', label: 'Location History', href: '/dashboard/tracking/history' },
                ],
              },
              {
                id: 'safety',
                label: 'Safety',
                icon: 'ShieldCircle',
                children: [
                  { id: 'overview', label: 'Overview', href: '/dashboard/safety/overview' },
                  { id: 'events', label: 'Events', href: '/dashboard/safety/events', dot: true },
                  { id: 'settings', label: 'Settings', href: '/dashboard/safety/settings' },
                ],
              },
            ],
          },
        ]}
        .settingsGroups=${settingsGroups}
      ></ds-mobile-sheet-nav>
    </div>
  `,
};

export const WithoutAccount: Story = {
  render: () => html`
    <div style="height: 720px; max-width: 430px; margin: 0 auto;">
      <ds-mobile-sheet-nav
        open
        .showAccount=${false}
        current-url="/dashboard/tracking/live-map"
        .dashboardGroups=${dashboardGroups}
        .settingsGroups=${settingsGroups}
      ></ds-mobile-sheet-nav>
    </div>
  `,
};

export const OverGlobalTool: Story = {
  render: () => html`
    <div style="height: 720px; max-width: 430px; margin: 0 auto;">
      <ds-mobile-sheet-nav
        open
        .routeSelectionActive=${false}
        current-url="/dashboard/tracking/live-map"
        .dashboardGroups=${dashboardGroups}
        .settingsGroups=${settingsGroups}
      ></ds-mobile-sheet-nav>
    </div>
  `,
};

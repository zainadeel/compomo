import '/dist/components/ds-shell-app.js';
import '/dist/components/ds-panel-nav.js';
import '/dist/components/ds-bar-nav.js';
import '/dist/components/ds-bar-title.js';
import '/dist/components/ds-mobile-sheet-nav.js';
import '/dist/components/ds-mobile-header.js';
import '/dist/components/ds-mobile-bar-nav.js';
import '/dist/components/ds-shell-page.js';
import '/dist/components/ds-shell-tools.js';
import '/dist/components/ds-panel-tools.js';
import '/dist/components/ds-panel-tool-header.js';

await Promise.all([
  customElements.whenDefined('ds-shell-app'),
  customElements.whenDefined('ds-panel-nav'),
  customElements.whenDefined('ds-bar-nav'),
  customElements.whenDefined('ds-mobile-header'),
  customElements.whenDefined('ds-mobile-bar-nav'),
  customElements.whenDefined('ds-shell-tools'),
]);

const shell = document.getElementById('managed-shell');
const groups = [
  {
    label: 'Fleet',
    items: [
      {
        id: 'tracking',
        icon: 'MapPage',
        label: 'Tracking',
        dot: true,
        children: [
          { id: 'overview', label: 'Overview', href: '/dashboard/tracking/overview' },
          { id: 'history', label: 'History', href: '/dashboard/tracking/history', dot: true },
        ],
      },
      {
        id: 'safety',
        icon: 'Safety',
        label: 'Safety',
        href: '/dashboard/safety',
      },
      {
        id: 'maintenance',
        icon: 'Wrench',
        label: 'Maintenance',
        children: [
          {
            id: 'vehicle-health',
            label: 'Vehicle health',
            href: '/dashboard/maintenance/vehicle-health',
          },
          {
            id: 'schedules',
            label: 'Schedules',
            href: '/dashboard/maintenance/schedules',
          },
        ],
      },
      {
        id: 'reports',
        icon: 'Chart',
        label: 'Reports',
        children: [
          { id: 'overview', label: 'Overview', href: '/dashboard/reports/overview' },
          { id: 'custom', label: 'Custom reports', href: '/dashboard/reports/custom' },
        ],
      },
    ],
  },
];

shell.navigation = {
  groups,
  dashboardGroups: groups,
  settingsGroups: [
    {
      label: 'Account',
      items: [
        {
          id: 'user-settings',
          icon: 'Avatar',
          label: 'User Settings',
          href: '/settings/user',
        },
      ],
    },
  ],
  currentUrl: '/dashboard/tracking/overview',
  activeId: 'tracking',
  browseContext: 'dashboard',
  routerMode: 'event',
  userName: 'Zain Adeel',
  userInitial: 'Z',
  showMobileAccount: false,
};
shell.pageChrome = {
  heading: 'Fleet overview',
  routeHeading: 'Tracking',
  description: 'Current fleet status.',
  tabs: [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'History' },
  ],
  value: 'overview',
  basePath: '/dashboard/tracking',
  currentUrl: '/dashboard/tracking/overview',
  subsections: [
    { id: 'summary', label: 'Summary' },
    { id: 'details', label: 'Details' },
  ],
  subvalue: 'summary',
};
shell.tools = {
  headers: {
    agents: {
      title: 'Agents',
      actions: [
        {
          id: 'fullscreen',
          icon: 'PanelExpand',
          ariaLabel: 'Enter fullscreen',
        },
      ],
    },
  },
};

const events = [];
for (const type of [
  'dsNavSelect',
  'dsNavChildSelect',
  'dsTabChange',
  'dsSubsectionChange',
  'dsToolChange',
  'dsPresentationChange',
]) {
  shell.addEventListener(type, event => {
    events.push({ type, detail: event.detail });
    document.documentElement.dataset.lastEvent = JSON.stringify(events.at(-1));
  });
}

shell.addEventListener('dsNavChildSelect', event => {
  const { parentId, childId, href } = event.detail;
  shell.navigation = {
    ...shell.navigation,
    activeId: parentId,
    currentUrl: href ?? shell.navigation.currentUrl,
  };
  shell.pageChrome = {
    ...shell.pageChrome,
    value: childId,
    currentUrl: href ?? shell.pageChrome.currentUrl,
  };
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

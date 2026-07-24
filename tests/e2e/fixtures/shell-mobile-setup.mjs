import '/dist/components/ds-shell-app.js';
import '/dist/components/ds-panel-nav.js';
import '/dist/components/ds-bar-nav.js';
import '/dist/components/ds-shell-mobile-nav.js';
import '/dist/components/ds-shell-mobile-section-nav.js';
import '/dist/components/ds-shell-mobile-bar.js';
import '/dist/components/ds-shell-tools.js';

const dashboardGroups = [
  {
    items: [
      {
        id: 'tracking',
        icon: 'MapPage',
        label: 'Tracking',
        href: '/dashboard/tracking',
      },
      {
        id: 'workforce',
        icon: 'Person',
        label: 'Workforce',
        href: '/dashboard/workforce',
      },
    ],
  },
];
const settingsGroups = [
  {
    items: [
      {
        id: 'user-settings',
        icon: 'Avatar',
        label: 'User Settings',
        href: '/settings/user-settings',
      },
    ],
  },
];
const toolItems = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search', dot: true },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true },
  { id: 'help', icon: 'CircleQuestion', ariaLabel: 'Help & Support' },
];
const sectionTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'live-map', label: 'Live Map' },
  { id: 'history', label: 'Location History' },
  { id: 'devices', label: 'Devices' },
];

await Promise.all([
  customElements.whenDefined('ds-shell-app'),
  customElements.whenDefined('ds-shell-mobile-nav'),
  customElements.whenDefined('ds-shell-mobile-section-nav'),
  customElements.whenDefined('ds-shell-mobile-bar'),
  customElements.whenDefined('ds-shell-tools'),
]);

const shell = document.getElementById('shell');
const panel = document.getElementById('panel');
const bar = document.getElementById('bar');
const mobileNav = document.getElementById('mobile-nav');
const mobileSections = document.getElementById('mobile-sections');
const mobileBar = document.getElementById('mobile-bar');
const tools = document.getElementById('tools');

panel.groups = dashboardGroups;
panel.currentUrl = '/dashboard/tracking/live-map';
bar.tabs = sectionTabs;
bar.basePath = '/dashboard/tracking';
bar.currentUrl = '/dashboard/tracking/live-map';
mobileNav.dashboardGroups = dashboardGroups;
mobileNav.settingsGroups = settingsGroups;
mobileNav.currentUrl = '/dashboard/tracking/live-map';
mobileSections.tabs = sectionTabs;
mobileSections.basePath = '/dashboard/tracking';
mobileSections.currentUrl = '/dashboard/tracking/live-map';
mobileSections.heading = 'Tracking';
mobileBar.currentArea = { id: 'tracking', icon: 'MapPage', label: 'Tracking' };
mobileBar.searchDot = true;
mobileBar.inboxDot = true;
tools.items = toolItems;
tools.headers = {
  search: { title: 'Search' },
  agents: { title: 'Agents' },
  messages: { title: 'Messages' },
};

function applyShellState(destination, navigationOpen) {
  shell.mobileDestination = destination;
  shell.mobileNavigationOpen = navigationOpen;
  mobileBar.activeDestination = destination;
  mobileBar.navigationExpanded = navigationOpen;
  mobileNav.open = navigationOpen;
}

applyShellState('area', false);

mobileBar.addEventListener('dsNavigationToggle', event => {
  applyShellState(shell.mobileDestination, event.detail);
});
mobileBar.addEventListener('dsDestinationChange', event => {
  const destination = event.detail.destination;
  applyShellState(destination, false);
  if (destination === 'area') {
    tools.open = false;
    return;
  }
  const tool = destination === 'inbox' ? 'messages' : destination;
  tools.activeTool = tool;
  tools.open = true;
});
mobileNav.addEventListener('dsBrowseContextChange', event => {
  mobileNav.browseContext = event.detail;
});
mobileNav.addEventListener('dsAreaSelect', event => {
  document.documentElement.dataset.selectedArea = event.detail;
  applyShellState('area', false);
});
mobileNav.addEventListener('dsClose', () => {
  applyShellState(shell.mobileDestination, false);
});
tools.addEventListener('dsToolChange', event => {
  const { id, selected } = event.detail;
  tools.activeTool = id;
  tools.open = selected;
  const destination =
    !selected ? 'area' : id === 'search' || id === 'agents' ? id : 'inbox';
  applyShellState(destination, false);
});

window.__persistentSearchInput = document.getElementById('persistent-value');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

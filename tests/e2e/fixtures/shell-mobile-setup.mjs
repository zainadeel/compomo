import '/dist/components/ds-banner.js';
import '/dist/components/ds-shell-app.js';
import '/dist/components/ds-panel-nav.js';
import '/dist/components/ds-bar-nav.js';
import '/dist/components/ds-bar-title.js';
import '/dist/components/ds-mobile-sheet-nav.js';
import '/dist/components/ds-mobile-header.js';
import '/dist/components/ds-mobile-bar-nav.js';
import '/dist/components/ds-shell-page.js';
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
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents', railPlacement: 'header', mobileDestination: 'agents' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages', mobileDestination: 'messages' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true, mobileDestination: 'activity' },
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search', dot: true, mobileDestination: 'search' },
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
  customElements.whenDefined('ds-mobile-sheet-nav'),
  customElements.whenDefined('ds-mobile-header'),
  customElements.whenDefined('ds-mobile-bar-nav'),
  customElements.whenDefined('ds-shell-tools'),
]);

const shell = document.getElementById('shell');
const panel = document.getElementById('panel');
const bar = document.getElementById('bar');
const mobileSheetNav = document.getElementById('mobile-sheet-nav');
const mobileHeader = document.getElementById('mobile-header');
const workspacePage = document.getElementById('workspace-page');
const mobileBarNav = document.getElementById('mobile-bar-nav');
const tools = document.getElementById('tools');

panel.groups = dashboardGroups;
panel.currentUrl = '/dashboard/tracking/live-map';
bar.tabs = sectionTabs;
bar.basePath = '/dashboard/tracking';
bar.currentUrl = '/dashboard/tracking/live-map';
mobileSheetNav.dashboardGroups = dashboardGroups;
mobileSheetNav.settingsGroups = settingsGroups;
mobileSheetNav.currentUrl = '/dashboard/tracking/live-map';
mobileHeader.sections = sectionTabs;
mobileHeader.value = 'live-map';
mobileHeader.heading = 'Tracking';
mobileBarNav.currentArea = { id: 'tracking', icon: 'MapPage', label: 'Tracking' };
mobileBarNav.searchDot = true;
mobileBarNav.activityMode = 'direct';
mobileBarNav.activityDot = true;
mobileBarNav.messagesDot = true;
tools.items = toolItems;
tools.headers = {
  search: { title: 'Search' },
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
  messages: {
    title: 'Messages',
    actions: [
      {
        id: 'fullscreen',
        icon: 'PanelExpand',
        ariaLabel: 'Enter fullscreen',
      },
    ],
  },
};

function applyShellState(destination, sheetNavOpen) {
  shell.mobileDestination = destination;
  shell.mobileSheetNavOpen = sheetNavOpen;
  mobileBarNav.activeDestination = destination;
  mobileBarNav.sheetNavExpanded = sheetNavOpen;
  mobileSheetNav.open = sheetNavOpen;
}

applyShellState('area', false);
workspacePage.responsiveMode = window.innerWidth < 768 ? 'mobile' : 'desktop';

shell.addEventListener('dsResponsiveModeChange', event => {
  workspacePage.responsiveMode = event.detail.mode;
});

mobileHeader.addEventListener('dsSectionChange', event => {
  mobileHeader.value = event.detail;
});

mobileBarNav.addEventListener('dsSheetNavToggle', event => {
  applyShellState(shell.mobileDestination, event.detail);
});
mobileBarNav.addEventListener('dsDestinationChange', event => {
  const destination = event.detail.destination;
  applyShellState(destination, false);
  if (destination === 'area') {
    tools.open = false;
    return;
  }
  const tool = destination === 'inbox' ? 'activity' : destination;
  tools.activeTool = tool;
  tools.open = true;
});
mobileSheetNav.addEventListener('dsBrowseContextChange', event => {
  mobileSheetNav.browseContext = event.detail;
});
mobileSheetNav.addEventListener('dsAreaSelect', event => {
  document.documentElement.dataset.selectedArea = event.detail;
  if (event.detail === 'help') {
    tools.activeTool = 'help';
    tools.open = true;
    applyShellState('help', false);
    return;
  }
  applyShellState('area', false);
});
mobileSheetNav.addEventListener('dsClose', () => {
  applyShellState(shell.mobileDestination, false);
});
tools.addEventListener('dsToolChange', event => {
  const { id, selected } = event.detail;
  tools.activeTool = id;
  tools.open = selected;
  const item = toolItems.find(candidate => candidate.id === id);
  const destination = !selected ? 'area' : (item?.mobileDestination ?? 'inbox');
  applyShellState(destination, false);
});

window.__persistentSearchInput = document.getElementById('persistent-value');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

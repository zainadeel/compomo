import '/dist/components/ds-app-shell.js';
import '/dist/components/ds-bar-nav.js';
import '/dist/components/ds-panel-nav.js';
import '/dist/components/ds-panel-tools.js';
import '/dist/components/ds-text.js';

const groups = [
  {
    label: 'Fleet',
    items: [
      { id: 'fleet-view', label: 'Fleet View', icon: 'Map', href: '/fleet', dot: true },
      { id: 'safety', label: 'Safety', icon: 'ShieldCircle', href: '/safety' },
    ],
  },
];

const toolsItems = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true },
  { id: 'help', icon: 'CircleQuestion', ariaLabel: 'Help & Support' },
];

await Promise.all([
  customElements.whenDefined('ds-app-shell'),
  customElements.whenDefined('ds-bar-nav'),
  customElements.whenDefined('ds-panel-nav'),
  customElements.whenDefined('ds-panel-tools'),
]);

const panel = document.getElementById('panel');
panel.groups = groups;
panel.currentUrl = '/fleet';
panel.breakpoint = 1200;
panel.userName = 'Zain Adeel';
panel.userInitial = 'Z';

const bar = document.getElementById('bar');
bar.basePath = '/dashboard/tracking';
bar.currentUrl = '/dashboard/tracking/live-map';
bar.tabs = [
  { id: 'live-map', label: 'Live Map' },
  { id: 'trips', label: 'Trips' },
];

const tools = document.getElementById('tools');
tools.items = toolsItems;

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

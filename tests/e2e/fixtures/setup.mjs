import '/dist/components/ds-bar-nav.js';

const BASE_PATH = '/e2e/safety';

const manyTabs = [
  { id: 'live-map', label: 'Live Map' },
  { id: 'location-history', label: 'Location History' },
  { id: 'trips', label: 'Trips' },
  { type: 'divider' },
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events', dot: true },
  { id: 'requests', label: 'Requests' },
];

const actions = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
];

function setShellWidth(px) {
  document.getElementById('shell').style.setProperty('--shell-width', `${px}px`);
}

window.__setShellWidth = setShellWidth;

await customElements.whenDefined('ds-bar-nav');

const nav = document.getElementById('nav');
const shellParam = new URLSearchParams(location.search).get('shell');
if (shellParam) {
  setShellWidth(Number(shellParam));
}
nav.basePath = BASE_PATH;
nav.currentUrl = `${BASE_PATH}/events`;
nav.tabs = manyTabs;
nav.actions = actions;

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

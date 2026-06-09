import '/dist/components/ds-bar-nav.js';

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
  { id: 'messages', icon: 'MessageBubble', ariaLabel: 'Messages', dot: true },
  { id: 'notifications', icon: 'Bell', ariaLabel: 'Notifications', dot: true },
  { id: 'assistant', icon: 'AI', ariaLabel: 'Assistant' },
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
nav.tabs = manyTabs;
nav.actions = actions;
nav.value = 'events';

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

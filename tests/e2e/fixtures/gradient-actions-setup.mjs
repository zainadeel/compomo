import '/dist/components/ds-app-shell.js';
import '/dist/components/ds-bar-nav.js';

const actions = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'messages', icon: 'MessageBubbleStack', ariaLabel: 'Messages' },
  { id: 'stacks', icon: 'ViewMenu', ariaLabel: 'Stacks' },
  { id: 'activity', icon: 'Bell', ariaLabel: 'Activity', dot: true },
  { id: 'agents', icon: 'AI', ariaLabel: 'Agents' },
];

await customElements.whenDefined('ds-bar-nav');

const nav = document.getElementById('nav');
nav.basePath = '/e2e/safety';
nav.currentUrl = '/e2e/safety/overview';
nav.tabs = [{ id: 'overview', label: 'Overview' }];
nav.actions = actions;

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

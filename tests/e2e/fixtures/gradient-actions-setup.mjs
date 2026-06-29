import '/dist/components/ds-app-shell.js';
import '/dist/components/ds-bar-nav.js';

const actions = [
  { id: 'search', icon: 'MagnifyingGlass', ariaLabel: 'Search' },
  { id: 'inbox', icon: 'Inbox', ariaLabel: 'Inbox', dot: true },
  { id: 'assistant', icon: 'AI', ariaLabel: 'AI Assistant', dot: true },
];

await customElements.whenDefined('ds-bar-nav');

const nav = document.getElementById('nav');
nav.tabs = [{ id: 'overview', label: 'Overview' }];
nav.actions = actions;
nav.value = 'overview';

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

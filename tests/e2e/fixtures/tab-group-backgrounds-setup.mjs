import '/dist/components/ds-tab-group.js';

await customElements.whenDefined('ds-tab-group');

const tabGroup = document.getElementById('tabs');
tabGroup.tabs = [
  { id: 'overview', label: 'Overview', dot: true },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
];
tabGroup.value = 'overview';

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

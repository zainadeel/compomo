import '/dist/components/ds-panel-sub-nav.js';

await customElements.whenDefined('ds-panel-sub-nav');

const subNav = document.getElementById('sub-nav');
subNav.items = [
  { id: 'overview-tab', label: 'Overview', panelId: 'overview-panel' },
  { id: 'activity-tab', label: 'Activity', panelId: 'activity-panel', isInactive: true },
  { id: 'settings-tab', label: 'Settings', panelId: 'settings-panel' },
];
subNav.value = 'overview-tab';

function showPanel(id) {
  for (const panel of document.querySelectorAll('[role="tabpanel"]')) {
    panel.hidden = panel.id !== id;
  }
}

subNav.addEventListener('dsChange', event => {
  window.__panelSubNavChange = event.detail;
  const item = subNav.items.find(candidate => candidate.id === event.detail);
  if (item) showPanel(item.panelId);
});

showPanel('overview-panel');
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

import '/dist/components/ds-navigation-tab-group.js';
import '/dist/components/ds-tab-group.js';

await customElements.whenDefined('ds-navigation-tab-group');
await customElements.whenDefined('ds-tab-group');

const group = document.getElementById('navigation-tabs');
group.tabs = [
  { id: 'overview', label: 'Overview', panelId: 'panel-overview' },
  { id: 'activity', label: 'Activity', panelId: 'panel-activity' },
  { id: 'settings', label: 'Settings', panelId: 'panel-settings', isInactive: true },
];
group.value = 'overview';

window.navigationChangeEvents = [];
group.addEventListener('dsChange', event => {
  window.navigationChangeEvents.push(event.detail);
  document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
    panel.hidden = panel.id !== `panel-${event.detail}`;
  });
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

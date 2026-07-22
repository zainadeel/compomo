import '/dist/components/ds-shell-app.js';
import '/dist/components/ds-shell-page.js';
import '/dist/components/ds-bar-title.js';

await Promise.all([
  customElements.whenDefined('ds-shell-app'),
  customElements.whenDefined('ds-shell-page'),
  customElements.whenDefined('ds-bar-title'),
]);

const sections = [
  { id: 'summary', label: 'Summary' },
  { id: 'history', label: 'History' },
  { id: 'timecards', label: 'Timecards' },
  { type: 'divider' },
  { id: 'settings', label: 'Settings' },
];

const actions = [
  { id: 'message-driver', label: 'Message driver' },
  { id: 'share-location', label: 'Share location' },
  { type: 'divider' },
  { id: 'remove-driver', label: 'Remove driver', isDestructive: true },
];

const header = document.querySelector('#detail-header');
header.sections = sections;
header.primaryAction = { id: 'call-driver', label: 'Call driver' };
header.actions = actions;

window.__barTitleEvents = [];

header.addEventListener('dsBack', () => {
  window.__barTitleEvents.push({ type: 'back' });
});
header.addEventListener('dsSectionChange', event => {
  header.value = event.detail;
  window.__barTitleEvents.push({ type: 'section', id: event.detail });
});
header.addEventListener('dsAction', event => {
  window.__barTitleEvents.push({ type: 'action', id: event.detail });
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

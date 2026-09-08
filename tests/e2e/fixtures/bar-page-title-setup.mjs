import '/dist/components/ds-bar-page-title.js';

await customElements.whenDefined('ds-bar-page-title');

const sections = [
  { id: 'drivers', label: 'Drivers' },
  { id: 'managers', label: 'Managers' },
  { id: 'contractors', label: 'Contractors' },
  { id: 'archived', label: 'Archived' },
  { id: 'invited', label: 'Invited' },
  { id: 'pending', label: 'Pending review' },
];

const primaryAction = { id: 'create-person', label: 'Create person' };
const actions = [{ id: 'export-people', label: 'Export people' }];

window.__barPageTitleEvents = [];

function bindHeader(header) {
  header.sections = sections;
  header.primaryAction = primaryAction;
  header.actions = actions;
  header.addEventListener('dsSectionChange', event => {
    header.value = event.detail;
    window.__barPageTitleEvents.push({ type: 'section', id: event.detail, host: header.id });
  });
  header.addEventListener('dsAction', event => {
    window.__barPageTitleEvents.push({ type: 'action', id: event.detail, host: header.id });
  });
}

for (const id of ['wide-header', 'narrow-header', 'resize-header']) {
  bindHeader(document.getElementById(id));
}

window.__setBarPageTitleWidth = (px, frameId = 'resize-frame') => {
  const frame = document.getElementById(frameId);
  frame.style.width = `${px}px`;
};

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

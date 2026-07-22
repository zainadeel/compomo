import '/dist/components/ds-bar-workflow.js';

await customElements.whenDefined('ds-bar-workflow');

const header = document.querySelector('#workflow-header');
const form = document.querySelector('#workflow-form');

header.steps = [
  { id: 'details', label: 'Driver details' },
  { id: 'employment', label: 'Employment' },
  { id: 'qualifications', label: 'Qualifications' },
];
header.submitAction = { label: 'Save driver', type: 'submit' };

window.__barWorkflowEvents = [];

header.addEventListener('dsExit', () => {
  window.__barWorkflowEvents.push({ type: 'exit' });
});
header.addEventListener('dsStepChange', event => {
  window.__barWorkflowEvents.push({ type: 'step', id: event.detail });
  header.value = event.detail;
});
header.addEventListener('dsSubmit', () => {
  window.__barWorkflowEvents.push({ type: 'submit' });
});
form.addEventListener('submit', event => {
  event.preventDefault();
  window.__barWorkflowEvents.push({ type: 'form-submit' });
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

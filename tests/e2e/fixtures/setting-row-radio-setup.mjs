import '/dist/components/ds-setting-row-radio.js';
import '/dist/components/ds-radio.js';

await Promise.all([
  customElements.whenDefined('ds-setting-row-radio'),
  customElements.whenDefined('ds-radio'),
]);

const radio = document.querySelector('#validation-mode');
radio.options = [
  {
    label: 'Use automated validation',
    value: 'enabled',
    description: 'Apply automated checks and human review to validate results.',
  },
  {
    label: 'Skip automated validation',
    value: 'disabled',
    description: 'Keep results available without additional validation.',
  },
  {
    label: 'Unavailable option',
    value: 'unavailable',
    description: 'This option is managed by your organization.',
    isInactive: true,
  },
];
radio.value = 'enabled';

const formRadio = document.querySelector('#form-radio');
formRadio.options = [
  { label: 'Use automated validation', value: 'enabled' },
  { label: 'Skip automated validation', value: 'disabled' },
];
formRadio.value = 'enabled';

window.__settingRowRadioChanges = [];
radio.addEventListener('dsChange', event => {
  window.__settingRowRadioChanges.push(event.detail);
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

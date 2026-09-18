import '/dist/components/ds-setting-row-checkbox.js';
import '/dist/components/ds-checkbox-group.js';
import '/dist/components/ds-checkbox.js';

await Promise.all([
  customElements.whenDefined('ds-setting-row-checkbox'),
  customElements.whenDefined('ds-checkbox-group'),
  customElements.whenDefined('ds-checkbox'),
]);

window.__settingRowCheckboxChanges = [];
document.querySelector('#alert-channels').addEventListener('dsChange', event => {
  const target = event.target;
  window.__settingRowCheckboxChanges.push({
    value: target.value,
    checked: event.detail,
  });
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

import '/dist/components/ds-data-customize.js';
await customElements.whenDefined('ds-data-customize');

const FIELDS = [
  { id: 'driverId', label: 'Driver ID' },
  { id: 'vehicleMmy', label: 'Vehicle MMY' },
  { id: 'motion', label: 'Motion detail' },
];

const customize = document.querySelector('#customize');
customize.ariaLabel = 'Customize view';
customize.fields = FIELDS;
customize.options = [{ label: 'Show applied filters', value: 'show-filters', showSwitch: true }];
customize.addEventListener('dsFieldsConfigChange', e => {
  customize.hiddenFieldIds = e.detail.hiddenFieldIds;
  customize.fieldOrder = e.detail.fieldOrder;
});
customize.addEventListener('dsOptionChange', e => {
  customize.dataset.lastOption = e.detail;
});

const reorderable = document.querySelector('#reorderable');
reorderable.ariaLabel = 'Customize columns';
reorderable.reorderable = true;
reorderable.minVisible = 1;
reorderable.fields = FIELDS;
reorderable.hiddenFieldIds = ['vehicleMmy', 'motion'];

document.documentElement.dataset.ready = 'true';

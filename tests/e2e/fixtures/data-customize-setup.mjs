import '/dist/components/ds-data-customize.js';
import '/dist/components/ds-data-toolbar.js';
import '/dist/components/ds-data-filter.js';
import '/dist/components/ds-data-group.js';
import '/dist/components/ds-data-sort.js';
import '/dist/components/ds-data-saved-views.js';
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

const toolbar = document.createElement('ds-data-toolbar');
toolbar.id = 'standalone-toolbar';
toolbar.label = 'Map controls';
toolbar.style.width = '960px';
toolbar.innerHTML = `
  <ds-data-saved-views slot="start" id="standalone-views"></ds-data-saved-views>
  <ds-data-filter slot="trailing" id="standalone-filter" aria-label="Filter map"></ds-data-filter>
  <ds-data-group slot="trailing" id="standalone-group" aria-label="Group map"></ds-data-group>
  <ds-data-sort slot="trailing" id="standalone-sort" aria-label="Sort map"></ds-data-sort>
  <ds-data-customize slot="trailing" id="standalone-customize" label="Visible fields"></ds-data-customize>
`;
toolbar.querySelector('#standalone-views').views = [{ id: 'west', label: 'West region' }];
toolbar.querySelector('#standalone-views').value = 'west';
toolbar.querySelector('#standalone-filter').filters = [
  { id: 'motion', label: 'Motion', kind: 'multiple', options: [{ label: 'Moving', value: 'moving' }] },
];
toolbar.querySelector('#standalone-group').options = [{ label: 'Motion', value: 'motion' }];
toolbar.querySelector('#standalone-sort').fields = [{ id: 'motion', label: 'Motion', sortable: true }];
toolbar.querySelector('#standalone-customize').fields = FIELDS;
document.body.append(toolbar);

document.documentElement.dataset.ready = 'true';

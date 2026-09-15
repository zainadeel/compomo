import '/dist/components/ds-data-preferences.js';
await customElements.whenDefined('ds-data-preferences');

// Non-table catalog: show/hide only, own header and menu name, nothing locked.
const toggleOnly = document.querySelector('#toggle-only');
toggleOnly.embedded = true;
toggleOnly.activeTab = 'customize';
toggleOnly.customizeLabel = 'Customize view';
toggleOnly.catalogHeader = 'Data';
toggleOnly.catalogReorderable = false;
toggleOnly.fields = [
  { id: 'driverId', label: 'Driver ID' },
  { id: 'vehicleMmy', label: 'Vehicle MMY' },
  { id: 'motion', label: 'Motion detail' },
];
toggleOnly.customizeOptions = [
  { label: 'Show applied filters', value: 'show-filters', showSwitch: true },
];
toggleOnly.addEventListener('dsColumnsConfigChange', e => {
  Object.assign(toggleOnly, e.detail);
});

// Table catalog keeps its own policy: reorderable rows, last column locked.
const tableCatalog = document.querySelector('#table-catalog');
tableCatalog.embedded = true;
tableCatalog.activeTab = 'customize';
tableCatalog.fields = [
  { id: 'driver', label: 'Driver' },
  { id: 'status', label: 'Status' },
  { id: 'vehicle', label: 'Vehicle' },
];
tableCatalog.hiddenColumnIds = ['status', 'vehicle'];
tableCatalog.addEventListener('dsColumnsConfigChange', e => {
  Object.assign(tableCatalog, e.detail);
});

document.documentElement.dataset.ready = 'true';

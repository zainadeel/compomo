import '/dist/components/ds-data-preferences.js';
await customElements.whenDefined('ds-data-preferences');

// Non-table catalog: show/hide only, own header and menu name, nothing locked.
const toggleOnly = document.querySelector('#toggle-only');
toggleOnly.embedded = true;
toggleOnly.activeTab = 'customize';
toggleOnly.customizeLabel = 'Customize view';
toggleOnly.catalogHeader = 'Data';
toggleOnly.catalogReorderable = false;
toggleOnly.columns = [
  { id: 'driverId', header: 'Driver ID' },
  { id: 'vehicleMmy', header: 'Vehicle MMY' },
  { id: 'motion', header: 'Motion detail' },
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
tableCatalog.columns = [
  { id: 'driver', header: 'Driver' },
  { id: 'status', header: 'Status' },
  { id: 'vehicle', header: 'Vehicle' },
];
tableCatalog.hiddenColumnIds = ['status', 'vehicle'];
tableCatalog.addEventListener('dsColumnsConfigChange', e => {
  Object.assign(tableCatalog, e.detail);
});

document.documentElement.dataset.ready = 'true';

import '/dist/components/ds-table-search.js';

await customElements.whenDefined('ds-table-search');

const search = document.getElementById('search');
search.columns = [
  {
    id: 'vehicleDetails',
    header: 'Vehicle ID / Make · Model · Year',
    headerSegments: [
      { label: 'Vehicle ID', dataLabel: 'Vehicle ID', sortKey: 'vehicleId', separator: '/' },
      { label: 'Make', dataLabel: 'Vehicle make', sortKey: 'vehicleMake', separator: '·' },
      { label: 'Model', dataLabel: 'Vehicle model', sortKey: 'vehicleModel', separator: '·' },
      { label: 'Year', dataLabel: 'Vehicle year', sortKey: 'vehicleYear' },
    ],
  },
  {
    id: 'driverDetails',
    header: 'Driver name / ID',
    headerSegments: [
      { label: 'Driver name', dataLabel: 'Driver name', sortKey: 'driverName', separator: '/' },
      { label: 'ID', dataLabel: 'Driver ID', sortKey: 'driverId' },
    ],
  },
  { id: 'preview', header: 'Preview', searchable: false },
  { id: 'actions', kind: 'action', header: '', headerLabel: 'Actions' },
];
search.value = '';
search.selectedFieldIds = [];
search.eventLog = [];
search.addEventListener('dsChange', event => {
  search.eventLog.push({ type: 'change', value: event.detail });
  search.value = event.detail;
});
search.addEventListener('dsFieldsChange', event => {
  search.eventLog.push({ type: 'fields', selectedFieldIds: event.detail.selectedFieldIds });
  search.selectedFieldIds = event.detail.selectedFieldIds;
});
search.addEventListener('dsClear', () => {
  search.eventLog.push({ type: 'clear' });
});

document.documentElement.dataset.ready = 'true';

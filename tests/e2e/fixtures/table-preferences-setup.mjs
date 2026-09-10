import '/dist/components/ds-table-preferences.js';
await customElements.whenDefined('ds-table-preferences');
const control = document.querySelector('#preferences');
control.columns = [
  { id: 'driver', header: 'Driver', sortable: true },
  { id: 'status', header: 'Status', sortable: true },
  { id: 'vehicle', header: 'Vehicle' },
];
control.filters = [
  {
    id: 'status',
    label: 'Status',
    kind: 'multiple',
    options: [
      { label: 'Driving', value: 'driving' },
      { label: 'Stopped', value: 'stopped' },
    ],
  },
];
control.groupingOptions = [{ label: 'Status', value: 'status' }];
control.addEventListener('dsFilterChange', e => {
  control.values = { ...control.values, [e.detail.filterId]: e.detail.value };
});
control.addEventListener('dsFiltersClear', () => {
  control.values = {};
});
control.addEventListener('dsSortChange', e => {
  control.sort = e.detail.sort;
});
control.addEventListener('dsGroupChange', e => {
  control.grouping = e.detail;
});
control.addEventListener('dsGroupClear', () => {
  control.grouping = null;
});
control.addEventListener('dsColumnsConfigChange', e => {
  Object.assign(control, e.detail);
});
document.documentElement.dataset.ready = 'true';

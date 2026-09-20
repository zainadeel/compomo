import type { TableColumn, TableRow } from './table-types';

export const REVIEW_COLUMNS: TableColumn[] = [
  {
    id: 'driver',
    label: 'Driver',
    size: 'sm',
    sticky: 'start',
    sortable: true,
    group: { id: 'identity', label: 'Identity' },
  },
  {
    id: 'vehicle',
    label: 'Vehicle',
    size: 'xs',
    sticky: 'start',
    group: { id: 'identity', label: 'Identity' },
  },
  {
    id: 'event',
    label: 'Event / severity',
    size: 'sm',
    sortable: true,
    segments: [
      { label: 'Event', sortKey: 'event' },
      { label: 'Severity', sortKey: 'severity' },
    ],
    group: { id: 'trip', label: 'Trip details' },
  },
  { id: 'location', label: 'Location', size: 'sm' },
  {
    id: 'status',
    label: 'Status',
    size: 'xs',
    sticky: 'end',
    group: { id: 'review', label: 'Review' },
  },
  {
    id: 'action',
    label: '',
    accessibleLabel: 'Actions',
    kind: 'action',
    size: 40,
    sticky: 'end',
    group: { id: 'review', label: 'Review' },
  },
];

export function tableReviewRows(count = 8): TableRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `review-${index}`,
    selectionLabel: `Driver ${index + 1}`,
    interactive: true,
    cells: {
      driver: {
        primary: `Driver ${String(index + 1).padStart(5, '0')}`,
        secondary: `DRV-${index + 1}`,
        tertiary: 'West coast fleet',
      },
      vehicle: {
        kind: 'icon-text',
        icon: 'VehicleTruck',
        primary: `V-${2048 + index}`,
        secondary: 'Class 8',
      },
      event: {
        primary: index % 2 ? 'Close following' : 'Harsh braking',
        secondary: index % 2 ? 'High' : 'Medium',
        tertiary: 'Recorded today',
      },
      severity: index % 2 ? 'High' : 'Medium',
      location: { primary: 'Burnaby, BC', secondary: 'Highway 1', tertiary: 'Northbound' },
      status: { kind: 'tag', label: 'Pending', intent: 'caution' },
      action: {
        kind: 'action',
        ariaLabel: `Actions for Driver ${index + 1}`,
        items: [{ actionId: 'review', label: 'Review event' }],
      },
    },
    cellPresentation:
      index % 3 === 0
        ? {
            event: { highlight: { intent: 'negative', label: 'Needs review' } },
            location: { flag: { label: 'Location needs confirmation', icon: 'DocumentInverted' } },
          }
        : undefined,
  }));
}

export const EDIT_COLUMNS: TableColumn[] = [
  {
    id: 'name',
    label: 'Driver',
    size: 'sm',
    sticky: 'start',
    editor: { type: 'text', required: true },
  },
  {
    id: 'limit',
    label: 'Limit (0–100)',
    size: 'xs',
    editor: { type: 'number', min: 0, max: 100, required: true },
  },
  { id: 'note', label: 'Dispatch note', editor: { type: 'text' } },
  { id: 'recordId', label: 'Record ID', size: 'xs' },
];
export const EDIT_ROWS: TableRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: `edit-${i}`,
  disabled: i === 3,
  cells: {
    name: `Driver ${i + 1}`,
    limit: 50 + i,
    note: i === 3 ? 'Read-only record' : 'Ready',
    recordId: `DRV-${i + 1}`,
  },
}));

export const FIELD_COLUMNS: TableColumn[] = [
  EDIT_COLUMNS[0],
  {
    id: 'limit',
    label: 'Limit',
    size: 'xs',
    editor: { type: 'number', min: 0, max: 100, step: 5 },
  },
  {
    id: 'status',
    label: 'Status',
    size: 'xs',
    editor: {
      type: 'select',
      options: [
        { value: 'Ready', label: 'Ready' },
        { value: 'In transit', label: 'In transit' },
        { value: 'Unavailable', label: 'Unavailable', isInactive: true },
      ],
    },
  },
  { id: 'date', label: 'Dispatch date', size: 'sm', editor: { type: 'date' } },
  { id: 'time', label: 'Departure', size: 'xs', editor: { type: 'time', step: 900 } },
  { id: 'note', label: 'Notes', size: 'sm', editor: { type: 'textarea', maxLength: 200 } },
  EDIT_COLUMNS[3],
];
export const FIELD_ROWS: TableRow[] = EDIT_ROWS.slice(0, 6).map(row => ({
  ...row,
  cells: { ...row.cells, limit: 50, status: 'Ready', date: '2026-09-20', time: '09:00' },
}));

export const MERGE_COLUMNS: TableColumn[] = [
  { id: 'fleet', label: 'Fleet', size: 'sm' },
  { id: 'monday', label: 'Monday', group: { id: 'week', label: 'Weekly coverage' } },
  { id: 'tuesday', label: 'Tuesday', group: { id: 'week', label: 'Weekly coverage' } },
  { id: 'wednesday', label: 'Wednesday', group: { id: 'week', label: 'Weekly coverage' } },
];
export const MERGE_ROWS: TableRow[] = [
  {
    id: 'west-am',
    cells: {
      fleet: { primary: 'West fleet', secondary: 'Two shifts' },
      monday: 'Training · Monday and Tuesday',
      tuesday: '',
      wednesday: 'Morning coverage',
    },
  },
  {
    id: 'west-pm',
    cells: { fleet: '', monday: 'Dispatch', tuesday: 'Dispatch', wednesday: 'Afternoon coverage' },
  },
  {
    id: 'east',
    cells: { fleet: 'East fleet', monday: 'All-week maintenance', tuesday: '', wednesday: '' },
  },
];

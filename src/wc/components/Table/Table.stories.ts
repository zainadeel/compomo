import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import '../../../../dist/components/ds-table.js';
import '../../../../dist/components/ds-text.js';
import '../../../../dist/components/ds-input.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-bar-action.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-menu.js';
import '../../../../dist/components/ds-tooltip.js';
import '../../../../dist/components/ds-pagination.js';
import '../../styles/table.css';
import type {
  TableCellAction,
  TableCellActionMenuEntry,
  TableColumn,
  TableColumnsConfigChangeDetail,
  TableDataMode,
  TableDataModeChangeDetail,
  TableGroup,
  TableGroupIntent,
  TableGroupingState,
  TableRow,
  TableSortState,
} from './table-types';
import type { PaginationChangeDetail } from '../Pagination/pagination-types';

/** 8px cell chrome on both sides plus a 16:9 preview at the matching track stack. */

const OVERFLOW_ACTION_ITEMS: TableCellActionMenuEntry[] = [
  { actionId: 'view', label: 'View details' },
  { actionId: 'edit', label: 'Edit' },
  { actionId: 'download', label: 'Download report', isInactive: true },
  { kind: 'divider' },
  { actionId: 'delete', label: 'Delete', isDestructive: true },
];

function overflowAction(name: string): TableCellAction {
  return {
    kind: 'action',
    ariaLabel: `More actions for ${name}`,
    items: OVERFLOW_ACTION_ITEMS,
  };
}

function applyColumnsConfig(event: Event) {
  const table = event.currentTarget as HTMLElement & {
    hiddenColumnIds: string[];
    columnOrder: string[];
  };
  const detail = (event as CustomEvent<TableColumnsConfigChangeDetail>).detail;
  table.hiddenColumnIds = detail.hiddenColumnIds;
  table.columnOrder = detail.columnOrder;
}

function tableRowSearchText(row: TableRow): string {
  const textFrom = (value: unknown): string => {
    if (value == null) return '';
    if (typeof value !== 'object') return String(value);
    if (Array.isArray(value)) return value.map(textFrom).join(' ');
    return Object.values(value).map(textFrom).join(' ');
  };

  return [row.selectionLabel, ...Object.values(row.cells)].map(textFrom).join(' ');
}

const COLUMNS: TableColumn[] = [
  { id: 'driver', header: 'Driver', sortable: true, size: 'sm' },
  { id: 'status', header: 'Status', sortable: true, size: 'xs' },
  { id: 'vehicle', header: 'Vehicle', sortable: true, size: 'xs' },
  { id: 'location', header: 'Last known location', size: 'sm' },
  {
    id: 'safetyScore',
    header: 'Safety score',
    sortable: true,
    align: 'end',
    size: 'xs',
    help: 'Rolling 7-day safety score from 0 to 100.',
  },
  { id: 'driveTime', header: 'Drive time', sortable: true, align: 'end', size: 'xs' },
];

const ROWS: TableRow[] = [
  {
    id: 'driver-avery',
    selectionLabel: 'Avery Chen',
    cells: {
      driver: { primary: 'Avery Chen', secondary: 'avery.chen@example.com' },
      status: 'Driving',
      vehicle: 'V-2048',
      location: 'Burnaby, BC',
      safetyScore: { primary: 98, fontFeature: 'tabular-nums' },
      driveTime: { primary: '5h 42m', fontFeature: 'tabular-nums' },
    },
  },
  {
    id: 'driver-jordan',
    selectionLabel: 'Jordan Patel',
    cells: {
      driver: { primary: 'Jordan Patel', secondary: 'jordan.patel@example.com' },
      status: 'On duty',
      vehicle: 'V-1822',
      location: 'Richmond, BC',
      safetyScore: { primary: 94, fontFeature: 'tabular-nums' },
      driveTime: { primary: '3h 18m', fontFeature: 'tabular-nums' },
    },
  },
  {
    id: 'driver-morgan',
    selectionLabel: 'Morgan Lee',
    cells: {
      driver: { primary: 'Morgan Lee', secondary: 'morgan.lee@example.com' },
      status: 'Driving',
      vehicle: 'V-2105',
      location: 'Coquitlam, BC',
      safetyScore: { primary: 91, fontFeature: 'tabular-nums' },
      driveTime: { primary: '6h 05m', fontFeature: 'tabular-nums' },
    },
  },
  {
    id: 'driver-sam',
    selectionLabel: 'Sam Rivera',
    cells: {
      driver: { primary: 'Sam Rivera', secondary: 'sam.rivera@example.com' },
      status: 'Off duty',
      vehicle: null,
      location: 'Surrey, BC',
      safetyScore: { primary: 89, fontFeature: 'tabular-nums' },
      driveTime: { primary: '0h 00m', fontFeature: 'tabular-nums' },
    },
  },
  {
    id: 'driver-priya',
    selectionLabel: 'Priya Shah',
    cells: {
      driver: { primary: 'Priya Shah', secondary: 'priya.shah@example.com' },
      status: 'On duty',
      vehicle: 'V-1974',
      location: 'New Westminster, BC',
      safetyScore: { primary: 87, fontFeature: 'tabular-nums' },
      driveTime: { primary: '2h 51m', fontFeature: 'tabular-nums' },
    },
  },
  {
    id: 'driver-alex',
    selectionLabel: 'Alex Thompson',
    cells: {
      driver: { primary: 'Alex Thompson', secondary: 'alex.thompson@example.com' },
      status: 'Driving',
      vehicle: 'V-2011',
      location: 'Vancouver, BC',
      safetyScore: { primary: 84, fontFeature: 'tabular-nums' },
      driveTime: { primary: '7h 14m', fontFeature: 'tabular-nums' },
    },
  },
];

const ASYNC_COLUMNS: TableColumn[] = [
  { id: 'driver', header: 'Driver', size: 'sm' },
  { id: 'status', header: 'Status', size: 'xs' },
  { id: 'vehicle', header: 'Vehicle', size: 'xs' },
];

const COMPOSED_SKELETON_COLUMNS: TableColumn[] = [
  { id: 'preview', header: 'Preview', imageTracks: 2, skeleton: { kind: 'image', tracks: 2 } },
  {
    id: 'event',
    header: 'Event',
    size: 'sm',
    skeleton: { kind: 'text', lines: 2, primaryWidth: '78%', secondaryWidth: '42%' },
  },
  { id: 'status', header: 'Status', size: 'xs', skeleton: { kind: 'tag', width: '64%' } },
  { id: 'notes', header: 'Notes', size: 'xs', align: 'center', skeleton: { kind: 'icon' } },
  {
    id: 'actions',
    header: '',
    headerLabel: 'Actions',
    kind: 'action',
    size: 40,
    align: 'center',
    skeleton: { kind: 'action', variant: 'icon' },
  },
];

const ALIGNMENT_COLUMNS: TableColumn[] = [
  { id: 'driver', header: 'Start aligned', sortable: true, align: 'start', size: 'sm' },
  { id: 'status', header: 'Center aligned', sortable: true, align: 'center', size: 'sm' },
  { id: 'score', header: 'End aligned', sortable: true, align: 'end', size: 'sm' },
];

const ALIGNMENT_ROWS: TableRow[] = [
  { id: 'alignment-one', cells: { driver: 'Avery Chen', status: 'Driving', score: 98 } },
  { id: 'alignment-two', cells: { driver: 'Jordan Patel', status: 'On duty', score: 94 } },
  { id: 'alignment-three', cells: { driver: 'Sam Rivera', status: 'Off duty', score: 89 } },
];

const ELASTIC_SPACER_COLUMNS: TableColumn[] = [
  { id: 'driver', header: 'Driver', size: 'sm' },
  { id: 'status', header: 'Status', size: 'xs' },
  { id: 'vehicle', header: 'Vehicle', size: 'xs' },
  {
    id: 'actions',
    header: '',
    headerLabel: 'Actions',
    kind: 'action',
    size: 40,
    align: 'center',
    sticky: 'end',
  },
];

const ELASTIC_SPACER_ROWS: TableRow[] = ROWS.slice(0, 3).map(row => ({
  ...row,
  cells: {
    driver: row.cells['driver'],
    status: row.cells['status'],
    vehicle: row.cells['vehicle'],
    actions: { kind: 'blank' },
  },
}));

const ALL_CELL_TYPE_COLUMNS: TableColumn[] = [
  { id: 'scalar', header: 'Scalar text', size: 'sm' },
  { id: 'primarySecondary', header: 'Primary + secondary', size: 'sm' },
  { id: 'linkedText', header: 'Linked text', size: 'sm' },
  { id: 'primaryPair', header: 'Primary + primary', size: 'sm' },
  { id: 'event', header: 'Event', size: 'sm' },
  { id: 'image', header: 'Image', imageTracks: 2 },
  { id: 'icon', header: 'Icon only', align: 'center', size: 'xs' },
  { id: 'iconText', header: 'Icon + text', size: 'sm' },
  { id: 'tagOnly', header: 'Tag only', size: 'sm' },
  { id: 'tagWithText', header: 'Tag + text', size: 'sm' },
  { id: 'textWithTag', header: 'Text + tag', size: 'sm' },
  { id: 'multipleTags', header: 'Multiple tags', size: 160 },
  { id: 'action', kind: 'action', header: '', headerLabel: 'Action', align: 'center', size: 40 },
  {
    id: 'borderedAction',
    kind: 'action',
    header: '',
    headerLabel: 'Bordered action',
    align: 'center',
    size: 40,
  },
  { id: 'empty', header: 'Empty', size: 'xs' },
  { id: 'blank', header: 'Blank', size: 'xs' },
];

const SINGLE_TRACK_COLUMNS: TableColumn[] = [
  { id: 'scalar', header: 'Scalar text', size: 'sm' },
  { id: 'linkedText', header: 'Linked text', size: 'sm' },
  { id: 'image', header: 'Image', imageTracks: 1 },
  { id: 'icon', header: 'Icon only', align: 'center', size: 'xs' },
  { id: 'iconText', header: 'Icon + text', size: 'sm' },
  { id: 'tagOnly', header: 'Tag only', size: 'sm' },
  { id: 'action', kind: 'action', header: '', headerLabel: 'Action', align: 'center', size: 40 },
  {
    id: 'borderedAction',
    kind: 'action',
    header: '',
    headerLabel: 'Bordered action',
    align: 'center',
    size: 40,
  },
  { id: 'empty', header: 'Empty', size: 'xs' },
  { id: 'blank', header: 'Blank', size: 'xs' },
];

const SINGLE_TRACK_ROWS: TableRow[] = [
  {
    id: 'single-track-one',
    selectionLabel: 'Vehicle 2841',
    cells: {
      scalar: 'Vehicle 2841',
      linkedText: {
        primary: 'Freightliner Cascadia',
        href: '/vehicles/VEH-1042',
      },
      image: { kind: 'image', alt: 'Vehicle preview unavailable' },
      icon: { kind: 'icon', icon: 'DocumentInverted', color: 'secondary', label: 'Has notes' },
      iconText: { kind: 'icon-text', icon: 'VehicleTruck', primary: 'Freightliner Cascadia' },
      tagOnly: { kind: 'tag', label: 'Pending', intent: 'caution' },
      action: overflowAction('Vehicle 2841'),
      borderedAction: {
        kind: 'action',
        actionId: 'more-bordered',
        variant: 'icon',
        icon: 'Ellipses',
        ariaLabel: 'More actions with border',
        hasBorder: true,
      },
      empty: { kind: 'empty' },
      blank: { kind: 'blank' },
    },
  },
  {
    id: 'single-track-two',
    selectionLabel: 'Vehicle 1904',
    cells: {
      scalar: 'Vehicle 1904',
      linkedText: {
        primary: 'Volvo VNL',
        href: '/vehicles/VEH-1904',
      },
      image: { kind: 'image', alt: 'Vehicle preview unavailable' },
      icon: { kind: 'icon', icon: 'DocumentInverted', color: 'secondary', label: 'Has notes' },
      iconText: { kind: 'icon-text', icon: 'VehicleTruck', primary: 'Volvo VNL' },
      tagOnly: { kind: 'tag', label: 'Active', intent: 'positive' },
      action: overflowAction('Vehicle 1904'),
      borderedAction: {
        kind: 'action',
        actionId: 'more-bordered',
        variant: 'icon',
        icon: 'Ellipses',
        ariaLabel: 'More actions with border',
        hasBorder: true,
      },
      empty: { kind: 'empty' },
      blank: { kind: 'blank' },
    },
  },
];

const ALL_CELL_TYPE_ROWS: TableRow[] = [
  {
    id: 'all-cell-types-one',
    selectionLabel: 'First all-cell-types example',
    cells: {
      scalar: 'Vehicle 2841',
      primarySecondary: { primary: 'John Smith', secondary: 'DRV-1048' },
      linkedText: {
        primary: 'Freightliner Cascadia',
        secondary: 'VEH-1042',
        href: '/vehicles/VEH-1042',
      },
      primaryPair: { kind: 'primary-text', primary: 'Vehicle', secondary: 'VH-2841' },
      event: {
        primary: 'Speeding',
        secondary: [{ text: 'High', color: 'negative' }, { text: '45 mph over' }],
      },
      image: { kind: 'image', tracks: 2, alt: 'Safety event preview unavailable' },
      icon: { kind: 'icon', icon: 'DocumentInverted', color: 'secondary', label: 'Has notes' },
      iconText: {
        kind: 'icon-text',
        icon: 'VehicleTruck',
        primary: 'Freightliner Cascadia',
        href: '/vehicles/VEH-1042',
        secondary: [{ text: 'VEH-1042' }, { text: 'Class 8' }],
      },
      tagOnly: { kind: 'tag', label: 'Pending', intent: 'caution' },
      tagWithText: {
        kind: 'tag',
        variant: 'tag-with-text',
        label: 'Coachable',
        intent: 'negative',
        text: 'Needs review',
      },
      textWithTag: {
        kind: 'tag',
        variant: 'text-with-tag',
        text: 'Review complete',
        label: 'Coached',
        intent: 'neutral',
      },
      multipleTags: {
        kind: 'tags',
        tracks: 2,
        items: [
          { label: 'Harsh braking', intent: 'warning' },
          { label: 'Close following', intent: 'negative' },
        ],
      },
      action: overflowAction('Vehicle 2841'),
      borderedAction: {
        kind: 'action',
        actionId: 'more-bordered',
        variant: 'icon',
        icon: 'Ellipses',
        ariaLabel: 'More actions with border',
        hasBorder: true,
      },
      empty: { kind: 'empty' },
      blank: { kind: 'blank' },
    },
  },
];

const THREE_TRACK_COLUMNS: TableColumn[] = [
  { id: 'image', header: 'Image', imageTracks: 3 },
  { id: 'iconText', header: 'Icon + text', size: 'sm' },
  { id: 'driver', header: 'Driver', size: 'sm' },
  { id: 'vehicle', header: 'Vehicle', size: 'sm' },
  { id: 'event', header: 'Event', size: 'sm' },
];

const THREE_TRACK_ROWS: TableRow[] = [
  {
    id: 'three-track-avery',
    selectionLabel: 'Avery Chen',
    cells: {
      driver: {
        primary: 'Avery Chen',
        secondary: 'DRV-1048',
        tertiary: 'Dallas, TX',
      },
      vehicle: {
        primary: 'Freightliner Cascadia',
        href: '/vehicles/VEH-1042',
        secondary: 'VEH-1042',
        tertiary: 'Class 8',
      },
      event: {
        primary: 'Speeding',
        secondary: 'High',
        secondaryColor: 'negative',
        tertiary: '45 mph over',
      },
      image: { kind: 'image', tracks: 3, alt: 'Safety event preview unavailable' },
      iconText: {
        kind: 'icon-text',
        icon: 'Person',
        primary: 'Avery Chen',
        secondary: 'DRV-1048',
        tertiary: 'Dallas, TX',
      },
    },
  },
  {
    id: 'three-track-jordan',
    selectionLabel: 'Jordan Patel',
    cells: {
      driver: {
        primary: 'Jordan Patel',
        secondary: 'DRV-2210',
        tertiary: 'Oakland, CA',
      },
      vehicle: {
        primary: 'Volvo VNL',
        href: '/vehicles/VEH-1904',
        secondary: 'VEH-1904',
        tertiary: 'Class 8',
      },
      event: {
        primary: 'Lane cutoff',
        secondary: 'High',
        secondaryColor: 'negative',
        tertiary: '12 ft',
      },
      image: { kind: 'image', tracks: 3, alt: 'Safety event preview unavailable' },
      iconText: {
        kind: 'icon-text',
        icon: 'Person',
        primary: 'Jordan Patel',
        secondary: 'DRV-2210',
        tertiary: 'Oakland, CA',
      },
    },
  },
];

const MULTIPLE_TAG_COLUMNS: TableColumn[] = [
  { id: 'vehicle', header: 'Vehicle', size: 160 },
  { id: 'behaviors', header: 'Detected behaviors', size: 160 },
  { id: 'status', header: 'Status', size: 120 },
];

const MULTIPLE_TAG_ROWS: TableRow[] = [
  {
    id: 'multiple-tags-two-tracks',
    cells: {
      vehicle: 'Vehicle 2841',
      behaviors: {
        kind: 'tags',
        tracks: 2,
        items: [
          { label: 'Harsh braking', intent: 'warning' },
          { label: 'Close following', intent: 'negative' },
        ],
      },
      status: 'Two tracks',
    },
  },
  {
    id: 'multiple-tags-three-tracks',
    cells: {
      vehicle: 'Vehicle 1904',
      behaviors: {
        kind: 'tags',
        tracks: 3,
        items: [
          { label: 'Harsh braking', intent: 'warning' },
          { label: 'Close following', intent: 'negative' },
          { label: 'Lane departure', intent: 'caution' },
        ],
      },
      status: 'Three tracks',
    },
  },
];

const SAFETY_EVENT_COLUMNS: TableColumn[] = [
  { id: 'preview', header: 'Preview', imageTracks: 2 },
  {
    id: 'behaviorDetails',
    header: 'Behavior / Severity',
    headerSegments: [
      { label: 'Behavior', sortKey: 'behavior', separator: '/' },
      { label: 'Severity', sortKey: 'severity' },
    ],
    sortable: true,
    size: 'sm',
  },
  {
    id: 'driverDetails',
    header: 'Driver name / ID',
    headerSegments: [
      { label: 'Driver name', sortKey: 'driverName', separator: '/' },
      { label: 'ID', sortKey: 'driverId' },
    ],
    sortable: true,
    size: 'sm',
  },
  {
    id: 'vehicleDetails',
    header: 'Vehicle ID / Make · Model · Year',
    headerSegments: [
      { label: 'Vehicle ID', sortKey: 'vehicleId', separator: '/' },
      { label: 'Make', sortKey: 'vehicleMake', separator: '·' },
      { label: 'Model', sortKey: 'vehicleModel', separator: '·' },
      { label: 'Year', sortKey: 'vehicleYear' },
    ],
    sortable: true,
    size: 'md',
  },
  {
    id: 'dateLocation',
    header: 'Date-time (PT) / Location',
    headerSegments: [
      { label: 'Date-time (PT)', sortKey: 'eventTime', separator: '/' },
      { label: 'Location', sortKey: 'location' },
    ],
    sortable: true,
    size: 'sm',
  },
  { id: 'status', header: 'Status', sortable: true, size: 'sm' },
  { id: 'notes', header: 'Notes', align: 'center', sortable: true, size: 'xs' },
  {
    id: 'actions',
    kind: 'action',
    header: '',
    headerLabel: 'Actions',
    align: 'center',
    size: 40,
    sticky: 'end',
  },
];

const SAFETY_EVENT_ROWS: TableRow[] = [
  {
    id: 'safety-event-1048',
    selectionLabel: 'Close following event for John Smith',
    interactive: true,
    cells: {
      preview: { kind: 'image', tracks: 2, alt: 'Road-facing video preview unavailable' },
      behaviorDetails: {
        primary: 'Close following',
        secondary: 'Critical',
        secondaryColor: 'negative',
      },
      behavior: 'Close following',
      severity: 'Critical',
      driverDetails: { primary: 'John Smith', secondary: 'DRV-1048' },
      driverName: 'John Smith',
      driverId: 'DRV-1048',
      vehicleDetails: { primary: 'VH-2841', secondary: 'Freightliner Cascadia · 2024' },
      vehicleId: 'VH-2841',
      vehicleMake: 'Freightliner',
      vehicleModel: 'Cascadia',
      vehicleYear: 2024,
      dateLocation: { primary: 'Aug 7, 2026 · 9:32 AM', secondary: 'Fresno, CA' },
      eventTime: '2026-08-07T09:32:00-07:00',
      location: 'Fresno, CA',
      status: { kind: 'tag', label: 'Pending review', intent: 'caution' },
      notes: {
        kind: 'icon',
        icon: 'DocumentInverted',
        color: 'secondary',
        label: 'Has notes',
        sortValue: true,
      },
      actions: overflowAction('John Smith'),
    },
  },
  {
    id: 'safety-event-1047',
    selectionLabel: 'Lane cutoff event for Maria Garcia',
    interactive: true,
    cells: {
      preview: { kind: 'image', tracks: 2, alt: 'Dual-facing video preview unavailable' },
      behaviorDetails: { primary: 'Lane cutoff', secondary: 'High', secondaryColor: 'warning' },
      behavior: 'Lane cutoff',
      severity: 'High',
      driverDetails: { primary: 'Maria Garcia', secondary: 'DRV-2256' },
      driverName: 'Maria Garcia',
      driverId: 'DRV-2256',
      vehicleDetails: { primary: 'VH-1904', secondary: 'Volvo VNL · 2023' },
      vehicleId: 'VH-1904',
      vehicleMake: 'Volvo',
      vehicleModel: 'VNL',
      vehicleYear: 2023,
      dateLocation: { primary: 'Aug 7, 2026 · 8:14 AM', secondary: 'Oakland, CA' },
      eventTime: '2026-08-07T08:14:00-07:00',
      location: 'Oakland, CA',
      status: { kind: 'tag', label: 'Coachable', intent: 'negative' },
      notes: {
        kind: 'icon',
        icon: 'DocumentInverted',
        color: 'quaternary',
        label: 'No notes',
        sortValue: false,
      },
      actions: overflowAction('Maria Garcia'),
    },
  },
  {
    id: 'safety-event-1046',
    selectionLabel: 'Distraction event for David Chen',
    interactive: true,
    cells: {
      preview: { kind: 'image', tracks: 2, alt: 'Driver-facing video preview unavailable' },
      behaviorDetails: { primary: 'Distraction', secondary: 'High', secondaryColor: 'warning' },
      behavior: 'Distraction',
      severity: 'High',
      driverDetails: { primary: 'David Chen', secondary: 'DRV-0182' },
      driverName: 'David Chen',
      driverId: 'DRV-0182',
      vehicleDetails: { primary: 'VH-3377', secondary: 'Kenworth T680 · 2022' },
      vehicleId: 'VH-3377',
      vehicleMake: 'Kenworth',
      vehicleModel: 'T680',
      vehicleYear: 2022,
      dateLocation: { primary: 'Aug 6, 2026 · 4:48 PM', secondary: 'Reno, NV' },
      eventTime: '2026-08-06T16:48:00-07:00',
      location: 'Reno, NV',
      status: { kind: 'tag', label: 'Coached', intent: 'neutral' },
      notes: {
        kind: 'icon',
        icon: 'DocumentInverted',
        color: 'secondary',
        label: 'Has notes',
        sortValue: true,
      },
      actions: overflowAction('David Chen'),
    },
  },
  {
    id: 'safety-event-1045',
    selectionLabel: 'Stop sign violation event for Sarah Williams',
    interactive: true,
    cells: {
      preview: { kind: 'image', tracks: 2, alt: 'Road-facing video preview unavailable' },
      behaviorDetails: {
        primary: 'Stop sign violation',
        secondary: 'Critical',
        secondaryColor: 'negative',
      },
      behavior: 'Stop sign violation',
      severity: 'Critical',
      driverDetails: { primary: 'Sarah Williams', secondary: 'DRV-3109' },
      driverName: 'Sarah Williams',
      driverId: 'DRV-3109',
      vehicleDetails: { primary: 'VH-2216', secondary: 'Peterbilt 579 · 2024' },
      vehicleId: 'VH-2216',
      vehicleMake: 'Peterbilt',
      vehicleModel: '579',
      vehicleYear: 2024,
      dateLocation: { primary: 'Aug 6, 2026 · 1:06 PM', secondary: 'Sacramento, CA' },
      eventTime: '2026-08-06T13:06:00-07:00',
      location: 'Sacramento, CA',
      status: { kind: 'tag', label: 'Pending review', intent: 'caution' },
      notes: {
        kind: 'icon',
        icon: 'DocumentInverted',
        color: 'quaternary',
        label: 'No notes',
        sortValue: false,
      },
      actions: overflowAction('Sarah Williams'),
    },
  },
  {
    id: 'safety-event-1044',
    selectionLabel: 'Unsafe lane change event for Noah Wilson',
    interactive: true,
    cells: {
      preview: { kind: 'image', tracks: 2, alt: 'Dual-facing video preview unavailable' },
      behaviorDetails: {
        primary: 'Unsafe lane change',
        secondary: 'Low',
        secondaryColor: 'var(--color-foreground-bold-neutral)',
      },
      behavior: 'Unsafe lane change',
      severity: 'Low',
      driverDetails: { primary: 'Noah Wilson', secondary: 'DRV-4420' },
      driverName: 'Noah Wilson',
      driverId: 'DRV-4420',
      vehicleDetails: { primary: 'VH-1688', secondary: 'International LT · 2021' },
      vehicleId: 'VH-1688',
      vehicleMake: 'International',
      vehicleModel: 'LT',
      vehicleYear: 2021,
      dateLocation: { primary: 'Aug 5, 2026 · 11:27 AM', secondary: 'Stockton, CA' },
      eventTime: '2026-08-05T11:27:00-07:00',
      location: 'Stockton, CA',
      status: { kind: 'tag', label: 'Coachable', intent: 'negative' },
      notes: {
        kind: 'icon',
        icon: 'DocumentInverted',
        color: 'secondary',
        label: 'Has notes',
        sortValue: true,
      },
      actions: overflowAction('Noah Wilson'),
    },
  },
  {
    id: 'safety-event-1043',
    selectionLabel: 'Speeding event for Priya Nair',
    interactive: true,
    cells: {
      preview: { kind: 'image', tracks: 2, alt: 'Road-facing video preview unavailable' },
      behaviorDetails: { primary: 'Speeding', secondary: 'Medium' },
      behavior: 'Speeding',
      severity: 'Medium',
      driverDetails: { primary: 'Priya Nair', secondary: 'DRV-5512' },
      driverName: 'Priya Nair',
      driverId: 'DRV-5512',
      vehicleDetails: { primary: 'VH-4021', secondary: 'Freightliner Cascadia · 2023' },
      vehicleId: 'VH-4021',
      vehicleMake: 'Freightliner',
      vehicleModel: 'Cascadia',
      vehicleYear: 2023,
      dateLocation: { primary: 'Aug 5, 2026 · 3:12 PM', secondary: 'Modesto, CA' },
      eventTime: '2026-08-05T15:12:00-07:00',
      location: 'Modesto, CA',
      status: { kind: 'tag', label: 'Pending review', intent: 'caution' },
      notes: {
        kind: 'icon',
        icon: 'DocumentInverted',
        color: 'quaternary',
        label: 'No notes',
        sortValue: false,
      },
      actions: overflowAction('Priya Nair'),
    },
  },
];

const ADDED_ROWS: TableRow[] = [
  {
    id: 'driver-taylor',
    selectionLabel: 'Taylor Brooks',
    cells: { driver: 'Taylor Brooks', status: 'On duty', vehicle: 'V-2210' },
  },
  {
    id: 'driver-cameron',
    selectionLabel: 'Cameron Wilson',
    cells: { driver: 'Cameron Wilson', status: 'Driving', vehicle: 'V-2164' },
  },
];

const PAGINATED_ROWS: TableRow[] = Array.from({ length: 63 }, (_, index) => {
  const source = ROWS[index % ROWS.length]!;
  return {
    ...source,
    id: `${source.id}-page-${index + 1}`,
    selectionLabel: `${source.selectionLabel ?? source.id} ${index + 1}`,
  };
});

const VIRTUAL_ROWS: TableRow[] = Array.from({ length: 2000 }, (_, index) => {
  const source = ROWS[index % ROWS.length]!;
  return {
    ...source,
    id: `${source.id}-virtual-${index}`,
    selectionLabel: `${source.selectionLabel ?? source.id} ${index + 1}`,
  };
});

const PAGINATED_GROUP_SOURCE: TableGroup[] = Array.from({ length: 30 }, (_, groupIndex) => ({
  id: `fleet-${groupIndex + 1}`,
  label: `Fleet ${String(groupIndex + 1).padStart(2, '0')}`,
  totalCount: 6,
  rows: Array.from({ length: 6 }, (_, rowIndex) => {
    const source = ROWS[(groupIndex + rowIndex) % ROWS.length]!;
    return {
      ...source,
      id: `${source.id}-fleet-${groupIndex + 1}-${rowIndex + 1}`,
      selectionLabel: `${source.selectionLabel ?? source.id} in fleet ${groupIndex + 1}`,
    };
  }),
}));

function compareCell(a: TableRow, b: TableRow, columnId: string): number {
  const primitive = (row: TableRow) => {
    const value = row.cells[columnId];
    if (!value || typeof value !== 'object') return value;
    if ('primary' in value) return value.primary;
    if (value.kind === 'tag') return value.label;
    if (value.kind === 'icon') return value.sortValue ?? value.label ?? '';
    return '';
  };
  return String(primitive(a) ?? '').localeCompare(String(primitive(b) ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function orderedRows(rows: TableRow[], sort: TableSortState | null): TableRow[] {
  if (!sort) return rows;
  const direction = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => compareCell(a, b, sort.columnId) * direction);
}

function groupedRows(
  rows: TableRow[],
  grouping: TableGroupingState,
  sort: TableSortState | null
): TableGroup[] {
  const byStatus = new Map<string, TableRow[]>();
  for (const row of rows) {
    const status = String(row.cells[grouping.columnId] ?? 'Unassigned');
    byStatus.set(status, [...(byStatus.get(status) ?? []), row]);
  }

  return [...byStatus]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, members]) => ({
      id: label.toLowerCase().replaceAll(' ', '-'),
      label,
      rows: orderedRows(members, sort),
      totalCount: members.length,
    }));
}

const SEVERITY_GROUP_ORDER = ['Critical', 'High', 'Medium', 'Low'] as const;
const SEVERITY_GROUP_INTENT: Record<(typeof SEVERITY_GROUP_ORDER)[number], TableGroupIntent> = {
  Critical: 'negative',
  High: 'warning',
  Medium: 'caution',
  Low: 'neutral',
};

/** Collapsed empty groups so Storybook can review section-header surfaces alone. */
const GROUP_ROW_REVIEW: TableGroup[] = (
  [
    { label: 'Assigned', intent: 'brand', totalCount: 48, countLabel: '48 vehicles' },
    { label: 'Low', intent: 'neutral', totalCount: 12, countLabel: '12 events' },
    { label: 'Critical', intent: 'negative', totalCount: 166, countLabel: '166 events' },
    { label: 'High', intent: 'warning', totalCount: 84, countLabel: '84 events' },
    { label: 'Medium', intent: 'caution', totalCount: 32, countLabel: '32 events' },
    { label: 'Compliant', intent: 'positive', totalCount: 210, countLabel: '210 vehicles' },
    { label: 'Unassigned', totalCount: 7, countLabel: '7 vehicles' },
  ] satisfies Array<Pick<TableGroup, 'label' | 'intent' | 'totalCount' | 'countLabel'>>
).map(group => ({
  ...group,
  id: group.label.toLowerCase(),
  rows: [],
}));

function severityGroupedRows(rows: TableRow[], sort: TableSortState | null): TableGroup[] {
  const bySeverity = new Map<string, TableRow[]>();
  for (const row of rows) {
    const severity = String(row.cells.severity ?? 'Unassigned');
    bySeverity.set(severity, [...(bySeverity.get(severity) ?? []), row]);
  }

  return SEVERITY_GROUP_ORDER.filter(label => bySeverity.has(label)).map(label => {
    const members = bySeverity.get(label) ?? [];
    return {
      id: label.toLowerCase(),
      label,
      intent: SEVERITY_GROUP_INTENT[label],
      rows: orderedRows(members, sort),
      totalCount: members.length,
    };
  });
}

function lazySeverityGroups(
  loadedByGroup: Record<string, number>,
  loadingGroupId: string | null,
  sort: TableSortState | null
): TableGroup[] {
  return severityGroupedRows(SAFETY_EVENT_ROWS, sort).map(group => {
    const totalCount = group.rows.length;
    const loadedCount = Math.min(loadedByGroup[group.id] ?? 1, totalCount);
    return {
      ...group,
      rows: group.rows.slice(0, loadedCount),
      totalCount,
      countLabel: `${totalCount} ${totalCount === 1 ? 'event' : 'events'}`,
      hasMore: loadedCount < totalCount,
      loadingMore: loadingGroupId === group.id,
      loadIdentity: `severity:${group.id}`,
    };
  });
}

const meta: Meta = {
  title: 'Data display/Table',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A semantic, controlled data table. Applications own data transformation and loading; the component owns native table structure, interaction intent, status presentation, and a token-backed visual recipe.',
      },
    },
  },
  argTypes: {
    captionVisibility: { control: 'select', options: ['visible', 'hidden'] },
    stickyHeader: { control: 'boolean' },
    selectionMode: { control: 'select', options: ['none', 'multiple'] },
    loading: { control: 'boolean' },
    chromeLoading: { control: 'boolean' },
    dataMode: { control: 'select', options: ['infinite', 'pagination'] },
    loadMoreMode: { control: 'select', options: ['auto', 'manual'] },
    displayedCount: { control: 'number' },
    totalCount: { control: 'number' },
  },
  args: {
    captionVisibility: 'visible',
    stickyHeader: false,
    selectionMode: 'multiple',
    loading: false,
    chromeLoading: false,
    dataMode: 'infinite',
    loadMoreMode: 'manual',
    selectedRowIds: [],
    sort: null,
    displayedCount: 50,
    totalCount: 1500,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const [, updateArgs] = useArgs();
    const sort = (args['sort'] as TableSortState | null) ?? null;
    const selectedRowIds = (args['selectedRowIds'] as string[]) ?? [];
    return html`
      <ds-table
        .columns=${COLUMNS}
        .rows=${orderedRows(ROWS, sort)}
        .sort=${sort}
        .selectedRowIds=${selectedRowIds}
        caption="Workforce overview"
        caption-visibility=${args['captionVisibility']}
        selection-mode=${args['selectionMode']}
        .displayedCount=${args['displayedCount']}
        .totalCount=${args['totalCount']}
        .stickyHeader=${args['stickyHeader']}
        .loading=${args['loading']}
        .chromeLoading=${args['chromeLoading']}
        data-mode=${args['dataMode']}
        load-more-mode=${args['loadMoreMode']}
        .hasMore=${args['dataMode'] === 'infinite'}
        @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
          updateArgs({ sort: event.detail.sort })}
        @dsSelectionChange=${(event: CustomEvent<{ selectedRowIds: string[] }>) =>
          updateArgs({ selectedRowIds: event.detail.selectedRowIds })}
      ></ds-table>
    `;
  },
};

export const ColumnHeaderAlignment: Story = {
  name: 'Column header alignment',
  args: {
    grouping: { columnId: 'status', direction: 'asc' },
    sort: { columnId: 'score', direction: 'desc' },
    collapsedGroupIds: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Start-aligned headers reserve the far-right sort lane. End-aligned headers place it at the far left. Center-aligned headers keep it inline immediately after the label.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const grouping = args['grouping'] as TableGroupingState;
    const sort = (args['sort'] as TableSortState | null) ?? null;
    const collapsedGroupIds = (args['collapsedGroupIds'] as string[]) ?? [];
    return html`
      <ds-table
        .columns=${ALIGNMENT_COLUMNS}
        .groups=${groupedRows(ALIGNMENT_ROWS, grouping, sort)}
        .grouping=${grouping}
        .sort=${sort}
        .collapsedGroupIds=${collapsedGroupIds}
        caption="Column header alignment"
        caption-visibility="visible"
        @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
          updateArgs({ sort: event.detail.sort })}
        @dsGroupCollapseChange=${(event: CustomEvent<{ collapsedGroupIds: string[] }>) =>
          updateArgs({ collapsedGroupIds: event.detail.collapsedGroupIds })}
      ></ds-table>
    `;
  },
};

export const ElasticSpacer: Story = {
  name: 'Elastic trailing spacer',
  parameters: {
    docs: {
      description: {
        story:
          'When every visible data column has an explicit size, an internal presentational spacer absorbs unused inline space without stretching the final data column. The same spacer collapses to zero when the explicit columns overflow, preserving horizontal scrolling. Trailing action and sticky-end lanes remain after the spacer at the visible edge.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;gap:var(--dimension-space-300);">
      <section style="display:grid;gap:var(--dimension-space-100);">
        <ds-text as="h3" variant="text-title-small" emphasis>Available inline space</ds-text>
        <ds-table
          .columns=${ELASTIC_SPACER_COLUMNS}
          .rows=${ELASTIC_SPACER_ROWS}
          caption="Elastic spacer with available inline space"
        ></ds-table>
      </section>
      <section
        style="display:grid;gap:var(--dimension-space-100);max-inline-size:var(--dimension-panel-width-sm);"
      >
        <ds-text as="h3" variant="text-title-small" emphasis>Horizontal overflow</ds-text>
        <ds-table
          .columns=${ELASTIC_SPACER_COLUMNS}
          .rows=${ELASTIC_SPACER_ROWS}
          caption="Elastic spacer with horizontal overflow"
          scroll-label="Scrollable elastic spacer example"
        ></ds-table>
      </section>
    </div>
  `,
};

export const SearchMatchHighlighting: Story = {
  name: 'Search match highlighting',
  args: {
    searchValue: 'avery',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The application owns the search query and row filtering, then supplies the same literal query through highlightTerms. When TableSearch has selected fields, pass those IDs through highlightFieldIds so only the matching data-point tracks are marked. With no field IDs, all table-owned text tracks remain eligible. Highlighting does not change the cell’s accessible name or guess how the application tokenizes search.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const searchValue = String(args['searchValue'] ?? '');
    const query = searchValue.trim().toLocaleLowerCase();
    const rows = query
      ? ROWS.filter(row => tableRowSearchText(row).toLocaleLowerCase().includes(query))
      : ROWS;

    return html`
      <ds-table
        .columns=${COLUMNS}
        .rows=${rows}
        .highlightTerms=${query ? [searchValue.trim()] : []}
        caption="Searchable workforce overview"
        caption-visibility="visible"
        .displayedCount=${rows.length}
        .totalCount=${ROWS.length}
      >
        <ds-input
          slot="header"
          type="search"
          size="md"
          width="fill"
          icon="MagnifyingGlass"
          placeholder="Search drivers"
          aria-label="Search drivers"
          .value=${searchValue}
          @dsChange=${(event: CustomEvent<string>) => updateArgs({ searchValue: event.detail })}
          @dsClear=${() => updateArgs({ searchValue: '' })}
        ></ds-input>
      </ds-table>
    `;
  },
};

export const SafetyEvents: Story = {
  name: 'Safety events',
  args: {
    sort: { columnId: 'eventTime', direction: 'desc' },
    selectedRowIds: [],
    grouping: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A Motive Dashboard-inspired safety-events table. Its table-owned 48px header gives one full-width, 8px-inset surface to the application through the header slot. Selecting rows overlays ds-bar-action above the footer; that overlay inset is application layout, not table chrome. The footer pairs an application-owned last-updated label on the left with the controlled result summary on the right. The checkbox and blank action lanes stay pinned; each owns a fixed divider and a row-clipped shadow directed into the scrolling columns while more content remains.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const sort = (args['sort'] as TableSortState | null) ?? null;
    const selectedRowIds = (args['selectedRowIds'] as string[]) ?? [];
    const grouping = (args['grouping'] as TableGroupingState | null) ?? null;
    const ordered = orderedRows(SAFETY_EVENT_ROWS, sort);
    return html`
      <div style="position:relative;min-width:0;">
        <ds-table
          fit-viewport
          viewport-inset-block-start="var(--dimension-space-200)"
          viewport-inset-block-end="var(--dimension-space-200)"
          .columns=${SAFETY_EVENT_COLUMNS}
          .rows=${grouping ? [] : ordered}
          .groups=${grouping ? severityGroupedRows(ordered, sort) : []}
          .grouping=${grouping}
          .sort=${sort}
          .selectedRowIds=${selectedRowIds}
          .displayedCount=${SAFETY_EVENT_ROWS.length}
          .totalCount=${500}
          selection-mode="multiple"
          sticky-header
          caption="Safety events"
          caption-visibility="visible"
          @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
            updateArgs({ sort: event.detail.sort })}
          @dsSelectionChange=${(event: CustomEvent<{ selectedRowIds: string[] }>) =>
            updateArgs({ selectedRowIds: event.detail.selectedRowIds })}
        >
          <div
            slot="header"
            style="display:flex;align-items:center;min-width:0;gap:var(--dimension-space-100);"
          >
            <div style="display:flex;align-items:center;gap:var(--dimension-space-100);">
              <ds-text as="span" variant="text-body-small" color="secondary">Group rows</ds-text>
              <ds-select
                size="md"
                aria-label="Group safety events"
                placeholder="No grouping"
                .options=${[{ label: 'Severity', value: 'severity' }]}
                .value=${grouping?.columnId ?? ''}
                .allowClear=${grouping !== null}
                @dsChange=${(event: CustomEvent<string | string[]>) => {
                  if (event.detail !== 'severity') return;
                  updateArgs({ grouping: { columnId: 'severity', direction: 'asc' } });
                }}
                @dsClear=${() => updateArgs({ grouping: null })}
              ></ds-select>
            </div>
          </div>
          <ds-text
            slot="footer-leading"
            as="span"
            variant="text-body-medium"
            color="secondary"
            line-truncation="1"
          >
            Last updated: Aug 13, 2026 7:00 PM PT
          </ds-text>
        </ds-table>
        <ds-bar-action
          style="position:absolute;inset-inline:var(--dimension-space-100);inset-block-end:calc(var(--dimension-size-600) + var(--dimension-space-100));z-index:var(--dimension-z-index-floating);"
          .count=${selectedRowIds.length}
          label="Selected safety event actions"
          @dsClear=${(event: CustomEvent<MouseEvent>) => {
            const owner = (event.currentTarget as HTMLElement).parentElement;
            updateArgs({ selectedRowIds: [] });
            requestAnimationFrame(() => {
              owner
                ?.querySelector<HTMLButtonElement>('ds-table .ds-table__selection-control')
                ?.focus();
            });
          }}
        >
          <ds-button-unfilled
            slot="actions"
            label="Coaching status"
            size="md"
            background="bold"
          ></ds-button-unfilled>
        </ds-bar-action>
      </div>
    `;
  },
};

export const DocumentFlowStickyLanes: Story = {
  name: 'Document flow with sticky lanes',
  args: {
    sort: { columnId: 'eventTime', direction: 'desc' },
    selectedRowIds: [],
    lastActivated: 'None',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The table grows the Storybook document instead of creating a vertical scrollport. Its synchronized header sticks below the simulated compact page bar, while vertical wheel and trackpad input continues scrolling the page.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const sort = (args['sort'] as TableSortState | null) ?? null;
    const selectedRowIds = (args['selectedRowIds'] as string[]) ?? [];
    const repeatedRows = Array.from({ length: 3 }, (_, copy) =>
      SAFETY_EVENT_ROWS.map(row => ({ ...row, id: `${row.id}-${copy}` }))
    ).flat();
    return html`
      <div style="max-inline-size:var(--dimension-panel-width-lg);">
        <div
          style="position:sticky;inset-block-start:0;z-index:var(--dimension-z-index-raised);display:flex;align-items:center;block-size:var(--dimension-size-600);background:var(--color-background-secondary);"
        >
          <ds-text as="span" variant="text-body-medium" emphasis color="primary">
            Compact page bar · Last row: ${args['lastActivated']}
          </ds-text>
        </div>
        <ds-table
          style="--ds-table-sticky-header-offset:var(--dimension-size-600);"
          .columns=${SAFETY_EVENT_COLUMNS}
          .rows=${orderedRows(repeatedRows, sort)}
          .sort=${sort}
          .selectedRowIds=${selectedRowIds}
          selection-mode="multiple"
          sticky-header
          caption="Document-flow safety events"
          caption-visibility="hidden"
          scroll-label="Scrollable safety event columns"
          @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
            updateArgs({ sort: event.detail.sort })}
          @dsSelectionChange=${(event: CustomEvent<{ selectedRowIds: string[] }>) =>
            updateArgs({ selectedRowIds: event.detail.selectedRowIds })}
          @dsRowActivate=${(event: CustomEvent<{ rowId: string }>) =>
            updateArgs({ lastActivated: event.detail.rowId })}
        ></ds-table>
      </div>
    `;
  },
};

export const GroupingAndMemberSorting: Story = {
  name: 'Grouping and member sorting',
  args: {
    grouping: { columnId: 'status', direction: 'asc' },
    sort: { columnId: 'safetyScore', direction: 'desc' },
    collapsedGroupIds: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          "The application supplies Status groups in its fixed order while Safety score remains the table's one interactive member-row sort. The complete group section header expands and collapses the section; the trailing ButtonUnfilled remains the accessible disclosure control and does not paint its own hover or press wash. While any group is expanded and no action column exists, collapse-all floats at the visible header edge on a medium-elevation surface so horizontal scrolling never hides it.",
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const grouping = (args['grouping'] as TableGroupingState | null) ?? null;
    const sort = (args['sort'] as TableSortState | null) ?? null;
    const collapsedGroupIds = (args['collapsedGroupIds'] as string[]) ?? [];
    return html`
      <ds-table
        .columns=${COLUMNS}
        .rows=${grouping ? [] : ROWS}
        .groups=${grouping ? groupedRows(ROWS, grouping, sort) : []}
        .grouping=${grouping}
        .sort=${sort}
        .collapsedGroupIds=${collapsedGroupIds}
        .displayedCount=${ROWS.length}
        .totalCount=${1500}
        caption="Drivers grouped by status"
        caption-visibility="visible"
        @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
          updateArgs({ sort: event.detail.sort })}
        @dsGroupCollapseChange=${(event: CustomEvent<{ collapsedGroupIds: string[] }>) =>
          updateArgs({ collapsedGroupIds: event.detail.collapsedGroupIds })}
      ></ds-table>
    `;
  },
};

export const GroupingBySeverity: Story = {
  name: 'Grouping by severity',
  args: {
    grouping: { columnId: 'severity', direction: 'asc' },
    sort: { columnId: 'eventTime', direction: 'desc' },
    collapsedGroupIds: [],
    selectedRowIds: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Safety events grouped by severity with intentful section headers: Critical → negative, High → warning, Medium → caution, Low → neutral. Each colored group transitions from its faint intent surface at the label edge into faint neutral at the trailing edge, with a bold intent title followed by plain loaded progress such as “Critical · 2 of 2”. With multi-selection enabled, each section also exposes a checkbox that selects or clears that group.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const sort = (args['sort'] as TableSortState | null) ?? null;
    const collapsedGroupIds = (args['collapsedGroupIds'] as string[]) ?? [];
    const selectedRowIds = (args['selectedRowIds'] as string[]) ?? [];
    const groups = severityGroupedRows(SAFETY_EVENT_ROWS, sort);
    return html`
      <ds-table
        .columns=${SAFETY_EVENT_COLUMNS}
        .groups=${groups}
        .grouping=${args['grouping']}
        .sort=${sort}
        .collapsedGroupIds=${collapsedGroupIds}
        .selectedRowIds=${selectedRowIds}
        .displayedCount=${SAFETY_EVENT_ROWS.length}
        .totalCount=${1500}
        selection-mode="multiple"
        sticky-header
        caption="Safety events by severity"
        caption-visibility="hidden"
        @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
          updateArgs({ sort: event.detail.sort })}
        @dsGroupCollapseChange=${(event: CustomEvent<{ collapsedGroupIds: string[] }>) =>
          updateArgs({ collapsedGroupIds: event.detail.collapsedGroupIds })}
        @dsSelectionChange=${(event: CustomEvent<{ selectedRowIds: string[] }>) =>
          updateArgs({ selectedRowIds: event.detail.selectedRowIds })}
      ></ds-table>
    `;
  },
};

export const GroupRows: Story = {
  name: 'Group rows',
  args: {
    grouping: { columnId: 'status', direction: 'asc' },
    collapsedGroupIds: GROUP_ROW_REVIEW.map(group => group.id),
    selectedRowIds: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Group section headers only. Every intent and the default surface are collapsed with no member rows, so additional group-row data points can be designed against the current label, count, selection, and collapse chrome. Click anywhere on a header to expand or collapse it. Expand a section to review empty expanded count copy.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const collapsedGroupIds = (args['collapsedGroupIds'] as string[]) ?? [];
    const selectedRowIds = (args['selectedRowIds'] as string[]) ?? [];
    return html`
      <ds-table
        data-a11y-fixture
        .columns=${COLUMNS}
        .groups=${GROUP_ROW_REVIEW}
        .grouping=${args['grouping']}
        .collapsedGroupIds=${collapsedGroupIds}
        .selectedRowIds=${selectedRowIds}
        selection-mode="multiple"
        caption="Group section headers"
        caption-visibility="hidden"
        @dsGroupCollapseChange=${(event: CustomEvent<{ collapsedGroupIds: string[] }>) =>
          updateArgs({ collapsedGroupIds: event.detail.collapsedGroupIds })}
        @dsSelectionChange=${(event: CustomEvent<{ selectedRowIds: string[] }>) =>
          updateArgs({ selectedRowIds: event.detail.selectedRowIds })}
      ></ds-table>
    `;
  },
};

export const ControlledSelection: Story = {
  args: { selectedRowIds: ['driver-jordan', 'driver-not-loaded'] },
  parameters: {
    docs: {
      description: {
        story:
          'Selection is row-ID controlled. Select all targets selectable loaded rows and preserves driver-not-loaded, demonstrating that lazy datasets do not lose off-window selection.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const rows = ROWS.slice(0, 5).map(row =>
      row.id === 'driver-sam' ? { ...row, selectable: false } : row
    );
    return html`
      <ds-table
        .columns=${COLUMNS.slice(0, 4)}
        .rows=${rows}
        .selectedRowIds=${args['selectedRowIds'] as string[]}
        selection-mode="multiple"
        caption="Selectable drivers"
        caption-visibility="visible"
        @dsSelectionChange=${(event: CustomEvent<{ selectedRowIds: string[] }>) =>
          updateArgs({ selectedRowIds: event.detail.selectedRowIds })}
      ></ds-table>
      <ds-text
        as="p"
        variant="text-body-small"
        color="secondary"
        style="display:block;margin-top:var(--dimension-space-100);"
      >
        Selected IDs: ${(args['selectedRowIds'] as string[]).join(', ')}
      </ds-text>
    `;
  },
};

export const AllCellTypes: Story = {
  name: 'All cell types',
  parameters: {
    docs: {
      description: {
        story:
          'Three review tables, one height each. Image cells declare tracks 1, 2, or 3 so the 16:9 preview fills the matching content box (cell height minus 8px padding). Icon-and-text cells (`kind: icon-text`) place one md prefix icon beside the copy stack: 2px padding on every side of the icon, a 2px flex gap before the copy, and text-track padding staying on the copy. Single-track cells, including the 1-track image and icon-and-text, stay on a 40px row. Two-track text, 2-track image, 2-track icon-and-text, and wrapping multiple-Tag cells share a 64px row. Event in that table shows a two-line cell with middle-dot runs. Three-track text, 3-track image, and 3-track icon-and-text stay on a 88px row. Body cells share 8px outer padding; every track is 24px with no stack gap. Linked primary text uses a native anchor and the shared brand text-action treatment; secondary copy stays unlinked. Secondary tracks may split into middle-dot-separated runs. The third line uses the same subdued track recipe as the second. Unbordered action cells open the shared overflow ds-menu from the Ellipses trigger; the bordered column stays a single-shot control. Empty means the data applies but has no value and renders an em dash; Blank means the data is not applicable and intentionally renders nothing.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;gap:var(--dimension-space-400);">
      <ds-table
        data-a11y-fixture
        .columns=${SINGLE_TRACK_COLUMNS}
        .rows=${SINGLE_TRACK_ROWS}
        selection-mode="multiple"
        caption="Single-track cells"
        caption-visibility="visible"
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ALL_CELL_TYPE_COLUMNS}
        .rows=${ALL_CELL_TYPE_ROWS}
        selection-mode="multiple"
        caption="All table cell types"
        caption-visibility="visible"
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${THREE_TRACK_COLUMNS}
        .rows=${THREE_TRACK_ROWS}
        selection-mode="multiple"
        caption="Three-track cells"
        caption-visibility="visible"
      ></ds-table>
    </div>
  `,
};

export const MultipleTags: Story = {
  name: 'Multiple tags',
  parameters: {
    docs: {
      description: {
        story:
          'Multiple-Tag cells use `kind: tags` and declare their expected wrapped line count with `tracks`. Tags wrap naturally at the column edge. Each uses the 20px small single-inset recipe inside a 24px wrap line with no stack gap, so two tracks resolve a 64px row and three tracks resolve a 88px row. Track counts may continue beyond three; the tallest cell establishes the native row height and every sibling cell stretches to match.',
      },
    },
  },
  render: () => html`
    <ds-table
      data-a11y-fixture
      .columns=${MULTIPLE_TAG_COLUMNS}
      .rows=${MULTIPLE_TAG_ROWS}
      caption="Wrapping multiple-tag cells"
      caption-visibility="visible"
    ></ds-table>
  `,
};

export const OverflowActionMenu: Story = {
  name: 'Overflow action menu',
  args: {
    lastAction: 'None yet',
  },
  argTypes: {
    lastAction: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        story:
          "A trailing unbordered Ellipses column opens one shared ds-menu for the table. Opening or closing the menu does not emit; choosing a command emits dsCellAction with that item's actionId, rowId, and columnId. Inactive commands stay in the list, destructive commands keep the Menu treatment, and the popup is not clipped by the sticky-end viewport.",
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const rows = ROWS.slice(0, 4).map(row => ({
      ...row,
      interactive: true,
      cells: {
        ...row.cells,
        action: overflowAction(row.selectionLabel ?? row.id),
      },
    }));
    return html`
      <ds-table
        data-a11y-fixture
        .columns=${[
          { id: 'driver', header: 'Driver', sortable: true, size: 'sm' },
          { id: 'status', header: 'Status', size: 'xs' },
          { id: 'vehicle', header: 'Vehicle', size: 'xs' },
          { id: 'location', header: 'Last known location', size: 'sm' },
          {
            id: 'action',
            kind: 'action',
            header: '',
            headerLabel: 'Action',
            align: 'center',
            size: 40,
            sticky: 'end',
          },
        ] satisfies TableColumn[]}
        .rows=${rows}
        selection-mode="multiple"
        caption="Driver overflow actions"
        caption-visibility="visible"
        @dsCellAction=${(
          event: CustomEvent<{ actionId: string; rowId: string; columnId: string }>
        ) =>
          updateArgs({
            lastAction: `${event.detail.actionId} · ${event.detail.rowId} · ${event.detail.columnId}`,
          })}
      ></ds-table>
      <ds-text
        as="p"
        variant="text-body-small"
        color="secondary"
        style="display:block;margin-top:var(--dimension-space-100);"
      >
        Last dsCellAction: ${String(args['lastAction'])}
      </ds-text>
    `;
  },
};

export const ColumnCustomizer: Story = {
  name: 'Column customizer',
  parameters: {
    docs: {
      description: {
        story:
          'Opt-in columnCustomizer keeps columns as the catalog. hiddenColumnIds and columnOrder are controlled; dsColumnsConfigChange reports live show/hide and data-column reorder. The trailing neutral Customize control opens the shared Menu of reorderable switch rows and stays open while toggling or dragging. Its label and resting foreground do not change when the controlled column configuration differs from the catalog default. Below 900px it becomes the icon-only Table menu button with the same neutral resting foreground. Selection and action columns are omitted from the menu, action columns stay fixed last, and the last remaining visible data column cannot be hidden. Persistence stays in the application.',
      },
      ...isolatedOverlayDocs('480px'),
    },
  },
  render: () => {
    const rows = ROWS.slice(0, 4).map(row => ({
      ...row,
      cells: {
        ...row.cells,
        action: overflowAction(row.selectionLabel ?? row.id),
      },
    }));
    return html`
      <ds-table
        data-a11y-fixture
        .columns=${[
          { id: 'driver', header: 'Driver', sortable: true, size: 'sm' },
          { id: 'status', header: 'Status', size: 'xs' },
          { id: 'vehicle', header: 'Vehicle', size: 'xs' },
          { id: 'location', header: 'Last known location', size: 'sm' },
          {
            id: 'action',
            kind: 'action',
            header: '',
            headerLabel: 'Action',
            align: 'center',
            size: 40,
            sticky: 'end',
          },
        ] satisfies TableColumn[]}
        .rows=${rows}
        column-customizer
        selection-mode="multiple"
        caption="Customizable drivers"
        caption-visibility="visible"
        @dsColumnsConfigChange=${applyColumnsConfig}
      ></ds-table>
    `;
  },
};

export const DataModeSwitcher: Story = {
  name: 'Data mode switcher',
  args: {
    dataMode: 'infinite',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Opt-in dataModeSwitcher renders the table-owned mode trigger and Menu for infinite, pagination, and virtual modes. dataMode remains controlled; dsDataModeChange reports intent while the application supplies the matching row window, pagination state, loading consequences, and a bounded height for virtual.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const dataMode: TableDataMode =
      args['dataMode'] === 'pagination' || args['dataMode'] === 'virtual'
        ? args['dataMode']
        : 'infinite';
    return html`
      <ds-table
        data-a11y-fixture
        .columns=${COLUMNS}
        .rows=${dataMode === 'virtual' ? VIRTUAL_ROWS : ROWS.slice(0, 4)}
        .dataMode=${dataMode}
        .pagination=${dataMode === 'pagination'
          ? {
              pageIndex: 0,
              pageSize: 25,
              totalItems: 100,
              pageSizeOptions: [25, 50, 100],
              itemLabel: 'rows',
              pageSizeLabel: 'Rows',
            }
          : null}
        height="var(--dimension-card-height-lg)"
        .displayedCount=${dataMode === 'virtual' ? VIRTUAL_ROWS.length : 4}
        .totalCount=${dataMode === 'virtual' ? VIRTUAL_ROWS.length : 100}
        data-mode-switcher
        caption="Driver mode example"
        caption-visibility="visible"
        @dsDataModeChange=${(event: CustomEvent<TableDataModeChangeDetail>) =>
          updateArgs({ dataMode: event.detail.dataMode })}
      ></ds-table>
    `;
  },
};

export const ContentPrimitives: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Scalar values, primary/secondary copy, null values, numeric alignment, truncation, and explicit wrapping share stable cell-layer classes. Wrapping 1-track primary occupies the same 64px and 88px rows as 2-track and 3-track cells. Wrapping secondary stays on track 1 for primary and consumes later tracks, including 112px when secondary wraps to three lines. Review secondary wrap on the last two rows of Wrapping content.',
      },
    },
  },
  render: () => html`
    <div style="max-inline-size:var(--dimension-panel-width-sm);">
      <ds-table
        .columns=${[
          { id: 'name', header: 'Primary and secondary', size: 'sm' },
          { id: 'notes', header: 'Wrapping content', wrap: true, size: 'sm' },
          { id: 'quantity', header: 'Quantity', align: 'end', size: 'xs' },
        ] satisfies TableColumn[]}
        .rows=${[
          {
            id: 'primitive-one',
            cells: {
              name: {
                primary: 'Reefer trailer',
                secondary: 'TR-1048',
                tertiary: 'Active reefer',
              },
              notes: 'Temperature check is due after the next delivery window.',
              quantity: { primary: 12840, fontFeature: 'tabular-nums' },
            },
          },
          {
            id: 'primitive-two',
            cells: {
              name: { primary: 'Dry van', secondary: 'TR-2201' },
              notes: { primary: 'This individual cell wraps onto the second track.', wrap: true },
              quantity: null,
            },
          },
          {
            id: 'primitive-secondary-two',
            cells: {
              name: {
                primary: 'Reefer trailer',
                secondary: 'TR-1048',
                tertiary: 'Active reefer',
              },
              notes: {
                primary: 'Reefer trailer',
                secondary: 'Due after the next delivery window.',
              },
              quantity: { primary: 4, fontFeature: 'tabular-nums' },
            },
          },
          {
            id: 'primitive-secondary-three',
            cells: {
              name: { primary: 'Dry van', secondary: 'TR-2201' },
              notes: {
                primary: 'Dry van',
                secondary: 'Temperature check is due after the next delivery window.',
              },
              quantity: null,
            },
          },
        ] satisfies TableRow[]}
        caption="Cell content primitives"
        caption-visibility="visible"
      ></ds-table>
    </div>
  `,
};

export const InitialAndOutcomeStates: Story = {
  name: 'Initial and outcome states',
  parameters: {
    docs: {
      description: {
        story:
          'Initial loading preserves the real table grid and uses each column’s representative image, multiline text, Tag, icon, or action geometry. chromeLoading can replace opted-in table-owned caption controls without changing their footprint. Ten rows fill a useful default viewport. Empty and initial error keep the table caption and columns present while replacing only the body with ds-empty-state. Height-bounded empty and error tables fill the remaining body below the column header.',
      },
    },
  },
  render: () => html`
    <div
      style="display:grid;grid-template-columns:repeat(auto-fit,minmax(var(--dimension-panel-width-xs),1fr));gap:var(--dimension-space-200);"
    >
      <ds-table
        data-a11y-fixture
        .columns=${COMPOSED_SKELETON_COLUMNS}
        .loading=${true}
        .chromeLoading=${true}
        selection-mode="multiple"
        caption="Loading drivers"
        caption-visibility="visible"
        column-customizer
        data-mode-switcher
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        caption="Empty driver result"
        caption-visibility="visible"
        height="var(--dimension-card-height-sm)"
        empty-heading="No matching drivers"
        empty-body="Try changing the active filters."
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        error
        caption="Unavailable drivers"
        caption-visibility="visible"
        height="var(--dimension-card-height-sm)"
        error-heading="Drivers unavailable"
        error-body="Check the connection and try again."
      ></ds-table>
    </div>
  `,
};

export const HeaderHelp: Story = {
  name: 'Header help',
  parameters: {
    docs: {
      description: {
        story:
          'Optional column.help underlines the header label with the shared dotted decoration and opens ds-tooltip from that label. Sort stays on the existing sort button. A non-sortable label with help is keyboard-focusable so the tip can open without a second control. Touch follows the shared Tooltip contract and does not open the tip.',
      },
    },
  },
  render: () => html`
    <ds-table
      data-a11y-fixture
      .columns=${[
        {
          id: 'driver',
          header: 'Driver',
          sortable: true,
          size: 'sm',
          help: 'Legal name used on the driver profile.',
        },
        { id: 'status', header: 'Status', sortable: true, align: 'center', size: 'xs' },
        {
          id: 'vehicle',
          header: 'Vehicle',
          size: 'xs',
          help: 'Assigned vehicle identifier.',
        },
        {
          id: 'behaviorDetails',
          header: 'Behavior / Severity',
          headerSegments: [
            { label: 'Behavior', sortKey: 'behavior', separator: '/' },
            { label: 'Severity', sortKey: 'severity' },
          ],
          sortable: true,
          size: 'sm',
          help: 'Primary behavior and its severity from the latest scored event.',
        },
        {
          id: 'safetyScore',
          header: 'Safety score',
          sortable: true,
          align: 'end',
          size: 'xs',
          help: 'Rolling 7-day safety score from 0 to 100.',
        },
      ] satisfies TableColumn[]}
      .rows=${ROWS.slice(0, 4).map(row => ({
        ...row,
        cells: {
          driver: row.cells.driver,
          status: row.cells.status,
          vehicle: row.cells.vehicle,
          behaviorDetails: { primary: 'Speeding', secondary: 'High', secondaryColor: 'negative' },
          safetyScore: row.cells.safetyScore,
        },
      }))}
      caption="Driver columns with header help"
      caption-visibility="visible"
    ></ds-table>
  `,
};

export const IncrementalLoadingStates: Story = {
  name: 'Incremental loading states',
  parameters: {
    docs: {
      description: {
        story:
          'Existing rows remain visible through manual ready, loading, retry, and terminal lazy-loading states. The footer reports the loaded window as Displaying {displayed} of {total}. There is no pagination UI.',
      },
    },
  },
  render: () => html`
    <div
      style="display:grid;grid-template-columns:repeat(auto-fit,minmax(var(--dimension-panel-width-xs),1fr));gap:var(--dimension-space-200);"
    >
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        .rows=${ROWS.slice(0, 2)}
        data-mode="infinite"
        load-more-mode="manual"
        has-more
        .displayedCount=${2}
        .totalCount=${ROWS.length}
        caption="Ready to load more drivers"
        caption-visibility="visible"
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        .rows=${ROWS.slice(0, 2)}
        data-mode="infinite"
        load-more-mode="manual"
        has-more
        loading-more
        .displayedCount=${2}
        .totalCount=${ROWS.length}
        caption="Loading more drivers"
        caption-visibility="visible"
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        .rows=${ROWS.slice(0, 2)}
        data-mode="infinite"
        load-more-mode="manual"
        has-more
        load-more-error="More drivers could not be loaded."
        .displayedCount=${2}
        .totalCount=${ROWS.length}
        caption="Driver load-more error"
        caption-visibility="visible"
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        .rows=${ROWS.slice(0, 2)}
        data-mode="infinite"
        load-more-mode="manual"
        .displayedCount=${2}
        .totalCount=${2}
        caption="All drivers loaded"
        caption-visibility="visible"
      ></ds-table>
    </div>
  `,
};

export const WorkingLazyLoading: Story = {
  name: 'Working lazy loading',
  args: {
    lazyRows: ROWS.slice(0, 3),
    loadingMore: false,
    hasMore: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Activate Load more to see the application acknowledge the request, append stable rows, and finish the dataset. displayedCount tracks the loaded window in the footer. The component never owns a cursor or fetch.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const lazyRows = args['lazyRows'] as TableRow[];
    const lazyTotal = ROWS.slice(0, 3).length + ADDED_ROWS.length;
    return html`
      <ds-table
        .columns=${ASYNC_COLUMNS}
        .rows=${lazyRows}
        data-mode="infinite"
        load-more-mode="manual"
        .hasMore=${args['hasMore']}
        .loadingMore=${args['loadingMore']}
        .displayedCount=${lazyRows.length}
        .totalCount=${lazyTotal}
        load-identity="workforce-demo"
        caption="Lazy-loaded drivers"
        caption-visibility="visible"
        @dsLoadMore=${() => {
          if (args['loadingMore'] || !args['hasMore']) return;
          updateArgs({ loadingMore: true });
          window.setTimeout(() => {
            updateArgs({
              lazyRows: [...(args['lazyRows'] as TableRow[]), ...ADDED_ROWS],
              loadingMore: false,
              hasMore: false,
            });
          }, 650);
        }}
      ></ds-table>
    `;
  },
};

export const WorkingPagination: Story = {
  name: 'Working pagination',
  args: {
    pageIndex: 0,
    pageSize: 25,
    pageSizeMode: 'fixed',
    selectedRowIds: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'The application supplies only the active page. The table keeps off-page selection IDs controlled, replaces the result summary with Pagination, and forwards page intent without slicing records itself.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const pageIndex = Number(args['pageIndex']);
    const pageSize = Number(args['pageSize']);
    const selectedRowIds = (args['selectedRowIds'] as string[]) ?? [];
    const rows = PAGINATED_ROWS.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
    return html`
      <ds-table
        .columns=${COLUMNS}
        .rows=${rows}
        .selectedRowIds=${selectedRowIds}
        .pagination=${{
          pageIndex,
          pageSize,
          pageSizeMode: args['pageSizeMode'] ?? 'fixed',
          totalItems: PAGINATED_ROWS.length,
          pageSizeOptions: [25, 50, 100, 200],
          fitToPage: true,
          itemLabel: 'rows',
          pageSizeLabel: 'Rows',
        }}
        data-mode="pagination"
        selection-mode="multiple"
        caption="Paginated workforce overview"
        caption-visibility="visible"
        @dsPaginationChange=${(event: CustomEvent<PaginationChangeDetail>) =>
          updateArgs({
            pageIndex: event.detail.pageIndex,
            pageSize: event.detail.pageSize,
            pageSizeMode: event.detail.pageSizeMode,
          })}
        @dsSelectionChange=${(event: CustomEvent<{ selectedRowIds: string[] }>) =>
          updateArgs({ selectedRowIds: event.detail.selectedRowIds })}
      >
        <ds-text
          slot="footer-leading"
          as="span"
          variant="text-body-medium"
          color="secondary"
          line-truncation="1"
        >
          Last updated: just now
        </ds-text>
      </ds-table>
    `;
  },
};

export const GroupParentPagination: Story = {
  name: 'Group-parent pagination',
  args: {
    pageIndex: 0,
    pageSize: 25,
    pageSizeMode: 'fixed',
    loadedByGroup: {},
    grouping: { columnId: 'status', direction: 'asc' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pagination counts only parent groups. Every visible group retains its own member total and incremental load control; appending children never moves the parent to another page.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const pageIndex = Number(args['pageIndex']);
    const pageSize = Number(args['pageSize']);
    const loadedByGroup = args['loadedByGroup'] as Record<string, number>;
    const pageGroups = PAGINATED_GROUP_SOURCE.slice(
      pageIndex * pageSize,
      (pageIndex + 1) * pageSize
    ).map(group => {
      const loadedCount = Math.min(loadedByGroup[group.id] ?? 1, group.rows.length);
      return {
        ...group,
        rows: group.rows.slice(0, loadedCount),
        hasMore: loadedCount < group.rows.length,
        loadIdentity: `group-page:${pageIndex}:${group.id}`,
      };
    });
    return html`
      <ds-table
        .columns=${COLUMNS}
        .groups=${pageGroups}
        .grouping=${args['grouping']}
        .pagination=${{
          pageIndex,
          pageSize,
          pageSizeMode: args['pageSizeMode'] ?? 'fixed',
          totalItems: PAGINATED_GROUP_SOURCE.length,
          pageSizeOptions: [25, 50, 100, 200],
          fitToPage: true,
          itemLabel: 'groups',
          pageSizeLabel: 'Groups',
        }}
        data-mode="pagination"
        load-more-mode="manual"
        sticky-header
        max-height="520px"
        caption="Paginated fleet groups"
        caption-visibility="visible"
        @dsPaginationChange=${(event: CustomEvent<PaginationChangeDetail>) =>
          updateArgs({
            pageIndex: event.detail.pageIndex,
            pageSize: event.detail.pageSize,
            pageSizeMode: event.detail.pageSizeMode,
            loadedByGroup: {},
          })}
        @dsGroupLoadMore=${(event: CustomEvent<{ groupId: string }>) => {
          const groupId = event.detail.groupId;
          updateArgs({
            loadedByGroup: {
              ...loadedByGroup,
              [groupId]: (loadedByGroup[groupId] ?? 1) + 2,
            },
          });
        }}
      ></ds-table>
    `;
  },
};

export const WorkingGroupedLazyLoading: Story = {
  name: 'Working grouped lazy loading',
  args: {
    loadedByGroup: {},
    loadingGroupId: null,
    grouping: { columnId: 'severity', direction: 'asc' },
    sort: { columnId: 'eventTime', direction: 'desc' },
    collapsedGroupIds: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Every severity keeps its authoritative total and independently loaded member window. Section headers show that progress directly as “loaded of total” and update when rows append. Grouped tables never emit the global bottom-of-table request. Internal section rows keep their dividers, while only the final rendered item yields its divider to the table edge or footer.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const loadedByGroup = args['loadedByGroup'] as Record<string, number>;
    const loadingGroupId = (args['loadingGroupId'] as string | null) ?? null;
    const sort = (args['sort'] as TableSortState | null) ?? null;
    const collapsedGroupIds = (args['collapsedGroupIds'] as string[]) ?? [];
    const groups = lazySeverityGroups(loadedByGroup, loadingGroupId, sort);
    return html`
      <ds-table
        .columns=${SAFETY_EVENT_COLUMNS}
        .groups=${groups}
        .grouping=${args['grouping']}
        .sort=${sort}
        .collapsedGroupIds=${collapsedGroupIds}
        .displayedCount=${groups.reduce((count, group) => count + group.rows.length, 0)}
        .totalCount=${SAFETY_EVENT_ROWS.length}
        data-mode="infinite"
        load-more-mode="manual"
        sticky-header
        max-height="520px"
        caption="Lazy-loaded safety events by severity"
        caption-visibility="visible"
        @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
          updateArgs({ sort: event.detail.sort, loadedByGroup: {} })}
        @dsGroupCollapseChange=${(event: CustomEvent<{ collapsedGroupIds: string[] }>) =>
          updateArgs({ collapsedGroupIds: event.detail.collapsedGroupIds })}
        @dsGroupLoadMore=${(event: CustomEvent<{ groupId: string }>) => {
          const groupId = event.detail.groupId;
          if (loadingGroupId) return;
          updateArgs({ loadingGroupId: groupId });
          window.setTimeout(() => {
            updateArgs({
              loadingGroupId: null,
              loadedByGroup: {
                ...loadedByGroup,
                [groupId]: (loadedByGroup[groupId] ?? 1) + 1,
              },
            });
          }, 650);
        }}
      ></ds-table>
    `;
  },
};

export const StickyHeaderAndOverflow: Story = {
  name: 'Sticky header and overflow',
  parameters: {
    docs: {
      description: {
        story:
          'A constrained scroll region keeps the header visible, preserves native table semantics, and provides horizontal overflow cues and keyboard focus.',
      },
    },
  },
  render: () => html`
    <div style="max-inline-size:var(--dimension-panel-width-sm);">
      <ds-table
        .columns=${COLUMNS}
        .rows=${[...ROWS, ...ROWS.map(row => ({ ...row, id: `${row.id}-copy` }))]}
        caption="Scrollable workforce overview"
        caption-visibility="hidden"
        scroll-label="Scrollable workforce data"
        sticky-header
        max-height="var(--dimension-card-height-xs)"
      ></ds-table>
    </div>
  `,
};

export const NativeGroupedStickyPerformance: Story = {
  name: 'Native grouped sticky performance',
  // This 1,000-row manual stress fixture repeats the grouped-table semantics
  // covered by the smaller stories and is intentionally outside the test matrix.
  tags: ['!test'],
  parameters: {
    docs: {
      description: {
        story:
          'A 1,000-row contained table for reviewing section push-off and surrounding panel-resize animation. Every section uses its real row-group header as the native sticky element; scrolling and resizing do not select, duplicate, measure, or transform an active section in JavaScript.',
      },
    },
  },
  render: () => {
    const groupLabels = ['Driving', 'On duty', 'Off duty', 'Unavailable'];
    const groups = groupLabels.map(
      (label, groupIndex) =>
        ({
          id: `performance-${groupIndex}`,
          label,
          rows: Array.from({ length: 250 }, (_, rowIndex) => {
            const source = ROWS[(groupIndex * 250 + rowIndex) % ROWS.length]!;
            return {
              ...source,
              id: `${source.id}-performance-${groupIndex}-${rowIndex}`,
              selectionLabel: `${source.selectionLabel ?? source.id} ${rowIndex + 1}`,
            };
          }),
          totalCount: 250,
        }) satisfies TableGroup
    );

    return html`
      <div style="max-inline-size:var(--dimension-panel-width-lg);">
        <ds-table
          .columns=${COLUMNS}
          .groups=${groups}
          .grouping=${{ columnId: 'status', direction: 'asc' }}
          selection-mode="multiple"
          sticky-header
          height="var(--dimension-card-height-lg)"
          caption="Large grouped workforce overview"
          caption-visibility="visible"
        ></ds-table>
      </div>
    `;
  },
};

export const VirtualRows: Story = {
  name: 'Virtual rows',
  parameters: {
    docs: {
      description: {
        story:
          'dataMode=virtual recycles row DOM over the full in-memory list. The application still supplies every row; the table does not fetch as you scroll. A bounded height, maxHeight, or fitViewport is required.',
      },
    },
  },
  render: () => html`
    <ds-table
      .columns=${COLUMNS}
      .rows=${VIRTUAL_ROWS}
      data-mode="virtual"
      selection-mode="multiple"
      sticky-header
      height="var(--dimension-card-height-lg)"
      caption="Virtual workforce overview"
      caption-visibility="visible"
      .totalCount=${VIRTUAL_ROWS.length}
    ></ds-table>
  `,
};

export const VirtualGroupedRows: Story = {
  name: 'Virtual grouped rows',
  parameters: {
    docs: {
      description: {
        story:
          'Grouping stays orthogonal. Expanded sections insert members into the same virtual list so the table viewport remains the only vertical scroller. Sticky section headers still push off natively.',
      },
    },
  },
  render: () => {
    const groupLabels = ['Driving', 'On duty', 'Off duty', 'Unavailable'];
    const groups = groupLabels.map(
      (label, groupIndex) =>
        ({
          id: `virtual-${groupIndex}`,
          label,
          rows: VIRTUAL_ROWS.slice(groupIndex * 500, groupIndex * 500 + 500),
          totalCount: 500,
        }) satisfies TableGroup
    );

    return html`
      <ds-table
        .columns=${COLUMNS}
        .groups=${groups}
        .grouping=${{ columnId: 'status', direction: 'asc' }}
        data-mode="virtual"
        selection-mode="multiple"
        sticky-header
        height="var(--dimension-card-height-lg)"
        caption="Virtual grouped workforce overview"
        caption-visibility="visible"
        .totalCount=${VIRTUAL_ROWS.length}
      ></ds-table>
    `;
  },
};

export const VirtualFitViewport: Story = {
  name: 'Virtual fitViewport',
  parameters: {
    docs: {
      description: {
        story:
          'Scroll the expanded page header until the table reaches its compact insets and owns vertical scrolling. The recycled row window tracks that fitted block size.',
      },
    },
  },
  render: () => html`
    <div
      style="
        --story-table-fit-start: 80px;
        height: 480px;
        overflow: auto;
        overscroll-behavior: none;
      "
    >
      <div style="height: 120px; background: var(--color-background-secondary);"></div>
      <div style="padding: 32px;">
        <ds-table
          .columns=${COLUMNS}
          .rows=${VIRTUAL_ROWS}
          data-mode="virtual"
          sticky-header
          fit-viewport
          viewport-inset-block-start="var(--story-table-fit-start)"
          viewport-inset-block-end="32px"
          caption="Virtual viewport-fitted workforce"
          caption-visibility="visible"
          .totalCount=${VIRTUAL_ROWS.length}
        ></ds-table>
      </div>
    </div>
  `,
};

export const VirtualRequiresHeight: Story = {
  name: 'Virtual requires height',
  parameters: {
    docs: {
      description: {
        story:
          'Without height, maxHeight, or fitViewport, virtual mode fails visibly instead of mounting every row.',
      },
    },
  },
  render: () => html`
    <ds-table
      .columns=${COLUMNS}
      .rows=${VIRTUAL_ROWS.slice(0, 40)}
      data-mode="virtual"
      caption="Virtual table without a bounded viewport"
      caption-visibility="visible"
    ></ds-table>
  `,
};

export const NarrowAndLongContent: Story = {
  name: 'Narrow viewport and long content',
  parameters: {
    docs: {
      description: {
        story:
          'Default cells truncate to one line. Hover an overflowing track to see the omitted value in one table-owned tooltip. maxLines 2 and 3 wrap onto the named 2-track and 3-track row heights, then ellipsize with the same tooltip. wrap: true remains unlimited and does not show a truncation tooltip. Disabled rows never show it.',
      },
    },
  },
  render: () => html`
    <div style="max-inline-size:var(--dimension-panel-width-xs);">
      <ds-table
        .columns=${[
          { id: 'case', header: 'Case', size: 'xs' },
          { id: 'notes', header: 'Notes', size: 'sm' },
        ] satisfies TableColumn[]}
        .rows=${[
          {
            id: 'truncate-one',
            cells: {
              case: '1 line',
              notes:
                'Northbound Highway 99 near the George Massey Tunnel, Richmond, British Columbia',
            },
          },
          {
            id: 'truncate-two',
            cells: {
              case: '2 lines',
              notes: {
                primary:
                  'Northbound Highway 99 near the George Massey Tunnel, Richmond, British Columbia',
                maxLines: 2,
              },
            },
          },
          {
            id: 'truncate-three',
            cells: {
              case: '3 lines',
              notes: {
                primary:
                  'Northbound Highway 99 near the George Massey Tunnel, Richmond, British Columbia',
                maxLines: 3,
              },
            },
          },
          {
            id: 'truncate-wrap',
            cells: {
              case: 'Wrap',
              notes: {
                primary:
                  'Northbound Highway 99 near the George Massey Tunnel, Richmond, British Columbia',
                wrap: true,
              },
            },
          },
          {
            id: 'truncate-short',
            cells: {
              case: 'Fits',
              notes: 'Fleet',
            },
          },
          {
            id: 'truncate-disabled',
            disabled: true,
            cells: {
              case: 'Disabled',
              notes:
                'Northbound Highway 99 near the George Massey Tunnel, Richmond, British Columbia',
            },
          },
          {
            id: 'truncate-link',
            cells: {
              case: 'Link',
              notes: {
                primary:
                  'Northbound Highway 99 near the George Massey Tunnel, Richmond, British Columbia',
                href: '/routes/highway-99',
              },
            },
          },
        ] satisfies TableRow[]}
        caption="Truncation tooltip"
        caption-visibility="visible"
      ></ds-table>
    </div>
  `,
};

export const RestyledVisualPrimitives: Story = {
  name: 'Restyled visual primitives',
  parameters: {
    docs: {
      description: {
        story:
          'A product can reshape the visual recipe through public --ds-table-* properties without changing table behavior or semantic markup.',
      },
    },
  },
  render: () => html`
    <ds-table
      style="
        --ds-table-header-surface:var(--color-background-faint-brand);
        --ds-table-group-surface:var(--color-background-faint-positive);
        --ds-table-row-selected:var(--color-background-faint-positive);
        --ds-table-radius:var(--dimension-radius-150);
        --ds-table-cell-padding-inline:var(--dimension-space-200);
      "
      .columns=${COLUMNS.slice(0, 4)}
      .groups=${groupedRows(ROWS.slice(0, 5), { columnId: 'status', direction: 'asc' }, null)}
      .grouping=${{ columnId: 'status', direction: 'asc' }}
      .selectedRowIds=${['driver-jordan']}
      selection-mode="multiple"
      caption="Restyled grouped drivers"
      caption-visibility="visible"
    ></ds-table>
  `,
};

export const NativeCssRecipe: Story = {
  name: 'Native CSS recipe',
  parameters: {
    docs: {
      description: {
        story:
          'The exported @ds-mo/ui/table.css recipe can style application-owned native markup with the same stable primitives when the component data model is not appropriate.',
      },
    },
  },
  render: () => html`
    <div class="ds-table ds-table--md">
      <div class="ds-table__frame">
        <div class="ds-table__viewport">
          <table class="ds-table__table">
            <caption class="ds-table__caption">
              <ds-text as="span" variant="text-title-small" emphasis
                >Application-owned audit log</ds-text
              >
            </caption>
            <thead class="ds-table__head">
              <tr class="ds-table__header-row">
                <th class="ds-table__header-cell" scope="col">
                  <span class="ds-table__header-static">
                    <ds-text as="span" variant="text-body-small" emphasis color="secondary"
                      >Event</ds-text
                    >
                  </span>
                </th>
                <th class="ds-table__header-cell" scope="col">
                  <span class="ds-table__header-static">
                    <ds-text as="span" variant="text-body-small" emphasis color="secondary"
                      >Time</ds-text
                    >
                  </span>
                </th>
              </tr>
            </thead>
            <tbody class="ds-table__body">
              <tr class="ds-table__row">
                <td class="ds-table__cell">
                  <span class="ds-table__cell-content">Vehicle assigned</span>
                </td>
                <td class="ds-table__cell"><span class="ds-table__cell-content">09:42</span></td>
              </tr>
              <tr class="ds-table__row">
                <td class="ds-table__cell">
                  <span class="ds-table__cell-content">Driver acknowledged</span>
                </td>
                <td class="ds-table__cell"><span class="ds-table__cell-content">09:45</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
};

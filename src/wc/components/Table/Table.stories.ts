import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-table.js';
import '../../../../dist/components/ds-text.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-bar-action.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../styles/table.css';
import type {
  TableColumn,
  TableGroup,
  TableGroupIntent,
  TableGroupingState,
  TableRow,
  TableSortState,
} from './table-types';

const COLUMNS: TableColumn[] = [
  { id: 'driver', header: 'Driver', sortable: true, size: 'sm' },
  { id: 'status', header: 'Status', sortable: true, size: 'xs' },
  { id: 'vehicle', header: 'Vehicle', sortable: true, size: 'xs' },
  { id: 'location', header: 'Last known location', size: 'sm' },
  { id: 'safetyScore', header: 'Safety score', sortable: true, align: 'end', size: 'xs' },
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

const ALL_CELL_TYPE_COLUMNS: TableColumn[] = [
  { id: 'scalar', header: 'Scalar text', size: 'sm' },
  { id: 'primarySecondary', header: 'Primary + secondary', size: 'sm' },
  { id: 'primaryPair', header: 'Primary + primary', size: 'sm' },
  { id: 'image', header: 'Image', size: 102 },
  { id: 'icon', header: 'Icon only', align: 'center', size: 'xs' },
  { id: 'tagOnly', header: 'Tag only', size: 'sm' },
  { id: 'tagWithText', header: 'Tag + text', size: 'sm' },
  { id: 'textWithTag', header: 'Text + tag', size: 'sm' },
  { id: 'action', kind: 'action', header: '', headerLabel: 'Action', align: 'center', size: 40 },
  { id: 'borderedAction', kind: 'action', header: '', headerLabel: 'Bordered action', align: 'center', size: 40 },
  { id: 'empty', header: 'Empty', size: 'xs' },
  { id: 'blank', header: 'Blank', size: 'xs' },
];

const ALL_CELL_TYPE_ROWS: TableRow[] = [
  {
    id: 'all-cell-types-one',
    selectionLabel: 'First all-cell-types example',
    cells: {
      scalar: 'Vehicle 2841',
      primarySecondary: { primary: 'John Smith', secondary: 'DRV-1048' },
      primaryPair: { kind: 'primary-text', primary: 'Vehicle', secondary: 'VH-2841' },
      image: { kind: 'image', alt: 'Safety event preview unavailable' },
      icon: { kind: 'icon', icon: 'DocumentInverted', color: 'secondary', label: 'Has notes' },
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
      action: {
        kind: 'action',
        actionId: 'more',
        variant: 'icon',
        icon: 'Ellipses',
        ariaLabel: 'More actions',
      },
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

const SAFETY_EVENT_COLUMNS: TableColumn[] = [
  { id: 'preview', header: 'Preview', size: 102 },
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
      preview: { kind: 'image', alt: 'Road-facing video preview unavailable' },
      behaviorDetails: { primary: 'Close following', secondary: 'Critical', secondaryColor: 'negative' },
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
      actions: { kind: 'action', actionId: 'more', variant: 'icon', icon: 'Ellipses', ariaLabel: 'More actions for John Smith' },
    },
  },
  {
    id: 'safety-event-1047',
    selectionLabel: 'Lane cutoff event for Maria Garcia',
    interactive: true,
    cells: {
      preview: { kind: 'image', alt: 'Dual-facing video preview unavailable' },
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
      actions: { kind: 'action', actionId: 'more', variant: 'icon', icon: 'Ellipses', ariaLabel: 'More actions for Maria Garcia' },
    },
  },
  {
    id: 'safety-event-1046',
    selectionLabel: 'Distraction event for David Chen',
    interactive: true,
    cells: {
      preview: { kind: 'image', alt: 'Driver-facing video preview unavailable' },
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
      actions: { kind: 'action', actionId: 'more', variant: 'icon', icon: 'Ellipses', ariaLabel: 'More actions for David Chen' },
    },
  },
  {
    id: 'safety-event-1045',
    selectionLabel: 'Stop sign violation event for Sarah Williams',
    interactive: true,
    cells: {
      preview: { kind: 'image', alt: 'Road-facing video preview unavailable' },
      behaviorDetails: { primary: 'Stop sign violation', secondary: 'Critical', secondaryColor: 'negative' },
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
      actions: { kind: 'action', actionId: 'more', variant: 'icon', icon: 'Ellipses', ariaLabel: 'More actions for Sarah Williams' },
    },
  },
  {
    id: 'safety-event-1044',
    selectionLabel: 'Unsafe lane change event for Noah Wilson',
    interactive: true,
    cells: {
      preview: { kind: 'image', alt: 'Dual-facing video preview unavailable' },
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
      actions: { kind: 'action', actionId: 'more', variant: 'icon', icon: 'Ellipses', ariaLabel: 'More actions for Noah Wilson' },
    },
  },
  {
    id: 'safety-event-1043',
    selectionLabel: 'Speeding event for Priya Nair',
    interactive: true,
    cells: {
      preview: { kind: 'image', alt: 'Road-facing video preview unavailable' },
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
      actions: { kind: 'action', actionId: 'more', variant: 'icon', icon: 'Ellipses', ariaLabel: 'More actions for Priya Nair' },
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
  sort: TableSortState | null,
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
  sort: TableSortState | null,
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
    lazyLoading: { control: 'boolean' },
    loadMoreMode: { control: 'select', options: ['auto', 'manual'] },
    displayedCount: { control: 'number' },
    totalCount: { control: 'number' },
  },
  args: {
    captionVisibility: 'visible',
    stickyHeader: false,
    selectionMode: 'multiple',
    loading: false,
    lazyLoading: false,
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
        .lazyLoading=${args['lazyLoading']}
        load-more-mode=${args['loadMoreMode']}
        .hasMore=${args['lazyLoading']}
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
        story: 'Start-aligned headers reserve the far-right sort lane. End-aligned headers place it at the far left. Center-aligned headers keep it inline immediately after the label.',
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
        @dsGroupCollapseChange=${(
          event: CustomEvent<{ collapsedGroupIds: string[] }>,
        ) => updateArgs({ collapsedGroupIds: event.detail.collapsedGroupIds })}
      ></ds-table>
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
        story: 'A Motive Dashboard-inspired safety-events table. Its table-owned 48px header gives one full-width, 8px-inset surface to the application through the header slot. Selecting rows overlays ds-bar-action above the footer; that overlay inset is application layout, not table chrome. The footer pairs an application-owned last-updated label on the left with the controlled result summary on the right. The checkbox and blank action lanes stay pinned; each owns a fixed divider and a row-clipped shadow directed into the scrolling columns while more content remains.',
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
          <ds-text slot="footer-leading" as="span" variant="text-body-medium" color="secondary">
            Last updated: Aug 13, 2026  7:00 PM PT
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
        story: 'The table grows the Storybook document instead of creating a vertical scrollport. Its synchronized header sticks below the simulated compact page bar, while vertical wheel and trackpad input continues scrolling the page.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const sort = (args['sort'] as TableSortState | null) ?? null;
    const selectedRowIds = (args['selectedRowIds'] as string[]) ?? [];
    const repeatedRows = Array.from({ length: 3 }, (_, copy) =>
      SAFETY_EVENT_ROWS.map(row => ({ ...row, id: `${row.id}-${copy}` })),
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
        story: 'The application supplies Status groups in its fixed order while Safety score remains the table\'s one interactive member-row sort. Group section headers expose a controlled collapse control matching the action-column ButtonUnfilled recipe. While any group is expanded and no action column exists, collapse-all floats at the visible header edge on a medium-elevation surface so horizontal scrolling never hides it.',
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
        .columns=${COLUMNS}
        .groups=${groupedRows(ROWS, grouping, sort)}
        .grouping=${grouping}
        .sort=${sort}
        .collapsedGroupIds=${collapsedGroupIds}
        .displayedCount=${ROWS.length}
        .totalCount=${1500}
        caption="Drivers grouped by status"
        caption-visibility="visible"
        @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
          updateArgs({ sort: event.detail.sort })}
        @dsGroupCollapseChange=${(
          event: CustomEvent<{ collapsedGroupIds: string[] }>,
        ) => updateArgs({ collapsedGroupIds: event.detail.collapsedGroupIds })}
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
          'Safety events grouped by severity with intentful section headers: Critical → negative, High → warning, Medium → caution, Low → neutral. Each colored group transitions from its faint intent surface at the label edge into faint neutral at the trailing edge, with a bold intent title and a rounded, elevated sm Tag showing the numeric count in the same intent. With multi-selection enabled, each section also exposes a checkbox that selects or clears that group.',
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
        @dsGroupCollapseChange=${(
          event: CustomEvent<{ collapsedGroupIds: string[] }>,
        ) => updateArgs({ collapsedGroupIds: event.detail.collapsedGroupIds })}
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
        story: 'Selection is row-ID controlled. Select all targets selectable loaded rows and preserves driver-not-loaded, demonstrating that lazy datasets do not lose off-window selection.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const rows = ROWS.slice(0, 5).map(row =>
      row.id === 'driver-sam' ? { ...row, selectable: false } : row,
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
        story: 'One review table for every standard cell primitive. Single-track text, selection, Tag, Action, Empty, and Blank cells share a 40px contract; two-track text and the 16:9 Image cell establish a 64px row. Action cells primarily use an icon-only Ellipses ButtonUnfilled; the examples show its default unbordered and optional bordered treatments. Empty means the data applies but has no value and renders an em dash; Blank means the data is not applicable and intentionally renders nothing.',
      },
    },
  },
  render: () => html`
    <ds-table
      data-a11y-fixture
      .columns=${ALL_CELL_TYPE_COLUMNS}
      .rows=${ALL_CELL_TYPE_ROWS}
      selection-mode="multiple"
      caption="All table cell types"
      caption-visibility="visible"
    ></ds-table>
  `,
};

export const ContentPrimitives: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Scalar values, primary/secondary copy, null values, numeric alignment, truncation, and explicit wrapping share stable cell-layer classes for future styling.',
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
              name: { primary: 'Reefer trailer', secondary: 'TR-1048' },
              notes: 'Temperature check is due after the next delivery window.',
              quantity: { primary: 12840, fontFeature: 'tabular-nums' },
            },
          },
          {
            id: 'primitive-two',
            cells: {
              name: 'Dry van',
              notes: { primary: 'This individual cell wraps.', wrap: true },
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
        story: 'Initial loading preserves the real table grid, single-line cell geometry, and column relationships with row-shaped skeletons. Empty and initial error keep the table caption and columns present while replacing only the body state.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(var(--dimension-panel-width-xs),1fr));gap:var(--dimension-space-200);">
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        .loading=${true}
        .skeletonRows=${3}
        caption="Loading drivers"
        caption-visibility="visible"
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        caption="Empty driver result"
        caption-visibility="visible"
        empty-heading="No matching drivers"
        empty-body="Try changing the active filters."
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        error
        caption="Unavailable drivers"
        caption-visibility="visible"
        error-heading="Drivers unavailable"
        error-body="Check the connection and try again."
      ></ds-table>
    </div>
  `,
};

export const IncrementalLoadingStates: Story = {
  name: 'Incremental loading states',
  parameters: {
    docs: {
      description: {
        story: 'Existing rows remain visible through manual ready, loading, retry, and terminal lazy-loading states. There is no pagination UI.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(var(--dimension-panel-width-xs),1fr));gap:var(--dimension-space-200);">
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        .rows=${ROWS.slice(0, 2)}
        lazy-loading
        load-more-mode="manual"
        has-more
        caption="Ready to load more drivers"
        caption-visibility="visible"
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        .rows=${ROWS.slice(0, 2)}
        lazy-loading
        load-more-mode="manual"
        has-more
        loading-more
        caption="Loading more drivers"
        caption-visibility="visible"
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        .rows=${ROWS.slice(0, 2)}
        lazy-loading
        load-more-mode="manual"
        has-more
        load-more-error="More drivers could not be loaded."
        caption="Driver load-more error"
        caption-visibility="visible"
      ></ds-table>
      <ds-table
        data-a11y-fixture
        .columns=${ASYNC_COLUMNS}
        .rows=${ROWS.slice(0, 2)}
        lazy-loading
        load-more-mode="manual"
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
        story: 'Activate Load more to see the application acknowledge the request, append stable rows, and finish the dataset. The component never owns a cursor or fetch.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <ds-table
        .columns=${ASYNC_COLUMNS}
        .rows=${args['lazyRows'] as TableRow[]}
        lazy-loading
        load-more-mode="manual"
        .hasMore=${args['hasMore']}
        .loadingMore=${args['loadingMore']}
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
        story: 'Every severity keeps its authoritative total and independently loaded member window. Loading one section appends rows only within that section; grouped tables never emit the global bottom-of-table request.',
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
        lazy-loading
        load-more-mode="manual"
        sticky-header
        max-height="520px"
        caption="Lazy-loaded safety events by severity"
        caption-visibility="visible"
        @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
          updateArgs({ sort: event.detail.sort, loadedByGroup: {} })}
        @dsGroupCollapseChange=${(
          event: CustomEvent<{ collapsedGroupIds: string[] }>,
        ) => updateArgs({ collapsedGroupIds: event.detail.collapsedGroupIds })}
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
        story: 'A constrained scroll region keeps the header visible, preserves native table semantics, and provides horizontal overflow cues and keyboard focus.',
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
  parameters: {
    docs: {
      description: {
        story: 'A 1,000-row contained table for reviewing section push-off and surrounding panel-resize animation. Every section uses its real row-group header as the native sticky element; scrolling and resizing do not select, duplicate, measure, or transform an active section in JavaScript.',
      },
    },
  },
  render: () => {
    const groupLabels = ['Driving', 'On duty', 'Off duty', 'Unavailable'];
    const groups = groupLabels.map((label, groupIndex) => ({
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
    } satisfies TableGroup));

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

export const NarrowAndLongContent: Story = {
  name: 'Narrow viewport and long content',
  render: () => html`
    <div style="max-inline-size:var(--dimension-panel-width-xs);">
      <ds-table
        .columns=${[
          { id: 'driver', header: 'Driver', size: 'sm' },
          { id: 'location', header: 'Last known location', size: 'md', wrap: true },
          { id: 'event', header: 'Latest event', size: 'sm' },
        ] satisfies TableColumn[]}
        .rows=${[
          {
            id: 'long-content',
            cells: {
              driver: {
                primary: 'Alexandria Montgomery-Wilson',
                secondary: 'alexandria.montgomery-wilson@example.com',
              },
              location: 'Northbound Highway 99 near the George Massey Tunnel, Richmond, British Columbia',
              event: 'Vehicle inspection completed successfully',
            },
          },
        ] satisfies TableRow[]}
        caption="Long-content behavior"
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
        story: 'A product can reshape the visual recipe through public --ds-table-* properties without changing table behavior or semantic markup.',
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
        story: 'The exported @ds-mo/ui/table.css recipe can style application-owned native markup with the same stable primitives when the component data model is not appropriate.',
      },
    },
  },
  render: () => html`
    <div class="ds-table ds-table--md">
      <div class="ds-table__frame">
        <div class="ds-table__viewport">
          <table class="ds-table__table">
            <caption class="ds-table__caption">
              <ds-text as="span" variant="text-title-small" emphasis>Application-owned audit log</ds-text>
            </caption>
            <thead class="ds-table__head">
              <tr class="ds-table__header-row">
                <th class="ds-table__header-cell" scope="col">
                  <span class="ds-table__header-static">
                    <ds-text as="span" variant="text-body-small" emphasis color="secondary">Event</ds-text>
                  </span>
                </th>
                <th class="ds-table__header-cell" scope="col">
                  <span class="ds-table__header-static">
                    <ds-text as="span" variant="text-body-small" emphasis color="secondary">Time</ds-text>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody class="ds-table__body">
              <tr class="ds-table__row">
                <td class="ds-table__cell"><span class="ds-table__cell-content">Vehicle assigned</span></td>
                <td class="ds-table__cell"><span class="ds-table__cell-content">09:42</span></td>
              </tr>
              <tr class="ds-table__row">
                <td class="ds-table__cell"><span class="ds-table__cell-content">Driver acknowledged</span></td>
                <td class="ds-table__cell"><span class="ds-table__cell-content">09:45</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
};

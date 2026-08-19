import '/dist/components/ds-table.js';

await customElements.whenDefined('ds-table');

const columns = [
  { id: 'name', header: 'Driver', sortable: true, size: 'sm' },
  { id: 'status', header: 'Status', sortable: true, align: 'center', size: 'sm' },
  { id: 'vehicle', header: 'Vehicle', size: 'xs' },
  { id: 'score', header: 'Safety score', sortable: true, align: 'end', size: 'xs' },
];
const rows = [
  { id: 'avery', selectionLabel: 'Avery Chen', cells: { name: { primary: 'Avery Chen', secondary: 'avery@example.com' }, status: 'Driving', vehicle: 'V-2048', score: 98 } },
  { id: 'jordan', selectionLabel: 'Jordan Patel', cells: { name: 'Jordan Patel', status: 'On duty', vehicle: 'V-1822', score: 94 } },
  { id: 'sam', selectionLabel: 'Sam Rivera', selectable: false, cells: { name: 'Sam Rivera', status: 'Off duty', vehicle: null, score: 89 } },
  { id: 'morgan', selectionLabel: 'Morgan Lee', disabled: true, cells: { name: 'Morgan Lee', status: 'Driving', vehicle: 'V-2105', score: 91 } },
];

const setBase = id => {
  const table = document.getElementById(id);
  table.columns = columns;
  table.rows = rows;
  return table;
};

const basic = setBase('basic');
basic.addEventListener('dsSortChange', event => {
  basic.sort = event.detail.sort;
  if (!event.detail.sort) {
    basic.rows = rows;
    return;
  }
  const { columnId, direction } = event.detail.sort;
  basic.rows = [...rows].sort((a, b) => {
    const aValue = a.cells[columnId]?.primary ?? a.cells[columnId] ?? '';
    const bValue = b.cells[columnId]?.primary ?? b.cells[columnId] ?? '';
    return String(aValue).localeCompare(String(bValue), undefined, { numeric: true }) * (direction === 'asc' ? 1 : -1);
  });
});

const composable = setBase('composable');
composable.displayedCount = rows.length;
composable.totalCount = 12;

const footer = setBase('footer');
footer.displayedCount = 50;
footer.totalCount = 1500;

const grouped = document.getElementById('grouped');
grouped.columns = columns;
grouped.grouping = { columnId: 'status', direction: 'asc' };
grouped.sort = { columnId: 'score', direction: 'desc' };
const ascendingGroups = [
  { id: 'driving', label: 'Driving', totalCount: 3, rows: [rows[0], rows[3]] },
  { id: 'off-duty', label: 'Off duty', rows: [rows[2]] },
  { id: 'on-duty', label: 'On duty', rows: [rows[1]] },
];
const orderMembers = groups => groups.map(group => ({
  ...group,
  rows: [...group.rows].sort((a, b) => (b.cells.score - a.cells.score) * (grouped.sort?.direction === 'asc' ? -1 : 1)),
}));
grouped.groups = orderMembers(ascendingGroups);
grouped.collapsedGroupIds = [];
grouped.addEventListener('dsGroupCollapseChange', event => {
  grouped.collapsedGroupIds = event.detail.collapsedGroupIds;
});
grouped.addEventListener('dsSortChange', event => {
  grouped.sort = event.detail.sort;
  grouped.groups = event.detail.sort ? orderMembers(ascendingGroups) : ascendingGroups;
});

const severityGrouped = document.getElementById('severity-grouped');
severityGrouped.columns = [
  { id: 'behavior', header: 'Behavior', size: 'sm' },
  { id: 'severity', header: 'Severity', sortable: true, size: 'xs' },
  { id: 'driver', header: 'Driver', size: 'sm' },
];
const severityRows = [
  { id: 'crit-1', selectionLabel: 'Close following Critical', cells: { behavior: 'Close following', severity: 'Critical', driver: 'John Smith' } },
  { id: 'crit-2', selectionLabel: 'Stop sign Critical', cells: { behavior: 'Stop sign violation', severity: 'Critical', driver: 'Sarah Williams' } },
  { id: 'high-1', selectionLabel: 'Lane cutoff High', cells: { behavior: 'Lane cutoff', severity: 'High', driver: 'Maria Garcia' } },
  { id: 'high-2', selectionLabel: 'Distraction High', cells: { behavior: 'Distraction', severity: 'High', driver: 'David Chen' } },
  { id: 'med-1', selectionLabel: 'Speeding Medium', cells: { behavior: 'Speeding', severity: 'Medium', driver: 'Priya Nair' } },
  { id: 'low-1', selectionLabel: 'Unsafe lane Low', cells: { behavior: 'Unsafe lane change', severity: 'Low', driver: 'Noah Wilson' } },
];
const severityIntent = {
  Critical: 'negative',
  High: 'warning',
  Medium: 'caution',
  Low: 'neutral',
};
severityGrouped.selectionMode = 'multiple';
severityGrouped.selectedRowIds = [];
severityGrouped.grouping = { columnId: 'severity', direction: 'asc' };
severityGrouped.groups = ['Critical', 'High', 'Medium', 'Low'].map(label => ({
  id: label.toLowerCase(),
  label,
  intent: severityIntent[label],
  rows: severityRows.filter(row => row.cells.severity === label),
  totalCount: severityRows.filter(row => row.cells.severity === label).length,
}));
severityGrouped.collapsedGroupIds = [];
severityGrouped.addEventListener('dsGroupCollapseChange', event => {
  severityGrouped.collapsedGroupIds = event.detail.collapsedGroupIds;
});
severityGrouped.addEventListener('dsSelectionChange', event => {
  severityGrouped.selectedRowIds = event.detail.selectedRowIds;
});

const compound = document.getElementById('compound');
compound.columns = [
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
  { id: 'status', header: 'Status', size: 'sm' },
];
const compoundRows = [
  { id: 'event-a', cells: { behaviorDetails: { primary: 'Close following', secondary: 'Critical', secondaryColor: 'negative' }, behavior: 'Close following', severity: 'Critical', status: { kind: 'tag', label: 'Pending review', intent: 'caution' } } },
  { id: 'event-b', cells: { behaviorDetails: { primary: 'Distraction', secondary: 'High', secondaryColor: 'warning' }, behavior: 'Distraction', severity: 'High', status: { kind: 'tag', label: 'Coachable', intent: 'negative' } } },
];
compound.rows = compoundRows;
compound.selectionMode = 'multiple';
compound.addEventListener('dsSortChange', event => {
  compound.sort = event.detail.sort;
  if (!event.detail.sort) {
    compound.rows = compoundRows;
    return;
  }
  const { columnId, direction } = event.detail.sort;
  compound.rows = [...compoundRows].sort((a, b) =>
    String(a.cells[columnId]).localeCompare(String(b.cells[columnId])) * (direction === 'asc' ? 1 : -1));
});

const cellTypes = document.getElementById('cell-types');
cellTypes.columns = [
  { id: 'singleText', header: 'Single text', size: 'sm' },
  { id: 'primarySecondary', header: 'Primary + secondary', size: 'sm' },
  { id: 'linkedText', header: 'Linked text', size: 'sm' },
  { id: 'primaryPair', header: 'Primary + primary', size: 'sm' },
  { id: 'event', header: 'Event', size: 'sm' },
  { id: 'image', header: 'Image', size: 98 },
  { id: 'icon', header: 'Icon only', align: 'center', size: 'xs' },
  { id: 'iconText', header: 'Icon + text', size: 'sm' },
  { id: 'tagOnly', header: 'Tag only', size: 'sm' },
  { id: 'tagWithText', header: 'Tag with text', size: 'sm' },
  { id: 'textWithTag', header: 'Text with tag', size: 'sm' },
  { id: 'action', kind: 'action', header: '', headerLabel: 'Action', align: 'center', size: 40 },
  { id: 'borderedAction', kind: 'action', header: '', headerLabel: 'Bordered action', align: 'center', size: 40 },
  { id: 'empty', header: 'Empty', size: 'xs' },
  { id: 'blank', header: 'Blank', size: 'xs' },
];
cellTypes.rows = [
  {
    id: 'tag-variants',
    selectionLabel: 'Tag cell variants',
    cells: {
      singleText: 'Vehicle 2841',
      primarySecondary: { primary: 'John Smith', secondary: 'DRV-1048' },
      linkedText: {
        primary: 'Freightliner Cascadia',
        secondary: 'VEH-1042',
        href: '/vehicles/VEH-1042',
      },
      primaryPair: { kind: 'primary-text', primary: 'Vehicle', secondary: 'VH-2841' },
      event: {
        primary: 'Speeding',
        secondary: [
          { text: 'High', color: 'negative' },
          { text: '45 mph over' },
        ],
      },
      image: { kind: 'image', tracks: 2, alt: 'Safety event preview unavailable' },
      icon: { kind: 'icon', icon: 'DocumentInverted', color: 'secondary', label: 'Has notes' },
      iconText: {
        kind: 'icon-text',
        icon: 'VehicleTruck',
        primary: 'Freightliner Cascadia',
        href: '/vehicles/VEH-1042',
        secondary: [
          { text: 'VEH-1042' },
          { text: 'Class 8' },
        ],
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
window.__tableCellActionEvents = [];
cellTypes.addEventListener('dsCellAction', event => {
  window.__tableCellActionEvents.push(event.detail);
});

const threeTrack = document.getElementById('three-track');
threeTrack.columns = [
  { id: 'image', header: 'Image', size: 137 },
  { id: 'iconText', header: 'Icon + text', size: 'sm' },
  { id: 'driver', header: 'Driver', size: 'sm' },
  { id: 'vehicle', header: 'Vehicle', size: 'sm' },
  { id: 'event', header: 'Event', size: 'sm' },
];
threeTrack.rows = [
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

const singleTrack = document.getElementById('single-track');
singleTrack.columns = [
  { id: 'scalar', header: 'Scalar text', size: 'sm' },
  { id: 'image', header: 'Image', size: 59 },
  { id: 'icon', header: 'Icon only', align: 'center', size: 'xs' },
  { id: 'iconText', header: 'Icon + text', size: 'sm' },
  { id: 'tagOnly', header: 'Tag only', size: 'sm' },
  { id: 'action', kind: 'action', header: '', headerLabel: 'Action', align: 'center', size: 40 },
];
singleTrack.rows = [
  {
    id: 'single-track-one',
    selectionLabel: 'Vehicle 2841',
    cells: {
      scalar: 'Vehicle 2841',
      image: { kind: 'image', alt: 'Vehicle preview unavailable' },
      icon: { kind: 'icon', icon: 'DocumentInverted', color: 'secondary', label: 'Has notes' },
      iconText: { kind: 'icon-text', icon: 'VehicleTruck', primary: 'Freightliner Cascadia' },
      tagOnly: { kind: 'tag', label: 'Pending', intent: 'caution' },
      action: {
        kind: 'action',
        actionId: 'more',
        variant: 'icon',
        icon: 'Ellipses',
        ariaLabel: 'More actions',
      },
    },
  },
];

const selectable = setBase('selectable');
selectable.selectedRowIds = ['jordan', 'not-loaded'];
window.__tableSelectionEvents = [];
selectable.addEventListener('dsSelectionChange', event => {
  window.__tableSelectionEvents.push(event.detail);
  selectable.selectedRowIds = event.detail.selectedRowIds;
});

const interactive = document.getElementById('interactive');
interactive.columns = [
  ...columns,
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
interactive.rows = rows.slice(0, 2).map(row => ({
  ...row,
  interactive: true,
  cells: {
    ...row.cells,
    actions: {
      kind: 'action',
      actionId: 'more',
      variant: 'icon',
      icon: 'Ellipses',
      ariaLabel: `More actions for ${row.selectionLabel}`,
    },
  },
}));
window.__tableRowActivationEvents = [];
interactive.addEventListener('dsRowActivate', event => {
  window.__tableRowActivationEvents.push(event.detail.rowId);
});

const linkedText = document.getElementById('linked-text');
linkedText.columns = [
  { id: 'vehicle', header: 'Vehicle', size: 'sm' },
  { id: 'status', header: 'Status', size: 'xs' },
];
linkedText.rows = [
  {
    id: 'veh-1042',
    interactive: true,
    selectionLabel: 'Freightliner Cascadia',
    cells: {
      vehicle: {
        primary: 'Freightliner Cascadia',
        secondary: 'VEH-1042',
        href: '/vehicles/VEH-1042',
      },
      status: 'Active',
    },
  },
  {
    id: 'veh-external',
    interactive: true,
    selectionLabel: 'External spec',
    cells: {
      vehicle: {
        primary: 'Maintenance manual',
        href: 'https://example.test/manual',
        target: '_blank',
      },
      status: 'Document',
    },
  },
  {
    id: 'veh-unsafe',
    interactive: true,
    selectionLabel: 'Unsafe href',
    cells: {
      vehicle: {
        primary: 'Rejected script',
        href: 'javascript:alert(1)',
      },
      status: 'Blocked',
    },
  },
];
linkedText.addEventListener('dsRowActivate', event => {
  window.__tableRowActivationEvents.push(event.detail.rowId);
});

for (const id of ['lazy', 'lazy-guard', 'lazy-retry', 'lazy-auto']) {
  const table = document.getElementById(id);
  table.columns = columns.slice(0, 3);
  table.rows = rows.slice(0, 2);
}

window.__tableLoadEvents = [];
document.addEventListener('dsLoadMore', event => {
  window.__tableLoadEvents.push({ id: event.target.id, detail: event.detail });
});

const lazy = document.getElementById('lazy');
lazy.addEventListener('dsLoadMore', () => {
  lazy.loadingMore = true;
  window.setTimeout(() => {
    lazy.rows = [...rows];
    lazy.loadingMore = false;
    lazy.hasMore = false;
  }, 1000);
});

const paginated = document.getElementById('paginated');
const paginatedRows = Array.from({ length: 63 }, (_, index) => ({
  ...rows[index % rows.length],
  id: `paginated-row-${index + 1}`,
  selectable: true,
  disabled: false,
}));
paginated.columns = columns;
paginated.rows = paginatedRows.slice(0, 25);
paginated.selectedRowIds = ['paginated-row-60'];
paginated.pagination = {
  pageIndex: 0,
  pageSize: 25,
  pageSizeMode: 'fixed',
  totalItems: paginatedRows.length,
  pageSizeOptions: [25, 50, 100, 200],
  fitToPage: true,
  itemLabel: 'rows',
  pageSizeLabel: 'Rows',
};
window.__tablePaginationEvents = [];
paginated.addEventListener('dsPaginationChange', event => {
  window.__tablePaginationEvents.push(event.detail);
  const { pageIndex, pageSize, pageSizeMode } = event.detail;
  paginated.pagination = { ...paginated.pagination, pageIndex, pageSize, pageSizeMode };
  paginated.rows = paginatedRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
});
paginated.addEventListener('dsSelectionChange', event => {
  paginated.selectedRowIds = event.detail.selectedRowIds;
});

const groupedPaginated = document.getElementById('grouped-paginated');
const groupedPageSource = Array.from({ length: 30 }, (_, groupIndex) => ({
  id: `group-${groupIndex + 1}`,
  label: `Group ${groupIndex + 1}`,
  totalCount: 3,
  rows: Array.from({ length: 3 }, (_, rowIndex) => ({
    ...rows[(groupIndex + rowIndex) % rows.length],
    id: `group-${groupIndex + 1}-row-${rowIndex + 1}`,
  })),
}));
const renderGroupedPage = (pageIndex, pageSize) => {
  groupedPaginated.groups = groupedPageSource
    .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
    .map(group => ({
      ...group,
      rows: group.rows.slice(0, 1),
      hasMore: true,
      loadIdentity: `group-page:${pageIndex}:${group.id}`,
    }));
};
groupedPaginated.columns = columns;
groupedPaginated.grouping = { columnId: 'status', direction: 'asc' };
groupedPaginated.pagination = {
  pageIndex: 0,
  pageSize: 25,
  pageSizeMode: 'fixed',
  totalItems: groupedPageSource.length,
  pageSizeOptions: [25, 50, 100, 200],
  fitToPage: true,
  itemLabel: 'groups',
  pageSizeLabel: 'Groups',
};
renderGroupedPage(0, 25);
groupedPaginated.addEventListener('dsPaginationChange', event => {
  const { pageIndex, pageSize, pageSizeMode } = event.detail;
  groupedPaginated.pagination = { ...groupedPaginated.pagination, pageIndex, pageSize, pageSizeMode };
  renderGroupedPage(pageIndex, pageSize);
});
groupedPaginated.addEventListener('dsGroupLoadMore', event => {
  groupedPaginated.groups = groupedPaginated.groups.map(group => group.id === event.detail.groupId
    ? { ...group, rows: groupedPageSource.find(source => source.id === group.id).rows, hasMore: false }
    : group);
});

const overflow = document.getElementById('overflow');
overflow.columns = [
  ...columns,
  { id: 'location', header: 'Last known location', size: 'md' },
];
overflow.rows = Array.from({ length: 12 }, (_, index) => ({
  ...rows[index % rows.length],
  id: `${rows[index % rows.length].id}-${index}`,
  cells: { ...rows[index % rows.length].cells, location: `Location ${index + 1}, British Columbia` },
}));

const fixedHeight = document.getElementById('fixed-height');
fixedHeight.columns = columns;
fixedHeight.rows = Array.from({ length: 12 }, (_, index) => ({
  ...rows[index % rows.length],
  id: `fixed-row-${index}`,
}));
fixedHeight.displayedCount = 12;
fixedHeight.totalCount = 40;

const viewportFit = document.getElementById('viewport-fit');
viewportFit.columns = interactive.columns;
viewportFit.grouping = { columnId: 'status', direction: 'asc' };
viewportFit.groups = [
  {
    id: 'fit-first',
    label: 'First fitted section',
    rows: Array.from({ length: 8 }, (_, index) => ({
      ...interactive.rows[index % interactive.rows.length],
      id: `fit-first-${index}`,
    })),
  },
  {
    id: 'fit-second',
    label: 'Second fitted section',
    rows: Array.from({ length: 8 }, (_, index) => ({
      ...interactive.rows[index % interactive.rows.length],
      id: `fit-second-${index}`,
    })),
  },
];
viewportFit.displayedCount = 16;
viewportFit.totalCount = 40;

setBase('standard');
const documentSticky = document.getElementById('document-sticky');
documentSticky.columns = interactive.columns;
documentSticky.sort = { columnId: 'name', direction: 'desc' };
const documentRows = Array.from({ length: 16 }, (_, index) => ({
  ...interactive.rows[index % interactive.rows.length],
  id: `document-row-${index}`,
}));
documentSticky.grouping = { columnId: 'status', direction: 'asc' };
documentSticky.groups = [
  { id: 'first-section', label: 'First section', rows: documentRows.slice(0, 8) },
  { id: 'second-section', label: 'Second section', rows: documentRows.slice(8) },
];
documentSticky.rows = [];
for (const id of ['loading', 'empty', 'error']) {
  document.getElementById(id).columns = columns.slice(0, 3);
}

const loading = document.getElementById('loading');
loading.selectionMode = 'multiple';
loading.columns = [
  { id: 'preview', header: 'Preview', size: 98, skeleton: { kind: 'image', tracks: 2 } },
  {
    id: 'details',
    header: 'Details',
    size: 'sm',
    skeleton: { kind: 'text', lines: 2, primaryWidth: '76%', secondaryWidth: '48%' },
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
    sticky: 'end',
    skeleton: { kind: 'action', variant: 'icon' },
  },
];

document.documentElement.dataset.ready = 'true';

import '/dist/components/ds-table.js';

await customElements.whenDefined('ds-table');

const columns = [
  { id: 'name', header: 'Driver', sortable: true, size: 220 },
  { id: 'status', header: 'Status', sortable: true, size: 140 },
  { id: 'vehicle', header: 'Vehicle', size: 120 },
  { id: 'score', header: 'Safety score', sortable: true, align: 'end', size: 130 },
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
grouped.addEventListener('dsGroupingChange', event => {
  grouped.grouping = event.detail.grouping;
  const next = event.detail.grouping.direction === 'asc' ? ascendingGroups : [...ascendingGroups].reverse();
  grouped.groups = orderMembers(next);
});
grouped.addEventListener('dsSortChange', event => {
  grouped.sort = event.detail.sort;
  const next = grouped.grouping.direction === 'asc' ? ascendingGroups : [...ascendingGroups].reverse();
  grouped.groups = event.detail.sort ? orderMembers(next) : next;
});

const selectable = setBase('selectable');
selectable.selectedRowIds = ['jordan', 'not-loaded'];
window.__tableSelectionEvents = [];
selectable.addEventListener('dsSelectionChange', event => {
  window.__tableSelectionEvents.push(event.detail);
  selectable.selectedRowIds = event.detail.selectedRowIds;
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
  }, 50);
});

const overflow = document.getElementById('overflow');
overflow.columns = [
  ...columns,
  { id: 'location', header: 'Last known location', size: 280 },
];
overflow.rows = Array.from({ length: 12 }, (_, index) => ({
  ...rows[index % rows.length],
  id: `${rows[index % rows.length].id}-${index}`,
  cells: { ...rows[index % rows.length].cells, location: `Location ${index + 1}, British Columbia` },
}));

setBase('small');
for (const id of ['loading', 'empty', 'error']) {
  document.getElementById(id).columns = columns.slice(0, 3);
}

document.documentElement.dataset.ready = 'true';

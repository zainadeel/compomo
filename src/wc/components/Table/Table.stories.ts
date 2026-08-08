import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-table.js';
import '../../../../dist/components/ds-text.js';
import '../../styles/table.css';
import type {
  TableColumn,
  TableGroup,
  TableGroupingState,
  TableRow,
  TableSortState,
} from './table-types';

const COLUMNS: TableColumn[] = [
  { id: 'driver', header: 'Driver', sortable: true, size: 232, minSize: 184 },
  { id: 'status', header: 'Status', sortable: true, size: 136 },
  { id: 'vehicle', header: 'Vehicle', sortable: true, size: 120 },
  { id: 'location', header: 'Last known location', size: 232 },
  { id: 'safetyScore', header: 'Safety score', sortable: true, align: 'end', size: 128 },
  { id: 'driveTime', header: 'Drive time', sortable: true, align: 'end', size: 112 },
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
  { id: 'driver', header: 'Driver', size: 216 },
  { id: 'status', header: 'Status', size: 120 },
  { id: 'vehicle', header: 'Vehicle', size: 112 },
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
    return value && typeof value === 'object' ? value.primary : value;
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

  const direction = grouping.direction === 'asc' ? 1 : -1;
  return [...byStatus]
    .sort(([a], [b]) => a.localeCompare(b) * direction)
    .map(([label, members]) => ({
      id: label.toLowerCase().replaceAll(' ', '-'),
      label,
      rows: orderedRows(members, sort),
      totalCount: members.length,
    }));
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
    density: { control: 'select', options: ['md', 'sm'] },
    captionVisibility: { control: 'select', options: ['visible', 'hidden'] },
    stickyHeader: { control: 'boolean' },
    selectionMode: { control: 'select', options: ['none', 'multiple'] },
    loading: { control: 'boolean' },
    lazyLoading: { control: 'boolean' },
    loadMoreMode: { control: 'select', options: ['auto', 'manual'] },
  },
  args: {
    density: 'md',
    captionVisibility: 'visible',
    stickyHeader: false,
    selectionMode: 'multiple',
    loading: false,
    lazyLoading: false,
    loadMoreMode: 'manual',
    selectedRowIds: [],
    sort: null,
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
        density=${args['density']}
        selection-mode=${args['selectionMode']}
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

export const Densities: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Medium is the default comfortable data-table density. Small keeps the same semantics and controls with tighter 32px headers and 40px rows.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;gap:var(--dimension-space-300);">
      ${(['md', 'sm'] as const).map(
        density => html`
          <section style="display:grid;gap:var(--dimension-space-100);">
            <ds-text as="h2" variant="text-title-small" emphasis>${density === 'md' ? 'Medium' : 'Small'}</ds-text>
            <ds-table
              data-a11y-fixture
              .columns=${COLUMNS.slice(0, 4)}
              .rows=${ROWS.slice(0, 3)}
              caption="${density} density workforce table"
              caption-visibility="hidden"
              density=${density}
            ></ds-table>
          </section>
        `,
      )}
    </div>
  `,
};

export const GroupingAndIndependentSorting: Story = {
  name: 'Grouping and independent sorting',
  args: {
    grouping: { columnId: 'status', direction: 'asc' },
    sort: { columnId: 'safetyScore', direction: 'desc' },
  },
  parameters: {
    docs: {
      description: {
        story: 'The Status header controls group order. Safety score controls member order inside each group. The story performs both transformations in application code, illustrating the controlled contract.',
      },
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    const grouping = args['grouping'] as TableGroupingState;
    const sort = (args['sort'] as TableSortState | null) ?? null;
    return html`
      <ds-table
        .columns=${COLUMNS}
        .groups=${groupedRows(ROWS, grouping, sort)}
        .grouping=${grouping}
        .sort=${sort}
        caption="Drivers grouped by status"
        caption-visibility="visible"
        @dsGroupingChange=${(event: CustomEvent<{ grouping: TableGroupingState }>) =>
          updateArgs({ grouping: event.detail.grouping })}
        @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) =>
          updateArgs({ sort: event.detail.sort })}
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
          { id: 'name', header: 'Primary and secondary', size: 216 },
          { id: 'notes', header: 'Wrapping content', wrap: true, size: 248 },
          { id: 'quantity', header: 'Quantity', align: 'end', size: 104 },
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
        story: 'Initial loading, empty, and initial error keep the table caption and column relationships present while replacing only the body state.',
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

export const NarrowAndLongContent: Story = {
  name: 'Narrow viewport and long content',
  render: () => html`
    <div style="max-inline-size:var(--dimension-panel-width-xs);">
      <ds-table
        .columns=${[
          { id: 'driver', header: 'Driver', size: 208 },
          { id: 'location', header: 'Last known location', size: 280, wrap: true },
          { id: 'event', header: 'Latest event', size: 240 },
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
        --ds-table-selection-indicator:var(--color-background-bold-positive);
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

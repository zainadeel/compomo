import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import '../../../../dist/components/ds-table.js';
import '../../../../dist/components/ds-table-toolbar.js';
import '../../../../dist/components/ds-table-saved-views.js';
import '../../../../dist/components/ds-table-filter.js';
import '../../../../dist/components/ds-table-sort.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-input.js';
import type { TableColumnsConfigChangeDetail, TableSortState } from '../Table/table-types';

const COLUMNS = [
  { id: 'driver', header: 'Driver', sortable: true, size: 'sm' },
  { id: 'status', header: 'Status', sortable: true, size: 'xs' },
  { id: 'vehicle', header: 'Vehicle', size: 'xs' },
];

const ROWS = [
  { id: 'avery', cells: { driver: 'Avery Chen', status: 'Driving', vehicle: 'V-2048' } },
  { id: 'jordan', cells: { driver: 'Jordan Patel', status: 'On duty', vehicle: 'V-1822' } },
  { id: 'sam', cells: { driver: 'Sam Rivera', status: 'Off duty', vehicle: 'V-2105' } },
];

const FILTERS = [
  {
    id: 'status',
    label: 'Status',
    kind: 'multiple' as const,
    options: [
      { label: 'Driving', value: 'driving' },
      { label: 'On duty', value: 'on-duty' },
      { label: 'Off duty', value: 'off-duty' },
    ],
  },
  {
    id: 'event-date',
    label: 'Date-time',
    kind: 'date' as const,
    fieldLabel: 'Event date',
  },
];

const GROUPING_OPTIONS = [
  { label: 'Status', value: 'status' },
  { label: 'Vehicle', value: 'vehicle' },
];

const applySort = (event: Event) => {
  const detail = (event as CustomEvent<{ sort: TableSortState | null }>).detail;
  const table = (event.currentTarget as HTMLElement).closest('ds-table') as
    | (HTMLElement & { sort: TableSortState | null })
    | null;
  const control = table?.querySelector('ds-table-sort') as
    | (HTMLElement & { sort: TableSortState | null })
    | null;
  if (table) table.sort = detail.sort;
  if (control) control.sort = detail.sort;
};

const applyColumnsConfig = (event: Event) => {
  const table = event.currentTarget as HTMLElement & {
    hiddenColumnIds: string[];
    columnOrder: string[];
  };
  const detail = (event as CustomEvent<TableColumnsConfigChangeDetail>).detail;
  table.hiddenColumnIds = detail.hiddenColumnIds;
  table.columnOrder = detail.columnOrder;
};

const renderToolbar = (options?: { filterValues?: Record<string, string[]>; groupValue?: string }) => html`
  <ds-table-toolbar slot="header" label="Fleet table controls">
    <ds-table-saved-views
      slot="start"
      .views=${[
        { id: 'attention', label: 'Needs attention with a very long saved view name' },
        { id: 'west', label: 'West region' },
      ]}
      value="attention"
    ></ds-table-saved-views>
    <ds-input
      slot="search"
      type="search"
      size="md"
      width="fill"
      placeholder="Search"
      aria-label="Search fleet"
    ></ds-input>
    <ds-table-filter
      slot="trailing"
      menu-label="Filter fleet"
      aria-label="Filter fleet"
      .filters=${FILTERS}
      .values=${options?.filterValues ?? {}}
    ></ds-table-filter>
    <ds-table-sort
      slot="trailing"
      .columns=${COLUMNS}
      .sort=${{ columnId: 'driver', direction: 'asc' }}
      aria-label="Sort fleet"
      @dsSortChange=${applySort}
    ></ds-table-sort>
    <ds-select
      slot="trailing"
      collapse-label
      size="md"
      icon="SectionList"
      placeholder="Group"
      aria-label="Group fleet"
      .activeFill=${false}
      .options=${GROUPING_OPTIONS}
      .value=${options?.groupValue ?? ''}
    ></ds-select>
  </ds-table-toolbar>
`;

const meta: Meta = {
  title: 'Data display/Table toolbar',
  component: 'ds-table-toolbar',
  parameters: {
    docs: {
      description: {
        component:
          'A data-agnostic companion layout for application-owned controls placed in a table header slot. It groups a start cluster, an optional search slot, and trailing Filter, Sort, and Group controls. Customize table and table variation remain table-owned caption actions and scroll with the complete caption row.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Controls: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Full-width table caption: saved views, search, Filter, Sort, and Group in the toolbar, then the table-owned Customize and Ellipses variation actions. Search keeps its standard maximum width and flexes smaller only when needed; at compact widths, Filter, Sort, Group, and Customize become icon-only. The complete row shares one overflow owner. Active Filter or Group promote the icon to primary. Sort stays secondary.',
      },
      ...isolatedOverlayDocs('420px'),
    },
  },
  render: () => html`
    <div style="padding:var(--dimension-space-200);">
      <ds-table
        data-a11y-fixture
        style="inline-size:100%;"
        caption="Fleet"
        caption-visibility="visible"
        column-customizer
        data-mode-switcher
        .columns=${COLUMNS}
        .rows=${ROWS}
        .sort=${{ columnId: 'driver', direction: 'asc' }}
        @dsSortChange=${applySort}
        @dsColumnsConfigChange=${applyColumnsConfig}
      >
        ${renderToolbar()}
      </ds-table>
    </div>
  `,
};

export const CompactCaption: Story = {
  name: 'Compact caption',
  parameters: {
    docs: {
      description: {
        story:
          'When the table is narrower than 900px, Filter, Group, Sort, and Customize become icon-only. Active Filter or Group, and customized columns, keep the icon in primary. Sort stays secondary.',
      },
    },
  },
  render: () => html`
    <div style="inline-size:55rem;padding:var(--dimension-space-200);">
      <ds-table
        caption="Fleet"
        caption-visibility="visible"
        column-customizer
        data-mode-switcher
        .columns=${COLUMNS}
        .rows=${ROWS}
        .sort=${{ columnId: 'driver', direction: 'asc' }}
        @dsSortChange=${applySort}
        @dsColumnsConfigChange=${applyColumnsConfig}
      >
        ${renderToolbar({ filterValues: { status: ['driving'] }, groupValue: 'status' })}
      </ds-table>
    </div>
  `,
};

export const NarrowOverflow: Story = {
  name: 'Narrow overflow',
  render: () => html`
    <div style="inline-size:20rem;">
      <ds-table-toolbar label="Fleet table controls">
        <ds-table-saved-views slot="start"></ds-table-saved-views>
        <ds-input
          slot="search"
          type="search"
          size="md"
          width="fill"
          placeholder="Search"
          aria-label="Search fleet"
        ></ds-input>
        <ds-table-filter
          slot="trailing"
          aria-label="Filter fleet"
        ></ds-table-filter>
        <ds-select
          slot="trailing"
          collapse-label
          size="md"
          icon="SectionList"
          placeholder="Group"
          aria-label="Group fleet"
          .activeFill=${false}
        ></ds-select>
        <ds-table-sort slot="trailing" .columns=${COLUMNS} aria-label="Sort fleet"></ds-table-sort>
      </ds-table-toolbar>
    </div>
  `,
};

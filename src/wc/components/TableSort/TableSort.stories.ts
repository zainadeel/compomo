import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import '../../../../dist/components/ds-table-sort.js';
import type { TableSortState } from '../Table/table-types';

const COLUMNS = [
  { id: 'driver', header: 'Driver', sortable: true, size: 'sm' },
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
  { id: 'status', header: 'Status', sortable: true, size: 'xs' },
];

const meta: Meta = {
  title: 'Data display/Table sort',
  component: 'ds-table-sort',
  parameters: {
    docs: {
      description: {
        component:
          'A toolbar companion for the table’s one controlled sort. The trigger stays Sort in resting secondary chrome. The menu has Data and Direction sections. Keep the same sort value on ds-table so header clicks stay in sync.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SortMenu: Story = {
  name: 'Sort menu',
  parameters: {
    docs: {
      description: {
        story:
          'The trigger stays Sort in resting secondary chrome. Choosing a field keeps the current direction. Choosing a direction applies it to the current field. The menu stays open so the other section can be changed.',
      },
      ...isolatedOverlayDocs('360px'),
    },
  },
  render: () => html`
    <div style="padding:var(--dimension-space-200);">
      <ds-table-sort
        data-a11y-fixture
        .columns=${COLUMNS}
        .sort=${{ columnId: 'driver', direction: 'asc' }}
        aria-label="Sort fleet"
        @dsSortChange=${(event: CustomEvent<{ sort: TableSortState | null }>) => {
          const control = event.currentTarget as HTMLElement & { sort: TableSortState | null };
          control.sort = event.detail.sort;
        }}
      ></ds-table-sort>
    </div>
  `,
};

export const LongColumnCatalog: Story = {
  name: 'Long column catalog',
  parameters: {
    docs: {
      description: {
        story:
          'When the sortable field catalog is taller than the available viewport space, the shared menu keeps its resolved placement and scrolls the choices internally.',
      },
      ...isolatedOverlayDocs('360px'),
    },
  },
  render: () => html`
    <div style="padding:var(--dimension-space-200);">
      <ds-table-sort
        .columns=${Array.from({ length: 18 }, (_, index) => ({
          id: `column-${index + 1}`,
          header: `Sortable column ${index + 1}`,
          sortable: true,
          size: 'sm',
        }))}
        .sort=${{ columnId: 'column-1', direction: 'asc' }}
        aria-label="Sort large table"
      ></ds-table-sort>
    </div>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import '../../../../dist/components/ds-data-sort.js';
import type { DataSortState } from '../Table/table-types';

const COLUMNS = [
  { id: 'driver', label: 'Driver', sortable: true, size: 'sm' },
  {
    id: 'behaviorDetails',
    label: 'Behavior / Severity',
    segments: [
      { label: 'Behavior', sortKey: 'behavior', separator: '/' },
      { label: 'Severity', sortKey: 'severity' },
    ],
    sortable: true,
    size: 'sm',
  },
  { id: 'status', label: 'Status', sortable: true, size: 'xs' },
];

const meta: Meta = {
  title: 'Data controls/Sort',
  component: 'ds-data-sort',
  parameters: {
    docs: {
      description: {
        component:
          'A toolbar companion for the table’s one controlled sort. The trigger stays Sort in resting secondary chrome. The menu has Data and Order sections. Keep the same sort value on ds-table so header clicks stay in sync.',
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
      <ds-data-sort
        data-a11y-fixture
        .fields=${COLUMNS}
        .sort=${{ fieldId: 'driver', direction: 'asc' }}
        aria-label="Sort fleet"
        @dsSortChange=${(event: CustomEvent<{ sort: DataSortState | null }>) => {
          const control = event.currentTarget as HTMLElement & { sort: DataSortState | null };
          control.sort = event.detail.sort;
        }}
      ></ds-data-sort>
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
      <ds-data-sort
        .fields=${Array.from({ length: 18 }, (_, index) => ({
          id: `column-${index + 1}`,
          label: `Sortable column ${index + 1}`,
          sortable: true,
          size: 'sm',
        }))}
        .sort=${{ fieldId: 'column-1', direction: 'asc' }}
        aria-label="Sort large table"
      ></ds-data-sort>
    </div>
  `,
};

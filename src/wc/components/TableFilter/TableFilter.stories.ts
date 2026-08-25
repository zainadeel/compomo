import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import '../../../../dist/components/ds-table-filter.js';
import type { FilterMenuChangeDetail, FilterMenuValues } from '../FilterMenu/FilterMenu';

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

const meta: Meta = {
  title: 'Data display/Table filter',
  component: 'ds-table-filter',
  parameters: {
    docs: {
      description: {
        component:
          'The standard Filter control for a table toolbar. CompoMo owns the trigger, menu UI, accessibility, and compact-caption treatment while the application owns filter definitions, values, and query consequences.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const FilterMenu: Story = {
  name: 'Filter menu',
  parameters: {
    docs: {
      description: {
        story:
          'The visible toolbar label stays singular. The selected count is derived from controlled values, and changes remain open so several criteria can be adjusted together.',
      },
      ...isolatedOverlayDocs('420px'),
    },
  },
  render: () => html`
    <div style="padding:var(--dimension-space-200);">
      <ds-table-filter
        data-a11y-fixture
        .filters=${FILTERS}
        .values=${{ status: ['driving'] }}
        aria-label="Filter fleet"
        @dsChange=${(event: CustomEvent<FilterMenuChangeDetail>) => {
          const control = event.currentTarget as HTMLElement & { values: FilterMenuValues };
          control.values = { ...control.values, [event.detail.filterId]: event.detail.value };
        }}
        @dsClear=${(event: Event) => {
          (event.currentTarget as HTMLElement & { values: FilterMenuValues }).values = {};
        }}
        @dsActiveFilterChange=${(event: CustomEvent<string>) => {
          (event.currentTarget as HTMLElement & { activeFilterId: string }).activeFilterId =
            event.detail;
        }}
      ></ds-table-filter>
    </div>
  `,
};

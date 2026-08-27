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
    label: 'Date',
    kind: 'date' as const,
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
          'The visible toolbar label stays singular and promotes to its active foreground without adding a count suffix. Category counts remain derived from controlled values; a reserved footer in the category pane reveals only the Clear action when criteria are active, without changing popup height.',
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

export const DateFilter: Story = {
  name: 'Date filter',
  parameters: {
    docs: {
      description: {
        story:
          'Date filters persist either a semantic relative preset or a fixed calendar range. Relative presets resolve from the current date whenever an application applies a saved view.',
      },
      ...isolatedOverlayDocs('520px'),
    },
  },
  render: () => html`
    <div style="padding:var(--dimension-space-200);">
      <ds-table-filter
        open
        .filters=${FILTERS}
        .values=${{ 'event-date': 'relative:last-7-days' }}
        active-filter-id="event-date"
        aria-label="Filter events"
        @dsChange=${(event: CustomEvent<FilterMenuChangeDetail>) => {
          const control = event.currentTarget as HTMLElement & { values: FilterMenuValues };
          control.values = { ...control.values, [event.detail.filterId]: event.detail.value };
        }}
        @dsClear=${(event: Event) => {
          (event.currentTarget as HTMLElement & { values: FilterMenuValues }).values = {};
        }}
      ></ds-table-filter>
    </div>
  `,
};

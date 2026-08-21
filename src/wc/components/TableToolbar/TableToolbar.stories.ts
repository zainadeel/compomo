import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-table-toolbar.js';
import '../../../../dist/components/ds-table-saved-views.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-input.js';
import '../../../../dist/components/ds-filter-menu.js';

const meta: Meta = {
  title: 'Data display/Table toolbar',
  component: 'ds-table-toolbar',
  parameters: {
    docs: {
      description: {
        component: 'A data-agnostic companion layout for application-owned controls placed in a table header slot. It groups leading discovery controls and trailing result-shaping controls without owning their values or consequences.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Controls: Story = {
  render: () => html`
    <div style="inline-size:min(100%,var(--dimension-panel-width-lg));">
      <ds-table-toolbar label="Fleet table controls">
        <ds-table-saved-views
          slot="leading"
          .views=${[{ id: 'attention', label: 'Needs attention' }]}
        ></ds-table-saved-views>
        <ds-input
          slot="leading"
          type="search"
          size="md"
          placeholder="Search"
          aria-label="Search fleet"
          style="flex:0 1 var(--dimension-panel-width-xs);min-inline-size:0;"
        ></ds-input>
        <ds-filter-menu
          slot="trailing"
          size="md"
          icon="Filters"
          trigger-label="Filters"
          menu-label="Filter fleet"
        ></ds-filter-menu>
        <ds-select
          slot="trailing"
          size="md"
          icon="SectionList"
          placeholder="Group by"
          aria-label="Group fleet"
        ></ds-select>
      </ds-table-toolbar>
    </div>
  `,
};

export const NarrowOverflow: Story = {
  name: 'Narrow overflow',
  render: () => html`
    <div style="inline-size:20rem;">
      <ds-table-toolbar label="Fleet table controls">
        <ds-table-saved-views slot="leading"></ds-table-saved-views>
        <ds-input
          slot="leading"
          type="search"
          size="md"
          placeholder="Search"
          aria-label="Search fleet"
        ></ds-input>
        <ds-filter-menu slot="trailing" size="md" icon="Filters" trigger-label="Filters"></ds-filter-menu>
        <ds-select
          slot="trailing"
          size="md"
          icon="SectionList"
          placeholder="Group by"
          aria-label="Group fleet"
        ></ds-select>
      </ds-table-toolbar>
    </div>
  `,
};

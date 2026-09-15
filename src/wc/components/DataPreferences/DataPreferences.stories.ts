import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-data-preferences.js';
const meta: Meta = { title: 'Data controls/Preferences', component: 'ds-data-preferences' };
export default meta;
type Story = StoryObj;
export const Compact: Story = {
  render: () =>
    html`<ds-data-preferences
      .columns=${[
        { id: 'driver', header: 'Driver', sortable: true },
        { id: 'status', header: 'Status', sortable: true },
      ]}
      .filters=${[
        {
          id: 'status',
          label: 'Status',
          kind: 'multiple',
          options: [
            { label: 'Driving', value: 'driving' },
            { label: 'Stopped', value: 'stopped' },
          ],
        },
      ]}
      .groupingOptions=${[{ label: 'Status', value: 'status' }]}
      @dsFilterChange=${(event: CustomEvent) => {
        const control = event.currentTarget as HTMLDsDataPreferencesElement;
        control.values = { ...control.values, [event.detail.filterId]: event.detail.value };
      }}
      @dsFiltersClear=${(event: CustomEvent) => {
        (event.currentTarget as HTMLDsDataPreferencesElement).values = {};
      }}
      @dsGroupClear=${(event: CustomEvent) => {
        (event.currentTarget as HTMLDsDataPreferencesElement).grouping = null;
      }}
      @dsFilterMatchModeChange=${(event: CustomEvent) => {
        const control = event.currentTarget as HTMLDsDataPreferencesElement;
        control.matchModes = {
          ...control.matchModes,
          [event.detail.filterId]: event.detail.matchMode,
        };
      }}
      @dsSortChange=${(event: CustomEvent) => {
        (event.currentTarget as HTMLDsDataPreferencesElement).sort = event.detail.sort;
      }}
      @dsGroupChange=${(event: CustomEvent) => {
        (event.currentTarget as HTMLDsDataPreferencesElement).grouping = event.detail;
      }}
      @dsColumnsConfigChange=${(event: CustomEvent) => {
        Object.assign(event.currentTarget!, event.detail);
      }}
    ></ds-data-preferences>`,
};

export const PanelContent: Story = {
  render: () =>
    html`<div style="height: 70vh; width: var(--dimension-panel-width-sm); display: flex;">
      <ds-data-preferences
        embedded
        .activeTab=${'filters'}
        .filters=${[
          {
            id: 'status',
            label: 'Motion status',
            kind: 'multiple',
            options: [
              { label: 'Moving', value: 'moving' },
              { label: 'Idle', value: 'idle' },
            ],
          },
        ]}
        .columns=${[{ id: 'name', header: 'Name', sortable: true }]}
        .groupingOptions=${[{ label: 'Motion status', value: 'status' }]}
        @dsPreferencesTabChange=${(e: CustomEvent) => {
          (e.currentTarget as HTMLDsDataPreferencesElement).activeTab = e.detail;
        }}
        @dsFilterChange=${(e: CustomEvent) => {
          const el = e.currentTarget as HTMLDsDataPreferencesElement;
          el.values = { ...el.values, [e.detail.filterId]: e.detail.value };
        }}
      ></ds-data-preferences>
    </div>`,
};

/**
 * A non-table surface — a Live Map card list — reusing Customize for show/hide
 * only: its own section header, switch rows with no drag handles, and every
 * field hideable because card identity lives outside this catalog.
 */
export const ToggleOnlyCatalog: Story = {
  render: () =>
    html`<div style="height: 70vh; width: var(--dimension-panel-width-sm); display: flex;">
      <ds-data-preferences
        embedded
        .activeTab=${'customize'}
        customize-label="Customize view"
        catalog-header="Data"
        .catalogReorderable=${false}
        .hiddenColumnIds=${['assetType']}
        .columns=${[
          { id: 'driverId', header: 'Driver ID' },
          { id: 'vehicleMmy', header: 'Vehicle MMY' },
          { id: 'assetType', header: 'Asset Type · MMY' },
          { id: 'motion', header: 'Motion detail' },
          { id: 'lastUpdated', header: 'Last updated' },
        ]}
        .customizeOptions=${[
          { label: 'Show applied filters', value: 'show-filters', showSwitch: true },
        ]}
        @dsColumnsConfigChange=${(e: CustomEvent) => {
          const el = e.currentTarget as HTMLDsDataPreferencesElement;
          el.hiddenColumnIds = e.detail.hiddenColumnIds;
        }}
      ></ds-data-preferences>
    </div>`,
};

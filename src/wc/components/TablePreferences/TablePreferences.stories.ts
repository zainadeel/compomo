import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-table-preferences.js';
const meta: Meta = { title: 'Data display/Table preferences', component: 'ds-table-preferences' };
export default meta;
type Story = StoryObj;
export const Compact: Story = {
  render: () =>
    html`<ds-table-preferences
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
        const control = event.currentTarget as HTMLDsTablePreferencesElement;
        control.values = { ...control.values, [event.detail.filterId]: event.detail.value };
      }}
      @dsFiltersClear=${(event: CustomEvent) => {
        (event.currentTarget as HTMLDsTablePreferencesElement).values = {};
      }}
      @dsGroupClear=${(event: CustomEvent) => {
        (event.currentTarget as HTMLDsTablePreferencesElement).grouping = null;
      }}
      @dsFilterMatchModeChange=${(event: CustomEvent) => {
        const control = event.currentTarget as HTMLDsTablePreferencesElement;
        control.matchModes = {
          ...control.matchModes,
          [event.detail.filterId]: event.detail.matchMode,
        };
      }}
      @dsSortChange=${(event: CustomEvent) => {
        (event.currentTarget as HTMLDsTablePreferencesElement).sort = event.detail.sort;
      }}
      @dsGroupChange=${(event: CustomEvent) => {
        (event.currentTarget as HTMLDsTablePreferencesElement).grouping = event.detail;
      }}
      @dsColumnsConfigChange=${(event: CustomEvent) => {
        Object.assign(event.currentTarget!, event.detail);
      }}
    ></ds-table-preferences>`,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import '../../../../dist/components/ds-table-group.js';
import type { TableGroupingState } from '../Table/table-types';

const OPTIONS = [
  { label: 'Behavior', value: 'behavior' },
  { label: 'Severity', value: 'severity' },
  { label: 'Status', value: 'status' },
  { label: 'Driver name', value: 'driverName' },
];

const meta: Meta = {
  title: 'Data display/Table group',
  component: 'ds-table-group',
  parameters: {
    docs: {
      description: {
        component:
          'A controlled two-panel table toolbar control. Data points stay in the left pane and the selected group’s ascending or descending section order stays in the right pane.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const renderGroup = (grouping: TableGroupingState | null) => html`
  <div style="padding:var(--dimension-space-200);">
    <ds-table-group
      .options=${OPTIONS}
      .grouping=${grouping}
      .open=${true}
      aria-label="Group safety events"
      @dsGroupChange=${(event: CustomEvent<TableGroupingState>) => {
        const control = event.currentTarget as HTMLDsTableGroupElement;
        control.grouping = event.detail;
      }}
      @dsClear=${(event: CustomEvent<void>) => {
        const control = event.currentTarget as HTMLDsTableGroupElement;
        control.grouping = null;
      }}
    ></ds-table-group>
  </div>
`;

export const ActiveGrouping: Story = {
  name: 'Active grouping',
  parameters: { docs: { ...isolatedOverlayDocs('620px') } },
  render: () => renderGroup({ columnId: 'severity', direction: 'asc' }),
};

export const NoGrouping: Story = {
  name: 'No grouping',
  parameters: {
    docs: {
      description: {
        story:
          'The order pane remains visible before grouping is active and explains how to make its choices available.',
      },
      ...isolatedOverlayDocs('620px'),
    },
  },
  render: () => renderGroup(null),
};

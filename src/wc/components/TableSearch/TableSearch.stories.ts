import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import '../../../../dist/components/ds-table-search.js';
import type { TableSearchFieldsChangeDetail } from './table-search-types';

const COLUMNS = [
  {
    id: 'vehicleDetails',
    header: 'Vehicle ID / Make · Model · Year',
    headerSegments: [
      { label: 'Vehicle ID', dataLabel: 'Vehicle ID', sortKey: 'vehicleId', separator: '/' },
      { label: 'Make', dataLabel: 'Vehicle make', sortKey: 'vehicleMake', separator: '·' },
      { label: 'Model', dataLabel: 'Vehicle model', sortKey: 'vehicleModel', separator: '·' },
      { label: 'Year', dataLabel: 'Vehicle year', sortKey: 'vehicleYear' },
    ],
  },
  {
    id: 'driverDetails',
    header: 'Driver name / ID',
    headerSegments: [
      { label: 'Driver name', dataLabel: 'Driver name', sortKey: 'driverName', separator: '/' },
      { label: 'ID', dataLabel: 'Driver ID', sortKey: 'driverId' },
    ],
  },
  { id: 'location', header: 'Location', dataLabel: 'Location' },
  { id: 'updatedAt', header: 'Updated', dataLabel: 'Last updated' },
  { id: 'actions', kind: 'action', header: '', headerLabel: 'Actions' },
];

const meta: Meta = {
  title: 'Data display/Table search',
  component: 'ds-table-search',
  parameters: {
    docs: {
      description: {
        component:
          'A controlled table-search editor with slash-invoked field scoping. It owns tags, listbox interaction, focus, and intent events while the application owns row filtering.',
      },
    },
  },
  args: {
    value: '',
    selectedFieldIds: [],
  },
};

export default meta;
type Story = StoryObj;

export const SlashFieldMenu: Story = {
  name: 'Slash field menu',
  parameters: {
    docs: {
      description: {
        story:
          'Focus the search and type /. Up and Down move through fields while Left and Right remain native input cursor keys. Enter adds the active field as an individually removable inset md Chip. Escape or Backspace closes the open slash menu; once it is closed, Backspace edits query text or removes the last field when the query is empty.',
      },
      ...isolatedOverlayDocs('400px'),
    },
  },
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <div
        style="padding:var(--dimension-space-200);max-inline-size:var(--dimension-panel-width-sm);"
      >
        <ds-table-search
          data-a11y-fixture
          .columns=${COLUMNS}
          .selectedFieldIds=${args['selectedFieldIds']}
          .value=${args['value']}
          placeholder="Search vehicles"
          aria-label="Search vehicles"
          @dsChange=${(event: CustomEvent<string>) => updateArgs({ value: event.detail })}
          @dsFieldsChange=${(event: CustomEvent<TableSearchFieldsChangeDetail>) =>
            updateArgs({ selectedFieldIds: event.detail.selectedFieldIds })}
          @dsClear=${() => updateArgs({ value: '', selectedFieldIds: [] })}
        ></ds-table-search>
      </div>
    `;
  },
};

export const ScopedQuery: Story = {
  name: 'Scoped query',
  args: {
    value: 'sam',
    selectedFieldIds: ['driverName', 'vehicleId'],
  },
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <div style="max-inline-size:var(--dimension-panel-width-xs);">
        <ds-table-search
          .columns=${COLUMNS}
          .selectedFieldIds=${args['selectedFieldIds']}
          .value=${args['value']}
          placeholder="Search vehicles"
          aria-label="Search vehicles"
          @dsChange=${(event: CustomEvent<string>) => updateArgs({ value: event.detail })}
          @dsFieldsChange=${(event: CustomEvent<TableSearchFieldsChangeDetail>) =>
            updateArgs({ selectedFieldIds: event.detail.selectedFieldIds })}
          @dsClear=${() => updateArgs({ value: '', selectedFieldIds: [] })}
        ></ds-table-search>
      </div>
    `;
  },
};

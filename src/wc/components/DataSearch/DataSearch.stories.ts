import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import '../../../../dist/components/ds-data-search.js';
import type { DataSearchFieldsChangeDetail } from './data-search-types';

const COLUMNS = [
  {
    id: 'vehicleDetails',
    label: 'Vehicle ID / Make · Model · Year',
    segments: [
      { label: 'Vehicle ID', dataLabel: 'Vehicle ID', sortKey: 'vehicleId', separator: '/' },
      { label: 'Make', dataLabel: 'Vehicle make', sortKey: 'vehicleMake', separator: '·' },
      { label: 'Model', dataLabel: 'Vehicle model', sortKey: 'vehicleModel', separator: '·' },
      { label: 'Year', dataLabel: 'Vehicle year', sortKey: 'vehicleYear' },
    ],
  },
  {
    id: 'driverDetails',
    label: 'Driver name / ID',
    segments: [
      { label: 'Driver name', dataLabel: 'Driver name', sortKey: 'driverName', separator: '/' },
      { label: 'ID', dataLabel: 'Driver ID', sortKey: 'driverId' },
    ],
  },
  { id: 'location', label: 'Location', dataLabel: 'Location' },
  { id: 'updatedAt', label: 'Updated', dataLabel: 'Last updated' },
  { id: 'actions', kind: 'action', label: '', accessibleLabel: 'Actions' },
];

const meta: Meta = {
  title: 'Data controls/Search',
  component: 'ds-data-search',
  parameters: {
    docs: {
      description: {
        component:
          'A controlled data-search editor with slash-invoked field scoping. It owns tags, listbox interaction, focus, and intent events while the application owns row filtering.',
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
          'Focus the search and type /. Continue typing to filter data points by name. Up and Down move through matches while Left and Right remain native input cursor keys. Enter adds the active field as an individually removable inset md Chip. Escape closes the menu; Backspace edits the picker query and closes the menu once that query is empty. With the menu closed, Backspace edits table query text or removes the last field when the query is empty.',
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
        <ds-data-search
          data-a11y-fixture
          .fields=${COLUMNS}
          .selectedFieldIds=${args['selectedFieldIds']}
          .value=${args['value']}
          placeholder="Search vehicles"
          aria-label="Search vehicles"
          @dsChange=${(event: CustomEvent<string>) => updateArgs({ value: event.detail })}
          @dsFieldsChange=${(event: CustomEvent<DataSearchFieldsChangeDetail>) =>
            updateArgs({ selectedFieldIds: event.detail.selectedFieldIds })}
          @dsClear=${() => updateArgs({ value: '', selectedFieldIds: [] })}
        ></ds-data-search>
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
        <ds-data-search
          .fields=${COLUMNS}
          .selectedFieldIds=${args['selectedFieldIds']}
          .value=${args['value']}
          placeholder="Search vehicles"
          aria-label="Search vehicles"
          @dsChange=${(event: CustomEvent<string>) => updateArgs({ value: event.detail })}
          @dsFieldsChange=${(event: CustomEvent<DataSearchFieldsChangeDetail>) =>
            updateArgs({ selectedFieldIds: event.detail.selectedFieldIds })}
          @dsClear=${() => updateArgs({ value: '', selectedFieldIds: [] })}
        ></ds-data-search>
      </div>
    `;
  },
};

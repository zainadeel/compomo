import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-table.js';

const columns = [
  { id: 'name',   header: 'Name',    accessorKey: 'name',   sortable: true,  width: 160 },
  { id: 'vin',    header: 'VIN',     accessorKey: 'vin',    width: 200 },
  { id: 'status', header: 'Status',  accessorKey: 'status', sortable: true },
  { id: 'miles',  header: 'Miles',   accessorKey: 'miles',  sortable: true, align: 'right' as const },
];

const vehicles = [
  { name: 'Truck 01', vin: '1HGBH41JXMN109186', status: 'Active',   miles: 45200 },
  { name: 'Truck 02', vin: '2T1BURHE0JC049093', status: 'Inactive', miles: 32100 },
  { name: 'Van 01',   vin: '3VWFE21C04M000001', status: 'Active',   miles: 18700 },
  { name: 'Van 02',   vin: '4T1BF3EK9AU110011', status: 'Pending',  miles: 5600  },
  { name: 'Truck 03', vin: '5YJSA1CN5DFP10001', status: 'Active',   miles: 77800 },
];

const meta: Meta = {
  title: 'Data/Table',
  tags: ['autodocs'],
  argTypes: {
    loading:      { control: 'boolean' },
    emptyMessage: { control: 'text' },
  },
  args: { loading: false, emptyMessage: 'No results found.' },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const tableRef = createRef<HTMLElement>();
    return html`
      <div style="padding: 16px">
        <ds-table ${ref(el => {
          if (!el) return;
          const t = el as any;
          t.columns = columns;
          t.data = vehicles;
        })}></ds-table>
      </div>
    `;
  },
};

export const Loading: Story = {
  render: () => html`
    <div style="padding: 16px">
      <ds-table ${ref(el => {
        if (!el) return;
        const t = el as any;
        t.columns = columns;
        t.data = [];
        t.loading = true;
      })}></ds-table>
    </div>
  `,
};

export const Empty: Story = {
  render: () => html`
    <div style="padding: 16px">
      <ds-table ${ref(el => {
        if (!el) return;
        const t = el as any;
        t.columns = columns;
        t.data = [];
      })}></ds-table>
    </div>
  `,
};

export const WithPagination: Story = {
  render: () => {
    const bigData = Array.from({ length: 25 }, (_, i) => ({
      name: `Vehicle ${String(i + 1).padStart(2, '0')}`,
      vin: `1HGBH41JXMN${String(10000 + i)}`,
      status: i % 3 === 0 ? 'Inactive' : 'Active',
      miles: (i + 1) * 3700,
    }));
    return html`
      <div style="padding: 16px">
        <ds-table ${ref(el => {
          if (!el) return;
          const t = el as any;
          t.columns = columns;
          t.data = bigData;
          t.pageIndex = 0;
          t.pageSize = 10;
        })}></ds-table>
      </div>
    `;
  },
};

export const WithSorting: Story = {
  render: () => html`
    <div style="padding: 16px">
      <ds-table ${ref(el => {
        if (!el) return;
        const t = el as any;
        t.columns = columns;
        t.data = vehicles;
        t.sortState = { columnId: 'miles', direction: 'desc' };
      })}></ds-table>
    </div>
  `,
};

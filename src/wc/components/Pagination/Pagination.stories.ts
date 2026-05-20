import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-pagination.js';

const meta: Meta = {
  title: 'Data/Pagination',
  tags: ['autodocs'],
  argTypes: {
    page:         { control: 'number' },
    totalPages:   { control: 'number' },
    siblingCount: { control: 'number' },
    inactive:     { control: 'boolean' },
  },
  args: { page: 5, totalPages: 20, siblingCount: 1, inactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="padding: 16px">
      <ds-pagination
        page=${args['page'] ?? 5}
        total-pages=${args['totalPages'] ?? 20}
        sibling-count=${args['siblingCount'] ?? 1}
        ?inactive=${args['inactive'] ?? false}
      ></ds-pagination>
    </div>
  `,
};

export const FewPages: Story = {
  render: () => html`
    <div style="padding: 16px">
      <ds-pagination page="2" total-pages="4"></ds-pagination>
    </div>
  `,
};

export const ManyPages: Story = {
  render: () => html`
    <div style="padding: 16px">
      <ds-pagination page="10" total-pages="50"></ds-pagination>
    </div>
  `,
};

export const Inactive: Story = {
  render: () => html`
    <div style="padding: 16px">
      <ds-pagination page="3" total-pages="10" ?inactive=${true}></ds-pagination>
    </div>
  `,
};

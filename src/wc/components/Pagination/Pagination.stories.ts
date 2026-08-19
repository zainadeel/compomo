import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-pagination.js';
import type { PaginationChangeDetail } from './pagination-types';

const meta: Meta = {
  title: 'Navigation/Pagination',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A controlled pagination surface for application-owned data windows. It reports page and page-size intent without fetching or slicing data.',
      },
    },
  },
  args: {
    pageIndex: 0,
    pageSize: 25,
    totalItems: 500,
    loading: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <ds-pagination
        .pageIndex=${args['pageIndex']}
        .pageSize=${args['pageSize']}
        .totalItems=${args['totalItems']}
        .loading=${args['loading']}
        page-size-label="Rows"
        fit-to-page
        fit-page-size="8"
        item-label="rows"
        label="Table pagination"
        @dsChange=${(event: CustomEvent<PaginationChangeDetail>) =>
          updateArgs({ pageIndex: event.detail.pageIndex, pageSize: event.detail.pageSize })}
      ></ds-pagination>
    `;
  },
};

export const Outcomes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Zero results, a partial final page, and an in-progress page request retain one stable navigation surface.',
      },
    },
  },
  render: () => html`
    <div style="display:grid;gap:var(--dimension-space-300);">
      <ds-pagination total-items="0" page-size-label="Rows" item-label="rows"></ds-pagination>
      <ds-pagination page-index="2" page-size="25" total-items="63" page-size-label="Rows" item-label="rows"></ds-pagination>
      <ds-pagination page-index="1" page-size="25" total-items="500" loading page-size-label="Groups" item-label="groups"></ds-pagination>
    </div>
  `,
};

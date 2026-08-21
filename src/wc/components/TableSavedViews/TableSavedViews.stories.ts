import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-table-saved-views.js';

const meta: Meta = {
  title: 'Data display/Table saved views',
  component: 'ds-table-saved-views',
  parameters: {
    docs: {
      description: {
        component: 'A controlled saved-views companion control for table toolbars. It owns selection, create, rename, remove, validation, and focus UX while the application owns each view payload and persistence.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SavedViews: Story = {
  render: () => {
    const views = [
      { id: 'attention', label: 'Needs attention' },
      { id: 'west', label: 'West region' },
    ];
    return html`
      <ds-table-saved-views
        .views=${views}
        value="attention"
        dirty
        @dsViewChange=${(event: CustomEvent<{ viewId: string }>) => {
          (event.currentTarget as HTMLElement & { value: string }).value = event.detail.viewId;
        }}
        @dsViewCreate=${(event: CustomEvent<{ name: string }>) => {
          const control = event.currentTarget as HTMLElement & {
            views: typeof views;
            value: string;
          };
          const id = event.detail.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-');
          control.views = [...control.views, { id, label: event.detail.name }];
          control.value = id;
        }}
        @dsViewRename=${(event: CustomEvent<{ viewId: string; name: string }>) => {
          const control = event.currentTarget as HTMLElement & { views: typeof views };
          control.views = control.views.map(view =>
            view.id === event.detail.viewId ? { ...view, label: event.detail.name } : view,
          );
        }}
        @dsViewRemove=${(event: CustomEvent<{ viewId: string }>) => {
          const control = event.currentTarget as HTMLElement & {
            views: typeof views;
            value: string;
          };
          control.views = control.views.filter(view => view.id !== event.detail.viewId);
          if (control.value === event.detail.viewId) control.value = '__default__';
        }}
        @dsViewSave=${(event: CustomEvent<{ viewId: string }>) => {
          (event.currentTarget as HTMLElement & { dirty: boolean }).dirty = false;
        }}
        @dsViewDiscard=${(event: CustomEvent<{ viewId: string }>) => {
          (event.currentTarget as HTMLElement & { dirty: boolean }).dirty = false;
        }}
      ></ds-table-saved-views>
    `;
  },
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-modal.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-text.js';

const meta: Meta = {
  title: 'Overlay/Modal',
  argTypes: {
    heading: { control: 'text' },
    modalWidth: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: { heading: 'Save changes?', modalWidth: 'md' },
};

export default meta;
type Story = StoryObj;

const closeOwningModal = (event: CustomEvent<MouseEvent>) => {
  const trigger = event.currentTarget as HTMLElement | null;
  const modal = trigger?.closest('ds-modal') as HTMLDsModalElement | null;
  if (modal) modal.open = false;
};

export const Playground: Story = {
  render: args => html`
    <ds-modal
      ?open=${true}
      heading=${args['heading'] ?? 'Save changes?'}
      modal-width=${args['modalWidth'] ?? 'md'}
      aria-describedby="modal-playground-description"
    >
      <ds-text
        as="p"
        variant="text-body-medium"
        color="secondary"
        text-id="modal-playground-description"
      >
        Save these changes to make them available to everyone with access.
      </ds-text>
      <ds-button-filled
        slot="footer"
        variant="label"
        label="Save"
        intent="brand"
        contrast="bold"
        @dsClick=${closeOwningModal}
      ></ds-button-filled>
      <ds-button-unfilled
        slot="footer"
        variant="label"
        label="Cancel"
        has-border
        @dsClick=${closeOwningModal}
      ></ds-button-unfilled>
    </ds-modal>
  `,
};

export const DeleteConfirmation: Story = {
  render: () => html`
    <ds-modal
      ?open=${true}
      heading="Delete vehicle?"
      aria-describedby="modal-delete-description"
    >
      <ds-text
        as="p"
        variant="text-body-medium"
        color="secondary"
        text-id="modal-delete-description"
      >
        This action cannot be undone. The vehicle and its associated data will be permanently removed.
      </ds-text>
      <ds-button-filled
        slot="footer"
        variant="label"
        label="Delete"
        intent="negative"
        contrast="bold"
        @dsClick=${closeOwningModal}
      ></ds-button-filled>
      <ds-button-unfilled
        slot="footer"
        variant="label"
        label="Cancel"
        has-border
        @dsClick=${closeOwningModal}
      ></ds-button-unfilled>
    </ds-modal>
  `,
};

export const LeaveConfirmation: Story = {
  render: () => html`
    <ds-modal
      ?open=${true}
      heading="Leave this page?"
      modal-width="sm"
      aria-describedby="modal-leave-description"
    >
      <ds-text
        as="p"
        variant="text-body-medium"
        color="secondary"
        text-id="modal-leave-description"
      >
        Your unsaved changes will remain available until you return.
      </ds-text>
      <ds-button-filled
        slot="footer"
        variant="label"
        label="Keep editing"
        intent="brand"
        contrast="bold"
        @dsClick=${closeOwningModal}
      ></ds-button-filled>
      <ds-button-unfilled
        slot="footer"
        variant="label"
        label="Leave"
        has-border
        @dsClick=${closeOwningModal}
      ></ds-button-unfilled>
    </ds-modal>
  `,
};

export const WithoutFooter: Story = {
  render: () => html`
    <ds-modal
      ?open=${true}
      heading="Vehicle update"
      aria-describedby="modal-update-description"
    >
      <ds-text
        as="p"
        variant="text-body-medium"
        color="secondary"
        text-id="modal-update-description"
      >
        Vehicle details were updated successfully. You can close this message when you are ready.
      </ds-text>
    </ds-modal>
  `,
};

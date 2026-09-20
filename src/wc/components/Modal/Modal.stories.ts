import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-modal.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-text.js';

const meta: Meta = {
  title: 'Overlay/Modal',
  argTypes: {
    heading: { control: 'text' },
    description: { control: 'text' },
    modalWidth: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    heading: 'Save changes?',
    description: 'Review the impact before continuing.',
    modalWidth: 'md',
  },
};

export default meta;
type Story = StoryObj;

export const Reconnection: Story = {
  render: () => {
    let modal: HTMLDsModalElement | undefined;
    const reinsert = () => {
      const parent = modal?.parentElement;
      if (!modal || !parent) return;
      modal.remove();
      parent.append(modal);
    };
    return html`
      <div style="display:grid;gap:var(--dimension-space-200);">
        <ds-text as="p" variant="text-body-small" color="secondary">
          Open the dialog, then reinsert it. It should reopen with the same content. Escape and
          Close should still dismiss it.
        </ds-text>
        <ds-button-unfilled
          label="Open dialog"
          @dsClick=${() => {
            if (modal) modal.open = true;
          }}
        ></ds-button-unfilled>
        <ds-modal
          heading="Retained dialog"
          ${ref(element => {
            modal = element as HTMLDsModalElement | undefined;
          })}
        >
          <ds-text as="p" variant="text-body-medium" color="secondary">
            The application still has open set to true when this dialog is reinserted.
          </ds-text>
          <ds-button-unfilled
            slot="footer"
            label="Reinsert dialog"
            has-border
            @dsClick=${reinsert}
          ></ds-button-unfilled>
        </ds-modal>
      </div>
    `;
  },
};

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
      description=${args['description'] ?? ''}
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

export const HeaderDescription: Story = {
  render: () => html`
    <ds-modal
      ?open=${true}
      heading="Connection interrupted"
      description="Your changes remain available on this device."
      modal-width="sm"
    >
      <ds-text as="p" variant="text-body-medium" color="secondary">
        Retry when the network connection is restored.
      </ds-text>
    </ds-modal>
  `,
};

export const DeleteConfirmation: Story = {
  render: () => html`
    <ds-modal ?open=${true} heading="Delete vehicle?" aria-describedby="modal-delete-description">
      <ds-text
        as="p"
        variant="text-body-medium"
        color="secondary"
        text-id="modal-delete-description"
      >
        This action cannot be undone. The vehicle and its associated data will be permanently
        removed.
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
    <ds-modal ?open=${true} heading="Vehicle update" aria-describedby="modal-update-description">
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

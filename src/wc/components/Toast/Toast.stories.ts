import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { createToastManager, type ToastManager } from '../../toast';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-toast.js';

const meta: Meta = {
  title: 'Overlay/Toast',
  tags: ['autodocs'],
  argTypes: {
    limit: { control: { type: 'number', min: 1 } },
    timeout: { control: 'text' },
    label: { control: 'text' },
  },
  args: {
    limit: 3,
    timeout: 'var(--effect-animation-delay-long-2)',
    label: 'Notifications',
  },
};

export default meta;
type Story = StoryObj;

function connectToast(
  element: HTMLDsToastElement | undefined,
  manager: ToastManager,
  seed: () => void,
) {
  if (!element) return;
  element.manager = manager;
  if (element.dataset['seeded'] === 'true') return;
  element.dataset['seeded'] = 'true';
  seed();
}

const basicManager = createToastManager();
const actionManager = createToastManager();
const stackManager = createToastManager();
const promiseManager = createToastManager();
const priorityManager = createToastManager();
const persistentManager = createToastManager();
const anchoredManager = createToastManager();

export const Playground: Story = {
  render: args => html`
    <ds-toast
      limit=${args['limit']}
      timeout=${args['timeout']}
      label=${args['label']}
      ${ref(element =>
        connectToast(element as HTMLDsToastElement | undefined, basicManager, () => {
          basicManager.add({
            id: 'playground',
            title: 'Settings saved',
            description: 'Your changes are now available to everyone.',
            timeout: 0,
          });
        }))}
    ></ds-toast>
  `,
};

export const WithAction: Story = {
  render: () => html`
    <ds-toast
      ${ref(element =>
        connectToast(element as HTMLDsToastElement | undefined, actionManager, () => {
          actionManager.add({
            id: 'archived',
            title: 'Conversation archived',
            description: 'This conversation was moved out of your inbox.',
            timeout: 0,
            action: {
              label: 'Undo',
              onAction: ({ id, manager }) => {
                manager.update(id, {
                  title: 'Conversation restored',
                  description: 'The conversation is back in your inbox.',
                  action: undefined,
                });
              },
            },
          });
        }))}
    ></ds-toast>
  `,
};

export const StackedAndLimited: Story = {
  render: () => html`
    <ds-toast
      .limit=${3}
      ${ref(element =>
        connectToast(element as HTMLDsToastElement | undefined, stackManager, () => {
          for (let index = 1; index <= 5; index += 1) {
            stackManager.add({
              id: `stack-${index}`,
              title: `Alert ${index}`,
              description: `This is stacked alert ${index}; hover to expand the visible stack.`,
              timeout: 0,
            });
          }
        }))}
    ></ds-toast>
  `,
};

export const PromiseStates: Story = {
  render: () => html`
    <ds-toast
      ${ref(element =>
        connectToast(element as HTMLDsToastElement | undefined, promiseManager, () => {
          void promiseManager.promise(new Promise(() => undefined), {
            loading: {
              id: 'promise-demo',
              title: 'Uploading report',
              description: 'Keep this window open while the report uploads.',
            },
            success: 'Report uploaded.',
            error: 'The report could not be uploaded.',
          });
        }))}
    ></ds-toast>
  `,
};

export const HighPriority: Story = {
  render: () => html`
    <ds-toast
      ${ref(element =>
        connectToast(element as HTMLDsToastElement | undefined, priorityManager, () => {
          priorityManager.add({
            id: 'connection-lost',
            title: 'Connection lost',
            description: 'Changes will sync when the connection returns.',
            priority: 'high',
            timeout: 0,
          });
        }))}
    ></ds-toast>
  `,
};

export const Persistent: Story = {
  render: () => html`
    <ds-toast
      ${ref(element =>
        connectToast(element as HTMLDsToastElement | undefined, persistentManager, () => {
          persistentManager.add({
            id: 'persistent',
            title: 'Update available',
            description: 'Dismiss this notification when you are ready.',
            timeout: 0,
          });
        }))}
    ></ds-toast>
  `,
};

export const Anchored: Story = {
  render: () => html`
    <div style="min-height:var(--dimension-size-1600);padding:var(--dimension-space-400);">
      <ds-button-filled
        id="copy-trigger"
        variant="label"
        label="Copy link"
        @dsClick=${() => {
          anchoredManager.add({
            id: 'copied',
            description: 'Link copied.',
            timeout: 0,
            positioner: {
              anchor: 'copy-trigger',
              side: 'top',
              align: 'center',
              sideOffset: 'var(--dimension-space-100)',
            },
          });
        }}
      ></ds-button-filled>
      <ds-toast
        ${ref(element =>
          connectToast(element as HTMLDsToastElement | undefined, anchoredManager, () => {
            anchoredManager.add({
              id: 'copied',
              description: 'Link copied.',
              timeout: 0,
              positioner: {
                anchor: 'copy-trigger',
                side: 'top',
                align: 'center',
                sideOffset: 'var(--dimension-space-100)',
              },
            });
          }))}
      ></ds-toast>
    </div>
  `,
};

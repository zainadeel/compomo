import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-toast-provider.js';
import '../../../../dist/components/ds-button-filled.js';

const meta: Meta = {
  title: 'Overlay/Toast',
  tags: ['autodocs'],
  argTypes: {
    position: { control: 'select', options: ['top-center', 'top-right', 'bottom-center', 'bottom-right'] },
  },
  args: { position: 'top-center' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-toast-provider id="toast-provider" position=${args['position'] ?? 'top-center'}></ds-toast-provider>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; padding: 16px">
      <ds-button-filled variant="icon" id="toast-neutral" icon="Bell" intent="neutral" aria-label="Show neutral"></ds-button-filled>
      <ds-button-filled variant="icon" id="toast-success" icon="Check" intent="positive" aria-label="Show success"></ds-button-filled>
      <ds-button-filled variant="icon" id="toast-error" icon="Cross" intent="negative" aria-label="Show error"></ds-button-filled>
      <ds-button-filled variant="icon" id="toast-warning" icon="Warning" intent="warning" aria-label="Show warning"></ds-button-filled>
    </div>
    <script type="module">
      import { toast } from '/src/wc/components/Toast/toast-service.ts';
      document.getElementById('toast-neutral')?.addEventListener('click', () => toast.info('Neutral notification'));
      document.getElementById('toast-success')?.addEventListener('click', () => toast.success('Operation completed!'));
      document.getElementById('toast-error')?.addEventListener('click',   () => toast.error('Something went wrong'));
      document.getElementById('toast-warning')?.addEventListener('click', () => toast.warning('Please review before continuing'));
    </script>
  `,
};

export const AllIntents: Story = {
  render: () => html`
    <ds-toast-provider id="intents-provider" position="top-center"></ds-toast-provider>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; padding: 16px">
      <ds-button-filled variant="icon" id="t-neutral" icon="Bell" intent="neutral" aria-label="Neutral"></ds-button-filled>
      <ds-button-filled variant="icon" id="t-brand" icon="Bell" intent="brand" aria-label="Brand"></ds-button-filled>
      <ds-button-filled variant="icon" id="t-positive" icon="Check" intent="positive" aria-label="Positive"></ds-button-filled>
      <ds-button-filled variant="icon" id="t-negative" icon="Cross" intent="negative" aria-label="Negative"></ds-button-filled>
      <ds-button-filled variant="icon" id="t-warning" icon="Warning" intent="warning" aria-label="Warning"></ds-button-filled>
      <ds-button-filled variant="icon" id="t-caution" icon="Warning" intent="caution" aria-label="Caution"></ds-button-filled>
    </div>
    <script type="module">
      import { toast } from '/src/wc/components/Toast/toast-service.ts';
      document.getElementById('t-neutral')?.addEventListener('click',  () => toast.show({ message: 'Neutral toast', intent: 'neutral' }));
      document.getElementById('t-brand')?.addEventListener('click',    () => toast.show({ message: 'Brand toast', intent: 'brand' }));
      document.getElementById('t-positive')?.addEventListener('click', () => toast.show({ message: 'Success toast', intent: 'positive' }));
      document.getElementById('t-negative')?.addEventListener('click', () => toast.show({ message: 'Error toast', intent: 'negative' }));
      document.getElementById('t-warning')?.addEventListener('click',  () => toast.show({ message: 'Warning toast', intent: 'warning' }));
      document.getElementById('t-caution')?.addEventListener('click',  () => toast.show({ message: 'Caution toast', intent: 'caution' }));
    </script>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-toast-provider.js';
import '../../../../dist/components/ds-button.js';

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
      <ds-button id="toast-neutral" label="Show neutral" variant="secondary"></ds-button>
      <ds-button id="toast-success" label="Show success" intent="positive" variant="secondary"></ds-button>
      <ds-button id="toast-error"   label="Show error"   intent="negative" variant="secondary"></ds-button>
      <ds-button id="toast-warning" label="Show warning" intent="warning"  variant="secondary"></ds-button>
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
      <ds-button id="t-neutral"  label="Neutral"  variant="secondary"></ds-button>
      <ds-button id="t-brand"    label="Brand"    intent="brand"    variant="secondary"></ds-button>
      <ds-button id="t-positive" label="Positive" intent="positive" variant="secondary"></ds-button>
      <ds-button id="t-negative" label="Negative" intent="negative" variant="secondary"></ds-button>
      <ds-button id="t-warning"  label="Warning"  intent="warning"  variant="secondary"></ds-button>
      <ds-button id="t-caution"  label="Caution"  intent="caution"  variant="secondary"></ds-button>
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

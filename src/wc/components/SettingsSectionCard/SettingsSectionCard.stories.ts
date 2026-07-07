import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-settings-section-card.js';

const meta: Meta = {
  title: 'Layout/SettingsSectionCard',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    editing: { control: 'boolean' },
  },
  args: {
    heading: 'General',
    cardWidth: 'md',
    editing: false,
  },
};

export default meta;
type Story = StoryObj;

export const View: Story = {
  render: args => html`
    <ds-settings-section-card
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      ?editing=${args['editing']}
    ></ds-settings-section-card>
  `,
};

export const Edit: Story = {
  args: { editing: true },
  render: args => html`
    <ds-settings-section-card
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      ?editing=${true}
    ></ds-settings-section-card>
  `,
};

export const Interactive: Story = {
  render: () => html`
    <div id="settings-card-demo" style="display:flex;flex-direction:column;gap:var(--dimension-space-400);"></div>
    <script type="module">
      const root = document.getElementById('settings-card-demo');
      if (!root) throw new Error('missing demo root');

      let editingId = null;
      const cards = [
        { id: 'general', heading: 'General' },
        { id: 'driver-identification', heading: 'Driver Identification' },
        { id: 'custom-map-layers', heading: 'Custom Map Layers' },
      ];

      const render = () => {
        root.replaceChildren();
        for (const card of cards) {
          const el = document.createElement('ds-settings-section-card');
          el.heading = card.heading;
          el.editing = editingId === card.id;
          el.addEventListener('dsEditingChange', (event) => {
            editingId = event.detail ? card.id : null;
            render();
          });
          root.appendChild(el);
        }
      };

      render();
    </script>
  `,
};

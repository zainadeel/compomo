import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-setting.js';

const meta: Meta = {
  title: 'Layout/CardSetting',
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
    <ds-card-setting
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      ?editing=${args['editing']}
    ></ds-card-setting>
  `,
};

export const Edit: Story = {
  args: { editing: true },
  render: args => html`
    <ds-card-setting
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      ?editing=${true}
    ></ds-card-setting>
  `,
};

export const Interactive: Story = {
  render: () => html`
    <div id="card-setting-demo" style="display:flex;flex-direction:column;gap:var(--dimension-space-400);"></div>
    <script type="module">
      const root = document.getElementById('card-setting-demo');
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
          const el = document.createElement('ds-card-setting');
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

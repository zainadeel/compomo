import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-setting.js';
import '../../../../dist/components/ds-text.js';
import type { CardSettingActionDetail } from './CardSetting';

const WIDTHS = ['sm', 'md', 'lg'] as const;

const meta: Meta = {
  title: 'Layout/CardSetting',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    cardWidth: { control: 'select', options: [...WIDTHS] },
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

const handleControlledAction = (event: CustomEvent<CardSettingActionDetail>) => {
  const card = event.currentTarget as HTMLDsCardSettingElement;
  card.editing = event.detail.action === 'edit';
};

const handleSingleEditAction = (event: CustomEvent<CardSettingActionDetail>) => {
  const activeCard = event.currentTarget as HTMLDsCardSettingElement;
  const cards = activeCard.parentElement?.querySelectorAll<HTMLDsCardSettingElement>(
    'ds-card-setting'
  );
  if (event.detail.action === 'edit') {
    cards?.forEach(card => {
      card.editing = card === activeCard;
    });
  } else {
    activeCard.editing = false;
  }
};

const settingsBody = (copy: string) => html`
  <div style="padding:var(--dimension-space-200);">
    <ds-text as="p" variant="text-body-medium" color="secondary">${copy}</ds-text>
  </div>
`;

export const View: Story = {
  render: args => html`
    <ds-card-setting
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      ?editing=${args['editing']}
      @dsAction=${handleControlledAction}
    >
      ${settingsBody('Review and manage the settings for this section.')}
    </ds-card-setting>
  `,
};

export const Edit: Story = {
  args: { editing: true },
  render: args => html`
    <ds-card-setting
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      ?editing=${true}
      @dsAction=${handleControlledAction}
    >
      ${settingsBody('Update the section values, then save or cancel your changes.')}
    </ds-card-setting>
  `,
};

/** Side-by-side sm / md / lg — only one section may enter edit mode at a time. */
export const Widths: Story = {
  parameters: { controls: { exclude: ['cardWidth'] } },
  render: args => html`
    <div
      style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--dimension-space-300);"
    >
      ${WIDTHS.map(
        width => html`
          <ds-card-setting
            heading=${`${args['heading']} (${width})`}
            card-width=${width}
            edit-label=${`Edit ${args['heading']} ${width}`}
            cancel-label=${`Cancel ${args['heading']} ${width}`}
            save-label=${`Save ${args['heading']} ${width}`}
            ?editing=${args['editing']}
            @dsAction=${handleSingleEditAction}
          >
            ${settingsBody(`Settings content at the ${width} card width.`)}
          </ds-card-setting>
        `,
      )}
    </div>
  `,
};

export const Interactive: Story = {
  render: () => html`
    <div
      id="card-setting-demo"
      style="display:flex;flex-direction:column;gap:var(--dimension-space-400);"
    >
      ${[
        ['General', 'Configure the organization name and default preferences.'],
        ['Driver identification', 'Choose how drivers identify themselves in vehicles.'],
        ['Custom map layers', 'Control which custom map data is available to users.'],
      ].map(
        ([heading, copy]) => html`
          <ds-card-setting
            heading=${heading}
            edit-label=${`Edit ${heading}`}
            cancel-label=${`Cancel ${heading}`}
            save-label=${`Save ${heading}`}
            @dsAction=${handleSingleEditAction}
          >
            ${settingsBody(copy)}
          </ds-card-setting>
        `,
      )}
    </div>
  `,
};

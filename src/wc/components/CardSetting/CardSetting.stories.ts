import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-setting.js';
import '../../../../dist/components/ds-inline-banner-settings.js';
import '../../../../dist/components/ds-text.js';
import '../../../../dist/components/ds-setting-row-toggle.js';
import type { CardSettingActionDetail } from './CardSetting';

const WIDTHS = ['sm', 'md', 'lg'] as const;

const meta: Meta = {
  title: 'Cards/CardSetting',
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
  const cards =
    activeCard.parentElement?.querySelectorAll<HTMLDsCardSettingElement>('ds-card-setting');
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
    <div style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:var(--dimension-space-300);">
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
        `
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
        `
      )}
    </div>
  `,
};

/** Empty editable cards keep the width-matched minimum height. */
export const Empty: Story = {
  render: args => html`
    <ds-card-setting
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      @dsAction=${handleControlledAction}
    ></ds-card-setting>
  `,
};

/** Informational copy sits above the padded content body and does not inherit that padding. */
export const WithBanner: Story = {
  render: args => html`
    <ds-card-setting
      heading=${args['heading']}
      card-width=${args['cardWidth']}
      @dsAction=${handleControlledAction}
    >
      <ds-inline-banner-settings
        slot="banner"
        description="Cloud review removes false positives before the setting is changed."
      ></ds-inline-banner-settings>
      ${settingsBody('Choose how events are validated.')}
    </ds-card-setting>
  `,
};

export const Immediate: Story = {
  render: () => html`
    <ds-card-setting heading="Interface preferences" variant="immediate">
      <div role="list" aria-label="Interface preferences">
        <ds-setting-row-toggle
          role="listitem"
          label="Panel navigation"
          description="Show page sections in the side panel. Turn off to use top bar tabs."
          checked
          @dsChange=${(event: CustomEvent<boolean>) => {
            (event.currentTarget as HTMLDsSettingRowToggleElement).checked = event.detail;
          }}
        ></ds-setting-row-toggle>
        <ds-setting-row-toggle
          role="listitem"
          label="Configuration menus"
          description="Open view settings in menus. Turn off to use a side panel."
          checked
          @dsChange=${(event: CustomEvent<boolean>) => {
            (event.currentTarget as HTMLDsSettingRowToggleElement).checked = event.detail;
          }}
        ></ds-setting-row-toggle>
      </div>
    </ds-card-setting>
  `,
};

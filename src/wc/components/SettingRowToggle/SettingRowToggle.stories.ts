import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-setting-row-toggle.js';

const meta: Meta = {
  title: 'Settings/SettingRowToggle',
  component: 'ds-setting-row-toggle',
  tags: ['autodocs'],
  args: {
    label: 'Panel navigation',
    description: 'Show page sections in the side panel. Turn off to use top bar tabs.',
    checked: true,
    disabled: false,
    variant: 'emphasis',
  },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: args => html`
    <ds-setting-row-toggle
      label=${args['label']}
      description=${args['description']}
      .checked=${args['checked']}
      .disabled=${args['disabled']}
      .variant=${args['variant']}
      @dsChange=${(event: CustomEvent<boolean>) => {
        (event.currentTarget as HTMLDsSettingRowToggleElement).checked = event.detail;
      }}
    ></ds-setting-row-toggle>
  `,
};

export const Off: Story = { ...Default, args: { checked: false } };
export const Disabled: Story = { ...Default, args: { disabled: true } };
export const NonEmphasis: Story = {
  ...Default,
  args: { variant: 'non-emphasis' },
  render: args => html`
    <ds-setting-row-toggle
      label=${args['label']}
      description=${args['description']}
      .checked=${args['checked']}
      .disabled=${args['disabled']}
      variant="non-emphasis"
      @dsChange=${(event: CustomEvent<boolean>) => {
        (event.currentTarget as HTMLDsSettingRowToggleElement).checked = event.detail;
      }}
    ></ds-setting-row-toggle>
  `,
};
export const Narrow: Story = {
  render: () => html`
    <div style="width:var(--dimension-card-width-xs);max-width:100%;">
      <ds-setting-row-toggle
        label="Configuration menus with a longer setting name"
        description="Open filters and view settings in menus. Turn off to use a configuration panel beside the page."
        checked
      ></ds-setting-row-toggle>
    </div>
  `,
};

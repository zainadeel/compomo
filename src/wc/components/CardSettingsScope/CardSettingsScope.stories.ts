import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { useArgs } from 'storybook/preview-api';
import type { SettingsScopeRequest } from './CardSettingsScope';
import type { MenuItemData } from '../Menu/menu-types';
import '../../../../dist/components/ds-card-settings-scope.js';
import '../../../../dist/components/ds-menu.js';

const meta: Meta = {
  title: 'Cards/CardSettingsScope',
  tags: ['autodocs'],
  args: {
    areaLabel: 'All settings',
    profileLabel: 'Organization',
    openScope: null,
    anchor: undefined,
  },
  argTypes: { openScope: { table: { disable: true } }, anchor: { table: { disable: true } } },
};
export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <ds-card-settings-scope
        area-label=${args['areaLabel']}
        profile-label=${args['profileLabel']}
        area-controls="scope-area-menu"
        profile-controls="scope-profile-menu"
        profile-popup="dialog"
        .areaExpanded=${args['openScope'] === 'area'}
        .profileExpanded=${args['openScope'] === 'profile'}
        @dsScopeRequest=${(event: CustomEvent<SettingsScopeRequest>) =>
          updateArgs({
            openScope: args['openScope'] === event.detail.scope ? null : event.detail.scope,
            anchor: event.detail.anchor,
            initialFocusVisible: event.detail.originalEvent.detail === 0,
          })}
      ></ds-card-settings-scope>
      <ds-menu
        id="scope-area-menu"
        menu-label="Product area"
        selection-mode="single"
        .anchor=${args['anchor']}
        .open=${args['openScope'] === 'area'}
        .initialFocusVisible=${args['initialFocusVisible'] ?? false}
        .items=${['All settings', 'Safety', 'Tracking'].map(label => ({
          label,
          value: label,
          isSelected: args['areaLabel'] === label,
        }))}
        @dsClose=${() => updateArgs({ openScope: null })}
        @dsSelect=${(event: CustomEvent<MenuItemData>) => {
          updateArgs({ areaLabel: event.detail.label, openScope: null });
          (args['anchor'] as HTMLElement)?.focus();
        }}
      ></ds-menu>
      <ds-menu
        id="scope-profile-menu"
        menu-label="Settings profiles"
        .anchor=${args['anchor']}
        .open=${args['openScope'] === 'profile'}
        empty-message="You have no profiles to manage yet"
        @dsClose=${() => updateArgs({ openScope: null })}
      ></ds-menu>
    `;
  },
};

export const Narrow: Story = {
  render: () =>
    html`<div style="max-width:var(--dimension-card-width-sm)">
      <ds-card-settings-scope
        area-label="Unsafe behavior detection settings"
        profile-label="Western regional drivers"
      ></ds-card-settings-scope>
    </div>`,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-bar-nav-action.js';

const meta: Meta = {
  title: 'Navigation/BarNavAction',
  tags: ['autodocs'],
  argTypes: {
    icon:       { control: 'text' },
    selected:   { control: 'boolean' },
    dot:        { control: 'boolean' },
    inactive:   { control: 'boolean' },
    ariaLabel: { control: 'text' },
    background: { control: 'select', options: ['', 'medium', 'bold', 'strong', 'always-dark'] },
  },
  args: {
    icon: 'Bell',
    ariaLabel: 'Notifications',
    selected: false,
    dot: false,
    inactive: false,
    ariaLabel: 'Notifications',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-bar-nav-action
      icon=${args['icon']}
      ?selected=${args['selected']}
      ?dot=${args['dot']}
      ?inactive=${args['inactive']}
      aria-label=${args['ariaLabel']}
      background=${args['background'] || ''}
    ></ds-bar-nav-action>
  `,
};

export const AllActions: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--dimension-space-050);align-items:center;padding:var(--dimension-space-100)">
      <ds-bar-nav-action icon="MagnifyingGlass" aria-label="Go to / Search"></ds-bar-nav-action>
      <ds-bar-nav-action icon="Inbox"           aria-label="Inbox" dot></ds-bar-nav-action>
      <ds-bar-nav-action icon="AI"              aria-label="AI Assistant" dot></ds-bar-nav-action>
    </div>
  `,
};

export const Selected: Story = {
  render: () => html`
    <div style="display:flex;gap:var(--dimension-space-050);align-items:center;padding:var(--dimension-space-100)">
      <ds-bar-nav-action icon="MagnifyingGlass" aria-label="Search"        selected></ds-bar-nav-action>
      <ds-bar-nav-action icon="Inbox"           aria-label="Inbox"         selected dot></ds-bar-nav-action>
      <ds-bar-nav-action icon="AI"              aria-label="AI Assistant"  selected dot></ds-bar-nav-action>
    </div>
  `,
};

export const States: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;gap:var(--dimension-space-100);padding:var(--dimension-space-100)">
      <div style="display:flex;gap:var(--dimension-space-100);align-items:center">
        <span style="font-size:12px;width:80px;color:var(--color-foreground-secondary)">idle</span>
        <ds-bar-nav-action icon="Bell" aria-label="Bell"></ds-bar-nav-action>
        <ds-bar-nav-action icon="Bell" aria-label="Bell with dot" dot></ds-bar-nav-action>
      </div>
      <div style="display:flex;gap:var(--dimension-space-100);align-items:center">
        <span style="font-size:12px;width:80px;color:var(--color-foreground-secondary)">selected</span>
        <ds-bar-nav-action icon="Bell" aria-label="Bell selected"          selected></ds-bar-nav-action>
        <ds-bar-nav-action icon="Bell" aria-label="Bell selected with dot" selected dot></ds-bar-nav-action>
      </div>
      <div style="display:flex;gap:var(--dimension-space-100);align-items:center">
        <span style="font-size:12px;width:80px;color:var(--color-foreground-secondary)">inactive</span>
        <ds-bar-nav-action icon="Bell" aria-label="Bell inactive"          inactive></ds-bar-nav-action>
        <ds-bar-nav-action icon="Bell" aria-label="Bell inactive with dot" inactive dot></ds-bar-nav-action>
      </div>
    </div>
  `,
};

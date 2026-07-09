import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-button-unfilled-icon.js';

const meta: Meta = {
  title: 'Actions/ButtonUnfilledIcon',
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'text' },
    isActive: { control: 'boolean' },
    activeFill: { control: 'boolean' },
    hasBorder: { control: 'boolean' },
    dot: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    ariaLabel: { control: 'text' },
    backgroundContrast: {
      name: 'on-background-contrast',
      control: 'select',
      options: ['default', 'medium', 'bold', 'strong'],
    },
    background: {
      control: 'select',
      options: ['', 'always-dark', 'navigation'],
    },
  },
  args: {
    icon: 'Bell',
    ariaLabel: 'Notifications',
    isActive: false,
    activeFill: true,
    hasBorder: false,
    dot: false,
    isInactive: false,
    backgroundContrast: 'default',
    background: '',
  },
};

export default meta;
type Story = StoryObj;

const ROW = 'display:flex;gap:var(--dimension-space-100);align-items:center;flex-wrap:wrap;';
const COL = 'display:flex;flex-direction:column;gap:var(--dimension-space-150);align-items:flex-start;';
const LABEL =
  'min-width:128px;color:var(--color-foreground-tertiary);font:var(--typography-text-caption-font);';
const SURFACE =
  'display:flex;gap:var(--dimension-space-100);align-items:center;padding:var(--dimension-space-150);border-radius:var(--dimension-radius-100);';

export const Playground: Story = {
  render: args => html`
    <ds-button-unfilled-icon
      icon=${args['icon']}
      ?is-active=${args['isActive']}
      ?active-fill=${args['activeFill']}
      ?has-border=${args['hasBorder']}
      ?dot=${args['dot']}
      ?is-inactive=${args['isInactive']}
      aria-label=${args['ariaLabel']}
      on-background-contrast=${args['backgroundContrast']}
      background=${args['background'] || ''}
    ></ds-button-unfilled-icon>
  `,
};

export const States: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LABEL}">idle</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Notifications"></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Inbox" aria-label="Inbox" dot></ds-button-unfilled-icon>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">active with fill</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Notifications active" is-active></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Inbox" aria-label="Inbox active" is-active dot></ds-button-unfilled-icon>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">active no fill</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Notifications active" is-active .activeFill=${false}></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Inbox" aria-label="Inbox active" is-active .activeFill=${false} dot></ds-button-unfilled-icon>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">bordered</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Notifications bordered" has-border></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Bell" aria-label="Notifications bordered active" has-border is-active></ds-button-unfilled-icon>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">inactive</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Notifications inactive" is-inactive></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Inbox" aria-label="Inbox inactive" is-inactive dot></ds-button-unfilled-icon>
      </div>
    </div>
  `,
};

export const ActiveFillLayering: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LABEL}">active base fill</span>
        <ds-button-unfilled-icon icon="Search" aria-label="Search" is-active></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Ellipses" aria-label="More" is-active></ds-button-unfilled-icon>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">shell style</span>
        <ds-button-unfilled-icon icon="Search" aria-label="Search" is-active .activeFill=${false}></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Ellipses" aria-label="More" is-active .activeFill=${false}></ds-button-unfilled-icon>
      </div>
    </div>
  `,
};

export const FocusVisible: Story = {
  render: () => html`
    <p style="color:var(--color-foreground-secondary);font:var(--typography-text-caption-font);max-width:36rem;">
      Tab to each button — focus ring should use TokoMo interaction tokens, not the browser default blue outline.
    </p>
    <div style="${COL} margin-top:var(--dimension-space-150);">
      <div style="${ROW}">
        <span style="${LABEL}">default</span>
        <ds-button-unfilled-icon icon="Search" aria-label="Search"></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Ellipses" aria-label="More" background="navigation"></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Gear" aria-label="Settings" has-border></ds-button-unfilled-icon>
      </div>
    </div>
  `,
};

export const Backgrounds: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${SURFACE}background:var(--color-background-primary);">
        <span style="${LABEL}">default</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell"></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell active" is-active></ds-button-unfilled-icon>
      </div>
      <div style="${SURFACE}background:var(--color-background-medium-neutral);">
        <span style="${LABEL}">medium</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell" on-background-contrast="medium"></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell active" on-background-contrast="medium" is-active></ds-button-unfilled-icon>
      </div>
      <div style="${SURFACE}background:var(--color-background-bold-neutral);">
        <span style="${LABEL}">bold</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell" on-background-contrast="bold"></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell active" on-background-contrast="bold" is-active></ds-button-unfilled-icon>
      </div>
      <div style="${SURFACE}background:var(--color-background-strong-neutral);">
        <span style="${LABEL}">strong</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell" on-background-contrast="strong"></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell active" on-background-contrast="strong" is-active></ds-button-unfilled-icon>
      </div>
      <div style="${SURFACE}background:var(--color-navigation-background);">
        <span style="${LABEL}">navigation</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell" background="navigation"></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell active" background="navigation" is-active></ds-button-unfilled-icon>
      </div>
      <div style="${SURFACE}background:var(--color-always-dark-background);">
        <span style="${LABEL}">always dark</span>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell" background="always-dark"></ds-button-unfilled-icon>
        <ds-button-unfilled-icon icon="Bell" aria-label="Bell active" background="always-dark" is-active></ds-button-unfilled-icon>
      </div>
    </div>
  `,
};

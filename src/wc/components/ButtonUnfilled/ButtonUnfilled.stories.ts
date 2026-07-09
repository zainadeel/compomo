import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-button-unfilled.js';

const VARIANTS = ['label', 'icon', 'icon-label'] as const;
const SIZES = ['md', 'sm', 'xs'] as const;
const WIDTHS = ['hug', 'fill'] as const;

const meta: Meta = {
  title: 'Primitives/ButtonUnfilled',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: [...VARIANTS] },
    size: { control: 'select', options: [...SIZES] },
    width: { control: 'select', options: [...WIDTHS] },
    label: { control: 'text' },
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
    variant: 'label',
    size: 'md',
    width: 'hug',
    label: 'Action',
    icon: 'Bell',
    ariaLabel: '',
    isActive: false,
    activeFill: true,
    hasBorder: true,
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
    <ds-button-unfilled
      variant=${args['variant']}
      size=${args['size']}
      width=${args['width']}
      label=${args['label']}
      icon=${args['icon']}
      ?is-active=${args['isActive']}
      ?active-fill=${args['activeFill']}
      ?has-border=${args['hasBorder']}
      ?dot=${args['dot']}
      ?is-inactive=${args['isInactive']}
      aria-label=${args['ariaLabel'] || undefined}
      on-background-contrast=${args['backgroundContrast']}
      background=${args['background'] || ''}
    ></ds-button-unfilled>
  `,
};

export const VariantsAndSizes: Story = {
  render: () => html`
    <div style="${COL}">
      ${VARIANTS.map(
        variant => html`
          <div style="${ROW}">
            <span style="${LABEL}">${variant}</span>
            ${SIZES.map(
              size => html`
                <ds-button-unfilled
                  variant=${variant}
                  size=${size}
                  label="Action"
                  icon="Bell"
                  aria-label=${variant === 'icon' ? `Action ${size}` : undefined}
                ></ds-button-unfilled>
              `,
            )}
          </div>
        `,
      )}
    </div>
  `,
};

/** Hug vs fill in a fixed parent — fill stretches; hug sizes to the label. */
export const Widths: Story = {
  parameters: { controls: { exclude: ['width'] } },
  render: args => html`
    <div
      style="display:flex;flex-direction:column;gap:var(--dimension-space-200);width:280px;"
    >
      ${WIDTHS.map(
        width => html`
          <div style="display:flex;flex-direction:column;gap:var(--dimension-space-100);width:100%;">
            <span style="${LABEL}">width=${width}</span>
            <ds-button-unfilled
              variant=${args['variant'] === 'icon' ? 'label' : args['variant']}
              size=${args['size']}
              width=${width}
              label=${args['label']}
              icon=${args['icon']}
              ?is-active=${args['isActive']}
              ?active-fill=${args['activeFill']}
              ?has-border=${args['hasBorder']}
              on-background-contrast=${args['backgroundContrast']}
              background=${args['background'] || ''}
            ></ds-button-unfilled>
          </div>
        `,
      )}
    </div>
  `,
};

/**
 * Selected looks (primary foreground always; fill optional):
 * - `is-active` (default `activeFill`) — general UI / toolbars
 * - `is-active` + `activeFill={false}` — shell chrome (nav, tool rails)
 */
export const States: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Use `isActive` with the default `activeFill` for general UI. Shell chrome (PanelNav, PanelTools, BarNav) should set `activeFill={false}` so selection is primary foreground only (no fill).',
      },
    },
  },
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LABEL}">idle</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Notifications"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Inbox" aria-label="Inbox" dot></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">active (general UI)</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Notifications active" is-active></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Inbox" aria-label="Inbox active" is-active dot></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">active (chrome)</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Notifications active" is-active .activeFill=${false} .hasBorder=${false}></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Inbox" aria-label="Inbox active" is-active .activeFill=${false} .hasBorder=${false} dot></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">no border</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Notifications" .hasBorder=${false}></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Notifications active" is-active .hasBorder=${false}></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">bordered (default)</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Notifications bordered"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Notifications bordered active" is-active></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">inactive</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Notifications inactive" is-inactive></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Inbox" aria-label="Inbox inactive" is-inactive dot></ds-button-unfilled>
      </div>
    </div>
  `,
};

export const Surfaces: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${SURFACE}">
        <span style="${LABEL}">default</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-background-medium-neutral);">
        <span style="${LABEL}">medium</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" on-background-contrast="medium"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" on-background-contrast="medium" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-background-bold-neutral);">
        <span style="${LABEL}">bold</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" on-background-contrast="bold"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" on-background-contrast="bold" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-background-strong-neutral);">
        <span style="${LABEL}">strong</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" on-background-contrast="strong"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" on-background-contrast="strong" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-navigation-background-primary);">
        <span style="${LABEL};color:var(--color-navigation-foreground-secondary)">navigation</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="navigation" .hasBorder=${false}></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="navigation" is-active .activeFill=${false} .hasBorder=${false}></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-always-dark-background-primary);">
        <span style="${LABEL};color:var(--color-always-dark-foreground-secondary)">always-dark</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="always-dark" .hasBorder=${false}></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="always-dark" is-active .activeFill=${false} .hasBorder=${false}></ds-button-unfilled>
      </div>
    </div>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../styles/control-elevation.css';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-menu.js';
import {
  BUTTON_STORY_COLUMN as COL,
  BUTTON_STORY_ROW as ROW,
  BUTTON_STORY_SIZES as SIZES,
  BUTTON_STORY_SURFACE as SURFACE,
  BUTTON_STORY_VARIANTS as VARIANTS,
  BUTTON_STORY_WIDTHS as WIDTHS,
  wireButtonStoryMenuTriggers as wireMenuTriggers,
} from '../../utils/button-story-foundation';

const INTENTS = [
  'neutral',
  'brand',
  'positive',
  'negative',
  'warning',
  'caution',
  'ai',
  'guide',
  'walkthrough',
] as const;

const CONTRASTS = ['bold', 'strong', 'medium', 'faint'] as const;
const BACKGROUNDS = [
  'faint',
  'medium',
  'bold',
  'strong',
  'translucent',
  'inverted',
  'media',
  'always-dark',
] as const;

const meta: Meta = {
  title: 'Primitives/ButtonFilled',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: [...VARIANTS] },
    size: { control: 'select', options: [...SIZES] },
    isInset: { control: 'boolean' },
    insetDepth: { control: 'select', options: ['single', 'double'] },
    width: { control: 'select', options: [...WIDTHS] },
    label: { control: 'text' },
    labelEmphasis: { control: 'boolean' },
    icon: { control: 'text' },
    intent: { control: 'select', options: [...INTENTS] },
    contrast: { control: 'select', options: [...CONTRASTS] },
    hasBorder: { control: 'boolean' },
    background: { control: 'select', options: ['', ...BACKGROUNDS] },
    rounded: { control: 'boolean' },
    pressScale: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    hasMenu: { control: 'boolean' },
    expanded: { control: 'boolean' },
    ariaLabel: { control: 'text' },
  },
  args: {
    variant: 'label',
    size: 'md',
    isInset: false,
    insetDepth: 'single',
    width: 'hug',
    label: 'Confirm',
    labelEmphasis: true,
    icon: 'Check',
    intent: 'brand',
    contrast: 'bold',
    hasBorder: false,
    background: '',
    rounded: false,
    pressScale: true,
    isInactive: false,
    isLoading: false,
    hasMenu: false,
    expanded: false,
    ariaLabel: '',
  },
};

export default meta;
type Story = StoryObj;

const LABEL =
  'min-width:96px;color:var(--color-foreground-tertiary);font:var(--typography-text-caption-font);';

/** Menu variants that a filled action supports — never the icon-only overflow role. */
const MENU_VARIANTS = ['label', 'icon-label'] as const;

const MENU_ITEMS = [
  { label: 'Vehicle', value: 'vehicle' },
  { label: 'Driver', value: 'driver' },
  { label: 'Group', value: 'group' },
];

/**
 * Wire every trigger/menu pair inside the story root: one application-owned open
 * boolean drives both `expanded` and `Menu.open`. Menu owns placement.
 */
export const Playground: Story = {
  render: args => html`
    <ds-button-filled
      variant=${args['variant']}
      size=${args['size']}
      ?is-inset=${args['isInset']}
      inset-depth=${args['insetDepth']}
      width=${args['width']}
      label=${args['label']}
      .labelEmphasis=${args['labelEmphasis']}
      icon=${args['icon']}
      intent=${args['intent']}
      contrast=${args['contrast']}
      .hasBorder=${args['hasBorder']}
      .background=${args['background'] || undefined}
      ?rounded=${args['rounded']}
      ?press-scale=${args['pressScale']}
      ?is-inactive=${args['isInactive']}
      ?is-loading=${args['isLoading']}
      ?has-menu=${args['hasMenu']}
      ?expanded=${args['expanded']}
      aria-label=${args['ariaLabel'] || undefined}
    ></ds-button-filled>
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
                <ds-button-filled
                  variant=${variant}
                  size=${size}
                  label="Confirm"
                  icon="Check"
                  intent="brand"
                  aria-label=${variant === 'icon' ? `Confirm ${size}` : undefined}
                ></ds-button-filled>
              `,
            )}
          </div>
        `,
      )}
    </div>
  `,
};

export const LabelEmphasis: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-button-filled label="Emphasized"></ds-button-filled>
      <ds-button-filled label="Regular" .labelEmphasis=${false}></ds-button-filled>
    </div>
  `,
};

export const InsetDensity: Story = {
  render: () => html`
    <div style="${COL}">
      ${SIZES.map(size => html`
        <div style="${ROW}">
          <span style="${LABEL}">${size}</span>
          <ds-button-filled size=${size} label="Default"></ds-button-filled>
          <ds-button-filled size=${size} label="Inset" is-inset></ds-button-filled>
          <ds-button-filled size=${size} variant="icon" icon="Check" aria-label="Inset ${size}" is-inset></ds-button-filled>
          <ds-button-filled size=${size} variant="icon" icon="Check" aria-label="Double inset ${size}" is-inset inset-depth="double"></ds-button-filled>
        </div>
      `)}
    </div>
  `,
};

export const Rounded: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-button-filled rounded variant="label" label="Confirm"></ds-button-filled>
      <ds-button-filled rounded variant="icon-label" icon="Check" label="Confirm"></ds-button-filled>
      <ds-button-filled rounded variant="icon" icon="Check" aria-label="Confirm"></ds-button-filled>
    </div>
  `,
};

export const LoadingVariants: Story = {
  render: () => html`
    <div style="${ROW}">
      ${VARIANTS.map(
        variant => html`
          <ds-button-filled
            variant=${variant}
            label="Confirm"
            icon="Check"
            is-loading
            aria-label=${variant === 'icon' ? 'Confirm' : undefined}
          ></ds-button-filled>
        `,
      )}
    </div>
  `,
};

/**
 * Physical pointer/tap feedback is shared by the two button primitives only.
 * Hold each eligible button to compare the token-driven scale treatment.
 */
export const PhysicalPressPolicy: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Filled and unfilled buttons share the internal physical press-scale utility. Inactive, loading, and reduced-motion buttons remain at their resting scale. Elevated wrappers opt into the press-scale modifier so their surface and elevation move with the button.',
      },
    },
  },
  render: () => html`
    <div style="${COL};width:min(100%, 360px);">
      <div style="${ROW}">
        <span style="${LABEL}">eligible</span>
        <ds-button-filled label="Filled action"></ds-button-filled>
        <ds-button-unfilled label="Unfilled action"></ds-button-unfilled>
        <ds-button-unfilled
          variant="icon"
          icon="Bell"
          aria-label="Icon action"
        ></ds-button-unfilled>
      </div>

      <div style="${ROW}">
        <span style="${LABEL}">no scale</span>
        <ds-button-filled label="Inactive" is-inactive></ds-button-filled>
        <ds-button-unfilled label="Loading" is-loading></ds-button-unfilled>
      </div>

      <div
        class="ds-control-elevation ds-control-elevation--md ds-control-elevation--press-scale"
        style="width:100%;border-radius:var(--dimension-radius-half);"
      >
        <ds-button-filled
          width="fill"
          rounded
          variant="icon-label"
          icon="Plus"
          label="Elevated full-width action"
        ></ds-button-filled>
      </div>
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
            <ds-button-filled
              variant=${args['variant'] === 'icon' ? 'label' : args['variant']}
              size=${args['size']}
              width=${width}
              label=${args['label']}
              icon=${args['icon']}
              intent=${args['intent']}
              contrast=${args['contrast']}
            ></ds-button-filled>
          </div>
        `,
      )}
    </div>
  `,
};

export const IntentsBold: Story = {
  render: () => html`
    <div style="${ROW}">
      ${INTENTS.map(
        intent => html`
          <ds-button-filled
            variant="icon"
            icon="Check"
            intent=${intent}
            aria-label=${intent}
          ></ds-button-filled>
        `,
      )}
    </div>
  `,
};

export const ContrastMatrix: Story = {
  render: () => html`
    <div style="${COL}">
      ${CONTRASTS.map(
        contrast => html`
          <div style="${ROW}">
            <span style="${LABEL}">${contrast}</span>
            ${INTENTS.map(
              intent => html`
                <ds-button-filled
                  variant="icon"
                  icon="Check"
                  intent=${intent}
                  contrast=${contrast}
                  aria-label="${intent} ${contrast}"
                ></ds-button-filled>
              `,
            )}
          </div>
        `,
      )}
    </div>
  `,
};

export const OnBoldBrand: Story = {
  render: () => html`
    <div
      style="display:flex;gap:var(--dimension-space-100);align-items:center;padding:var(--dimension-space-150);border-radius:var(--dimension-radius-100);background:var(--color-background-bold-brand);"
    >
      <ds-button-filled variant="icon" icon="Check" intent="neutral" contrast="faint" aria-label="Save"></ds-button-filled>
      <ds-button-filled variant="label" label="Save" intent="brand" contrast="faint"></ds-button-filled>
    </div>
  `,
};

export const BorderSurfaceContexts: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${SURFACE} background:var(--color-background-primary);">
        <span style="${LABEL}">default</span>
        <ds-button-filled has-border label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-background-faint-neutral);">
        <span style="${LABEL}">faint</span>
        <ds-button-filled has-border background="faint" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-background-medium-neutral);">
        <span style="${LABEL}">medium</span>
        <ds-button-filled has-border background="medium" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-background-bold-neutral);">
        <span style="${LABEL}">bold</span>
        <ds-button-filled has-border background="bold" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-background-strong-neutral);">
        <span style="${LABEL}">strong</span>
        <ds-button-filled has-border background="strong" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:linear-gradient(var(--color-translucent-translucent), var(--color-translucent-translucent)), var(--color-background-bold-brand);">
        <span style="${LABEL};color:var(--color-translucent-foreground-secondary)">translucent</span>
        <ds-button-filled has-border background="translucent" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-inverted-background);">
        <span style="${LABEL};color:var(--color-inverted-foreground-secondary)">inverted</span>
        <ds-button-filled has-border background="inverted" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-media-background);">
        <span style="${LABEL};color:var(--color-media-foreground-secondary)">media</span>
        <ds-button-filled has-border background="media" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
      <div style="${SURFACE} background:var(--color-always-dark-background);">
        <span style="${LABEL};color:var(--color-always-dark-foreground-secondary)">always-dark</span>
        <ds-button-filled has-border background="always-dark" label="Confirm" contrast="faint"></ds-button-filled>
      </div>
    </div>
  `,
};

/**
 * A filled action that *has* a menu. `hasMenu` implies `aria-haspopup="menu"` and
 * adds the trailing chevron that carries the affordance.
 *
 * A filled button is never the icon-only overflow control — see ButtonUnfilled.
 */
export const MenuTrigger: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Pass `hasMenu` when a filled action opens a menu. Only `label` and `icon-label` are supported: the ' +
          'chevron is what tells the user a menu will open. The icon-only "more options" control is a different ' +
          'role — it belongs to ButtonUnfilled with an `Ellipses` glyph, which conveys the menu without a chevron.',
      },
    },
  },
  render: () => html`
    <div style="${COL}">
      ${MENU_VARIANTS.map(
        variant => html`
          <div style="${ROW}">
            <span style="${LABEL}">${variant}</span>
            ${SIZES.map(
              size => html`
                <ds-button-filled
                  variant=${variant}
                  size=${size}
                  label="Add"
                  icon="Plus"
                  has-menu
                ></ds-button-filled>
              `,
            )}
          </div>
        `,
      )}
    </div>
  `,
};

/**
 * ButtonFilled has no selected state by design. An open popup is a *transient
 * pressed* state, so `expanded` holds the pressed wash for the popup's lifecycle
 * rather than promoting any active treatment.
 */
export const MenuTriggerOpenState: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'ButtonFilled intentionally has no active/selected state — filled actions are commands, not toggles. ' +
          'While `expanded` is true the pressed wash stays applied (and survives hover), matching how shell chrome ' +
          'holds a trigger down for the life of its menu. Compare each pair: resting left, open right.',
      },
    },
  },
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LABEL}">label</span>
        <ds-button-filled variant="label" label="Add" has-menu></ds-button-filled>
        <ds-button-filled variant="label" label="Add" has-menu expanded></ds-button-filled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">icon-label</span>
        <ds-button-filled variant="icon-label" icon="Plus" label="Add" has-menu></ds-button-filled>
        <ds-button-filled variant="icon-label" icon="Plus" label="Add" has-menu expanded></ds-button-filled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">inactive</span>
        <ds-button-filled variant="label" label="Add" has-menu is-inactive></ds-button-filled>
        <ds-button-filled variant="label" label="Add" has-menu expanded is-inactive></ds-button-filled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">loading</span>
        <ds-button-filled variant="label" label="Add" has-menu is-loading></ds-button-filled>
        <ds-button-filled variant="icon-label" icon="Plus" label="Add" has-menu is-loading></ds-button-filled>
      </div>

      <div style="${COL};margin-top:var(--dimension-space-100);">
        <span style="${LABEL}">contrast × open</span>
        ${CONTRASTS.map(
          contrast => html`
            <div style="${ROW}">
              <span style="${LABEL}">${contrast}</span>
              <ds-button-filled variant="label" label="Add" contrast=${contrast} has-menu></ds-button-filled>
              <ds-button-filled variant="label" label="Add" contrast=${contrast} has-menu expanded></ds-button-filled>
            </div>
          `,
        )}
      </div>

      <div style="${COL};margin-top:var(--dimension-space-100);">
        <span style="${LABEL}">intent × open</span>
        ${INTENTS.map(
          intent => html`
            <div style="${ROW}">
              <span style="${LABEL}">${intent}</span>
              <ds-button-filled variant="label" label="Add" intent=${intent} has-menu></ds-button-filled>
              <ds-button-filled variant="label" label="Add" intent=${intent} has-menu expanded></ds-button-filled>
            </div>
          `,
        )}
      </div>
    </div>
  `,
};

/**
 * Wired trigger: the application owns one open boolean and synchronizes it to both
 * `expanded` and `Menu.open`. Menu owns placement — never position the popup here.
 */
export const MenuTriggerLive: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Click each trigger to open its menu. One application-owned open boolean drives both ' +
          '`ButtonFilled.expanded` and `Menu.open`; `Menu` resolves placement from `anchorId`.',
      },
    },
  },
  render: () => html`
    <div style="${COL};height:320px;" ${ref(el => wireMenuTriggers(el))}>
      <div style="${ROW}">
        <ds-button-filled
          id="filled-menu-trigger-icon-label"
          data-menu-trigger="filled-menu-icon-label"
          variant="icon-label"
          icon="Plus"
          label="Add"
          controls="filled-menu-icon-label"
          has-menu
        ></ds-button-filled>
        <ds-menu
          id="filled-menu-icon-label"
          anchor-id="filled-menu-trigger-icon-label"
          menu-label="Add"
          side="bottom"
          align="start"
          .items=${MENU_ITEMS}
        ></ds-menu>

        <ds-button-filled
          id="filled-menu-trigger-label"
          data-menu-trigger="filled-menu-label"
          variant="label"
          label="Export"
          intent="neutral"
          contrast="faint"
          controls="filled-menu-label"
          has-menu
        ></ds-button-filled>
        <ds-menu
          id="filled-menu-label"
          anchor-id="filled-menu-trigger-label"
          menu-label="Export"
          side="bottom"
          align="start"
          .items=${[
            { label: 'CSV', value: 'csv' },
            { label: 'PDF', value: 'pdf' },
          ]}
        ></ds-menu>
      </div>
    </div>
  `,
};

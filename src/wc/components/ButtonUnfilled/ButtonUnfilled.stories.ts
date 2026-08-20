import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
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

const meta: Meta = {
  title: 'Primitives/ButtonUnfilled',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: [...VARIANTS] },
    size: { control: 'select', options: [...SIZES] },
    isInset: { control: 'boolean' },
    insetDepth: { control: 'select', options: ['single', 'double'] },
    width: { control: 'select', options: [...WIDTHS] },
    label: { control: 'text' },
    icon: { control: 'text' },
    isActive: { control: 'boolean' },
    pressed: { control: 'boolean' },
    expanded: { control: 'boolean' },
    hasMenu: { control: 'boolean' },
    activeFill: { control: 'boolean' },
    hasBorder: { control: 'boolean' },
    rounded: { control: 'boolean' },
    pressScale: { control: 'boolean' },
    dot: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    ariaLabel: { control: 'text' },
    background: {
      control: 'select',
      options: [
        '',
        'faint',
        'medium',
        'bold',
        'strong',
        'translucent',
        'inverted',
        'media',
        'always-dark',
      ],
    },
  },
  args: {
    variant: 'label',
    size: 'md',
    isInset: false,
    insetDepth: 'single',
    width: 'hug',
    label: 'Action',
    icon: 'Bell',
    ariaLabel: '',
    isActive: false,
    pressed: undefined,
    expanded: false,
    hasMenu: false,
    activeFill: true,
    hasBorder: true,
    rounded: false,
    pressScale: true,
    dot: false,
    isInactive: false,
    isLoading: false,
    background: '',
  },
};

export default meta;
type Story = StoryObj;

const LABEL =
  'min-width:128px;color:var(--color-foreground-tertiary);font:var(--typography-text-caption-font);';

const VIEW_ITEMS = [
  { label: 'Overview', value: 'overview', isSelected: true },
  { label: 'Map', value: 'map' },
  { label: 'Timeline', value: 'timeline' },
];

const OVERFLOW_ITEMS = [
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Delete', value: 'delete', isDestructive: true },
];

/**
 * Wire every trigger/menu pair inside the story root: one application-owned open
 * boolean drives both `expanded` and `Menu.open`. Menu owns placement.
 */
export const Playground: Story = {
  render: args => html`
    <ds-button-unfilled
      variant=${args['variant']}
      size=${args['size']}
      ?is-inset=${args['isInset']}
      inset-depth=${args['insetDepth']}
      width=${args['width']}
      label=${args['label']}
      icon=${args['icon']}
      ?is-active=${args['isActive']}
      .pressed=${args['pressed']}
      ?expanded=${args['expanded']}
      ?has-menu=${args['hasMenu']}
      ?active-fill=${args['activeFill']}
      ?has-border=${args['hasBorder']}
      ?rounded=${args['rounded']}
      ?press-scale=${args['pressScale']}
      ?dot=${args['dot']}
      ?is-inactive=${args['isInactive']}
      ?is-loading=${args['isLoading']}
      aria-label=${args['ariaLabel'] || undefined}
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

export const InsetDensity: Story = {
  render: () => html`
    <div style="${COL}">
      ${SIZES.map(size => html`
        <div style="${ROW}">
          <span style="${LABEL}">${size}</span>
          <ds-button-unfilled size=${size} label="Default"></ds-button-unfilled>
          <ds-button-unfilled size=${size} label="Inset" is-inset></ds-button-unfilled>
          <ds-button-unfilled size=${size} variant="icon" icon="Bell" aria-label="Inset ${size}" is-inset></ds-button-unfilled>
          <ds-button-unfilled size=${size} variant="icon" icon="Bell" aria-label="Double inset ${size}" is-inset inset-depth="double"></ds-button-unfilled>
        </div>
      `)}
    </div>
  `,
};

export const Rounded: Story = {
  render: () => html`
    <div style="${ROW}">
      <ds-button-unfilled rounded variant="label" label="Action"></ds-button-unfilled>
      <ds-button-unfilled rounded variant="icon-label" icon="Bell" label="Action"></ds-button-unfilled>
      <ds-button-unfilled rounded variant="icon" icon="Bell" aria-label="Action"></ds-button-unfilled>
    </div>
  `,
};

export const LoadingVariants: Story = {
  render: () => html`
    <div style="${ROW}">
      ${VARIANTS.map(
        variant => html`
          <ds-button-unfilled
            variant=${variant}
            label="Action"
            icon="Bell"
            is-loading
            aria-label=${variant === 'icon' ? 'Action' : undefined}
          ></ds-button-unfilled>
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
        <span style="${LABEL}">popup open (chrome)</span>
        <ds-button-unfilled
          variant="icon"
          icon="Ellipses"
          aria-label="Options menu open"
          haspopup="menu"
          expanded
          .activeFill=${false}
          .hasBorder=${false}
        ></ds-button-unfilled>
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

export const ToggleSemantics: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`pressed` is reserved for a genuine toggle and supplies aria-pressed plus dsChange intent. `isActive` is visual emphasis controlled by a composite owner and carries no toggle semantics.',
      },
    },
  },
  render: () => html`
    <div style="${ROW}">
      <ds-button-unfilled
        variant="icon-label"
        icon="Star"
        label="Favorite"
        .pressed=${false}
      ></ds-button-unfilled>
      <ds-button-unfilled
        variant="icon-label"
        icon="StarFilled"
        label="Favorited"
        .pressed=${true}
      ></ds-button-unfilled>
      <ds-button-unfilled
        variant="icon-label"
        icon="ViewList"
        label="Composite active view"
        is-active
      ></ds-button-unfilled>
    </div>
  `,
};

export const Surfaces: Story = {
  render: () => html`
    <div style="${COL}">
      <div style="${SURFACE} background:var(--color-background-primary);">
        <span style="${LABEL}">default · primary</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-background-secondary);">
        <span style="${LABEL}">default · secondary</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-background-faint-neutral);">
        <span style="${LABEL}">faint</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="faint"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="faint" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-background-medium-neutral);">
        <span style="${LABEL}">medium</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="medium"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="medium" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-background-bold-neutral);">
        <span style="${LABEL}">bold</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="bold"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="bold" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-background-strong-neutral);">
        <span style="${LABEL}">strong</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="strong"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="strong" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:linear-gradient(var(--color-translucent-translucent), var(--color-translucent-translucent)), var(--color-background-bold-brand);">
        <span style="${LABEL};color:var(--color-translucent-foreground-secondary)">translucent</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="translucent"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="translucent" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-inverted-background);">
        <span style="${LABEL};color:var(--color-inverted-foreground-secondary)">inverted</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="inverted"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="inverted" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-media-background);">
        <span style="${LABEL};color:var(--color-media-foreground-secondary)">media</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="media"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="media" is-active></ds-button-unfilled>
      </div>
      <div style="${SURFACE} background:var(--color-always-dark-background);">
        <span style="${LABEL};color:var(--color-always-dark-foreground-secondary)">always-dark</span>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell" background="always-dark" .hasBorder=${false}></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Bell" aria-label="Bell active" background="always-dark" is-active .activeFill=${false} .hasBorder=${false}></ds-button-unfilled>
      </div>
    </div>
  `,
};

/**
 * `hasMenu` covers the two menu-button shapes, and the variant decides which one:
 *
 * - **has a menu** (`label` / `icon-label`) — an action that opens a menu. The
 *   trailing chevron carries the affordance.
 * - **is a menu** (`icon`) — an overflow or named-menu control. No chevron, so
 *   the glyph must convey it alone; use `Ellipses` for more options, or a
 *   specific icon such as `Preferences` for Customize table.
 */
export const MenuTrigger: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'One prop, two shapes. `label` and `icon-label` are actions that *have* a menu, so they get a trailing ' +
          'ChevronDown. The `icon` variant *is* a menu and stays chevron-free, so the glyph must convey it alone. ' +
          'Use `Ellipses` for generic more-options or overflow. Use a specific icon when the menu has a named ' +
          'purpose, such as `Preferences` for Customize table.',
      },
    },
  },
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LABEL}">has a menu</span>
        ${SIZES.map(
          size => html`
            <ds-button-unfilled
              variant="label"
              size=${size}
              label="View"
              has-menu
            ></ds-button-unfilled>
          `,
        )}
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">has a menu (icon)</span>
        ${SIZES.map(
          size => html`
            <ds-button-unfilled
              variant="icon-label"
              size=${size}
              icon="Filters"
              label="Filter"
              has-menu
            ></ds-button-unfilled>
          `,
        )}
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">is a menu</span>
        ${SIZES.map(
          size => html`
            <ds-button-unfilled
              variant="icon"
              size=${size}
              icon="Ellipses"
              has-menu
              aria-label="More options"
            ></ds-button-unfilled>
          `,
        )}
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">is a menu (chrome)</span>
        ${SIZES.map(
          size => html`
            <ds-button-unfilled
              variant="icon"
              size=${size}
              icon="Ellipses"
              has-menu
              rounded
              .hasBorder=${false}
              .activeFill=${false}
              aria-label="More options"
            ></ds-button-unfilled>
          `,
        )}
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">is a named menu</span>
        ${SIZES.map(
          size => html`
            <ds-button-unfilled
              variant="icon"
              size=${size}
              icon="Preferences"
              has-menu
              aria-label="Customize table"
            ></ds-button-unfilled>
          `,
        )}
      </div>
    </div>
  `,
};

/**
 * An open popup is a transient *pressed* state, not a selected one. `expanded`
 * holds the pressed wash for the popup's rendered lifecycle — including through
 * hover — and works even when chrome opts out of selected fills.
 */
export const MenuTriggerOpenState: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Resting left, open right. `expanded` keeps the pressed wash applied for as long as the menu is ' +
          'rendered, so the trigger reads as held down. It survives hover, and it is independent of `isActive`: ' +
          'chrome passing `activeFill={false}` still gets the open treatment.',
      },
    },
  },
  render: () => html`
    <div style="${COL}">
      <div style="${ROW}">
        <span style="${LABEL}">has a menu</span>
        <ds-button-unfilled variant="label" label="View" has-menu></ds-button-unfilled>
        <ds-button-unfilled variant="label" label="View" has-menu expanded></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">icon-label</span>
        <ds-button-unfilled variant="icon-label" icon="Filters" label="Filter" has-menu></ds-button-unfilled>
        <ds-button-unfilled variant="icon-label" icon="Filters" label="Filter" has-menu expanded></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">is a menu</span>
        <ds-button-unfilled variant="icon" icon="Ellipses" has-menu aria-label="More options"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Ellipses" has-menu expanded aria-label="More options open"></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">is a menu (chrome)</span>
        <ds-button-unfilled variant="icon" icon="Ellipses" has-menu rounded .hasBorder=${false} .activeFill=${false} aria-label="More options"></ds-button-unfilled>
        <ds-button-unfilled variant="icon" icon="Ellipses" has-menu rounded expanded .hasBorder=${false} .activeFill=${false} aria-label="More options open"></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">inactive</span>
        <ds-button-unfilled variant="label" label="View" has-menu is-inactive></ds-button-unfilled>
        <ds-button-unfilled variant="label" label="View" has-menu expanded is-inactive></ds-button-unfilled>
      </div>
      <div style="${ROW}">
        <span style="${LABEL}">loading</span>
        <ds-button-unfilled variant="label" label="View" has-menu is-loading></ds-button-unfilled>
        <ds-button-unfilled variant="icon-label" icon="Filters" label="Filter" has-menu is-loading></ds-button-unfilled>
      </div>
    </div>
  `,
};

/**
 * Wired triggers: the application owns one open boolean and synchronizes it to
 * both `expanded` and `Menu.open`. Menu owns placement.
 */
export const MenuTriggerLive: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'Click each trigger. One application-owned open boolean drives both `ButtonUnfilled.expanded` and ' +
          '`Menu.open`; `Menu` resolves placement from `anchorId`. The application never positions the popup.',
      },
    },
  },
  render: () => html`
    <div style="${COL};height:320px;" ${ref(el => wireMenuTriggers(el))}>
      <div style="${ROW}">
        <ds-button-unfilled
          id="unfilled-menu-trigger-view"
          data-menu-trigger="unfilled-menu-view"
          variant="label"
          label="View"
          controls="unfilled-menu-view"
          has-menu
        ></ds-button-unfilled>
        <ds-menu
          id="unfilled-menu-view"
          anchor-id="unfilled-menu-trigger-view"
          menu-label="Choose view"
          side="bottom"
          align="start"
          .items=${VIEW_ITEMS}
        ></ds-menu>

        <ds-button-unfilled
          id="unfilled-menu-trigger-overflow"
          data-menu-trigger="unfilled-menu-overflow"
          variant="icon"
          icon="Ellipses"
          aria-label="More options"
          controls="unfilled-menu-overflow"
          rounded
          has-menu
          .hasBorder=${false}
          .activeFill=${false}
        ></ds-button-unfilled>
        <ds-menu
          id="unfilled-menu-overflow"
          anchor-id="unfilled-menu-trigger-overflow"
          menu-label="More options"
          side="bottom"
          align="end"
          .items=${OVERFLOW_ITEMS}
        ></ds-menu>
      </div>
    </div>
  `,
};

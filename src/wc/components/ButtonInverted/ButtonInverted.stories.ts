import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-button-inverted.js';
import {
  BUTTON_STORY_COLUMN as COL,
  BUTTON_STORY_ROW as ROW,
  BUTTON_STORY_SIZES as SIZES,
  BUTTON_STORY_SURFACE as SURFACE,
  BUTTON_STORY_VARIANTS as VARIANTS,
  BUTTON_STORY_WIDTHS as WIDTHS,
} from '../../utils/button-story-foundation';

const meta: Meta = {
  title: 'Primitives/ButtonInverted',
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
    rounded: { control: 'boolean' },
    split: { control: 'boolean' },
    menuAriaLabel: { control: 'text' },
    pressScale: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    hasMenu: { control: 'boolean' },
    expanded: { control: 'boolean' },
    surfaceOpen: { control: 'boolean' },
    ariaLabel: { control: 'text' },
  },
  args: {
    variant: 'label',
    size: 'md',
    isInset: false,
    insetDepth: 'single',
    width: 'hug',
    label: 'Continue',
    labelEmphasis: true,
    icon: 'ArrowRight',
    rounded: false,
    split: false,
    menuAriaLabel: 'More options',
    pressScale: true,
    isInactive: false,
    isLoading: false,
    hasMenu: false,
    expanded: false,
    surfaceOpen: false,
    ariaLabel: '',
  },
};

export default meta;
type Story = StoryObj;

const LABEL =
  'min-width:96px;color:var(--color-foreground-tertiary);font:var(--typography-text-caption-font);';

export const Playground: Story = {
  render: args => html`
    <ds-button-inverted
      variant=${args['variant']}
      size=${args['size']}
      ?is-inset=${args['isInset']}
      inset-depth=${args['insetDepth']}
      width=${args['width']}
      label=${args['label']}
      .labelEmphasis=${args['labelEmphasis']}
      icon=${args['icon']}
      ?rounded=${args['rounded']}
      ?split=${args['split']}
      menu-aria-label=${args['menuAriaLabel']}
      ?press-scale=${args['pressScale']}
      ?is-inactive=${args['isInactive']}
      ?is-loading=${args['isLoading']}
      ?has-menu=${args['hasMenu']}
      ?expanded=${args['expanded']}
      .surfaceOpen=${args['surfaceOpen']}
      aria-label=${args['ariaLabel'] || undefined}
    ></ds-button-inverted>
  `,
};

export const VariantsAndSizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${COL}">
      ${VARIANTS.map(
        variant => html`
          <div style="${ROW}">
            <span style="${LABEL}">${variant}</span>
            ${SIZES.map(
              size => html`
                <ds-button-inverted
                  variant=${variant}
                  size=${size}
                  label="Continue"
                  icon="ArrowRight"
                  aria-label=${variant === 'icon' ? `Continue ${size}` : undefined}
                ></ds-button-inverted>
              `
            )}
          </div>
        `
      )}
    </div>
  `,
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="${ROW}">
      <ds-button-inverted label="Continue"></ds-button-inverted>
      <ds-button-inverted label="Inactive" is-inactive></ds-button-inverted>
      <ds-button-inverted label="Loading" is-loading></ds-button-inverted>
      <ds-button-inverted rounded label="Rounded"></ds-button-inverted>
    </div>
  `,
};

export const InvertedSurface: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'ButtonInverted owns a single filled recipe: inverted background with primary foreground on that surface. It does not expose intent or contrast choices.',
      },
    },
  },
  render: () => html`
    <div style="${SURFACE} background:var(--color-background-primary);">
      <ds-button-inverted label="Continue"></ds-button-inverted>
      <ds-button-inverted variant="icon-label" icon="ArrowRight" label="Next"></ds-button-inverted>
      <ds-button-inverted variant="icon" icon="ArrowRight" aria-label="Next"></ds-button-inverted>
    </div>
  `,
};

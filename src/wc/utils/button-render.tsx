import { h } from '@stencil/core';
import { CONTROL_TEXT_VARIANT } from './control-text';
import {
  BUTTON_ICON_SIZE,
  buttonShowsChevron,
  buttonShowsIcon,
  buttonShowsLabel,
  type ButtonSize,
  type ButtonVariant,
} from './button-types';

interface ButtonContentOptions {
  namespace: 'button-filled' | 'button-unfilled';
  variant: ButtonVariant;
  size: ButtonSize;
  label: string;
  labelEmphasis: boolean;
  icon: string;
  hasMenu: boolean;
  isLoading: boolean;
  dot?: {
    visible: boolean;
    background: string;
  };
}

/** One content renderer shared by both semantic button components. */
export function renderButtonContent(options: ButtonContentOptions) {
  const { namespace, variant, size, label, labelEmphasis, icon, hasMenu, isLoading, dot } = options;
  const iconSize = BUTTON_ICON_SIZE[size];
  const labelLoading = isLoading && variant === 'label';

  return [
    buttonShowsIcon(variant) ? (
      <span
        class={`${namespace}__icon-wrap ds-button__icon-wrap ds-control-icon-box ds-interaction-fill__content`}
      >
        {isLoading ? (
          <ds-loader size={iconSize} color="inherit" />
        ) : (
          <ds-icon name={icon} size={iconSize} color="inherit" />
        )}
        {dot?.visible ? (
          <ds-badge
            class={`${namespace}__dot ds-button__dot`}
            variant="dot"
            background={dot.background}
            label=""
            aria-hidden="true"
          />
        ) : null}
      </span>
    ) : null,
    buttonShowsLabel(variant) ? (
      <ds-text
        class={{
          [`${namespace}__label`]: true,
          'ds-button__label': true,
          'ds-control-label-box': true,
          [`${namespace}__label--loading`]: labelLoading,
          'ds-button__label--loading': labelLoading,
          'ds-interaction-fill__content': true,
        }}
        as="span"
        variant={CONTROL_TEXT_VARIANT[size]}
        emphasis={labelEmphasis}
        color="inherit"
      >
        {label}
      </ds-text>
    ) : null,
    buttonShowsChevron(variant, hasMenu) ? (
      <span
        class={{
          [`${namespace}__chevron`]: true,
          'ds-button__chevron': true,
          'ds-control-icon-box': true,
          'ds-interaction-fill__content': true,
          [`${namespace}__chevron--loading`]: labelLoading,
          'ds-button__chevron--loading': labelLoading,
        }}
        aria-hidden="true"
      >
        <ds-icon name="ChevronDown" size={iconSize} color="inherit" />
      </span>
    ) : null,
    labelLoading ? (
      <span
        class={`${namespace}__loader-overlay ds-button__loader-overlay ds-interaction-fill__content`}
      >
        <ds-loader size={iconSize} color="inherit" />
      </span>
    ) : null,
  ];
}

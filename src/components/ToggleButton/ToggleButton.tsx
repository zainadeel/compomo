import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Text } from '@/components/Text';
import { LabelWrap } from '@/components/LabelWrap';
import type { IconComponent } from '@/types/icons';
import styles from './ToggleButton.module.css';

export type ToggleButtonElevation = 'none' | 'flat' | 'elevated' | 'floating';
export type ToggleButtonSize      = 'md' | 'sm' | 'xs';

export interface ToggleButtonProps {
  /**
   * Chrome level.
   *   none     — ghost (transparent, no border, no shadow)
   *   flat     — border only, transparent bg
   *   elevated — bg-primary + shadow  [default]
   *   floating — bg-primary + FAB-strength shadow
   */
  elevation?: ToggleButtonElevation;
  /** Label text. */
  label?: string;
  /** Leading icon component. */
  icon?: IconComponent;
  /** Size: md (32px), sm (24px), xs (16px). Defaults to 'md'. */
  size?: ToggleButtonSize;
  /** Pill shape. */
  rounded?: boolean;
  /** Controlled pressed state. */
  pressed: boolean;
  /** Called when pressed state changes. */
  onPressedChange: (pressed: boolean) => void;
  inactive?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

const ICON_SIZE_MAP: Record<ToggleButtonSize, number> = { md: 20, sm: 16, xs: 12 };

const TEXT_STYLE_MAP: Record<ToggleButtonSize, string> = {
  md: 'text-body-medium-emphasis',
  sm: 'text-body-small-emphasis',
  xs: 'text-caption-emphasis',
};

export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (
    {
      elevation = 'elevated',
      label,
      icon: Icon,
      size = 'md',
      rounded = false,
      pressed,
      onPressedChange,
      inactive = false,
      className,
      id,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const hasIcon = !!Icon;
    const hasLabel = !!label;
    const isIconOnly = hasIcon && !hasLabel;
    const isLabelOnly = hasLabel && !hasIcon;
    const isIconAndLabel = hasIcon && hasLabel;
    const iconSize = ICON_SIZE_MAP[size];
    const textStyle = TEXT_STYLE_MAP[size];

    const elevKey = elevation.charAt(0).toUpperCase() + elevation.slice(1);

    const classes = cn(
      styles.toggleButton,
      styles[`elevation${elevKey}`],
      size !== 'md' && styles[`size${size.toUpperCase()}`],
      rounded && styles.rounded,
      inactive && styles.inactive,
      isIconOnly && styles.iconOnly,
      isLabelOnly && styles.labelOnly,
      isIconAndLabel && styles.iconAndLabel,
      pressed && styles.pressed,
      className,
    );

    return (
      <button
        ref={ref}
        id={id}
        className={classes}
        onClick={inactive ? undefined : () => onPressedChange(!pressed)}
        type="button"
        disabled={inactive}
        aria-label={ariaLabel || label || 'toggle'}
        aria-pressed={pressed}
      >
        {Icon && <Icon size={iconSize} />}
        {label && (
          <LabelWrap>
            <Text variant={textStyle as never} as="span" color="inherit">
              {label}
            </Text>
          </LabelWrap>
        )}
      </button>
    );
  }
);

ToggleButton.displayName = 'ToggleButton';

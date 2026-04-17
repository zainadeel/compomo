import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Text } from '@/components/Text';
import { LabelWrap } from '@/components/LabelWrap';
import { Cross } from '@ds-mo/icons';
import type { IconComponent } from '@/types/icons';
import styles from './Tag.module.css';

export type TagIntent      = 'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive';
export type TagContrast    = 'strong' | 'bold' | 'medium' | 'faint';
export type TagElevation   = 'none' | 'flat' | 'elevated';
export type TagSize        = 'md' | 'sm' | 'xs';
export type TagBackground  = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

export interface TagProps {
  label: string;
  intent?: TagIntent;
  contrast?: TagContrast;
  /**
   * Visual chrome level.
   *   none     — filled with intent bg, no border, no shadow  [default]
   *   flat     — transparent bg + intent-coloured border ring
   *   elevated — filled with intent bg + elevated shadow
   */
  elevation?: TagElevation;
  size?: TagSize;
  rounded?: boolean;
  /** Leading icon component. */
  icon?: IconComponent;
  removable?: boolean;
  onRemove?: () => void;
  /** Override the default Cross remove icon. */
  removeIcon?: IconComponent;
  maxWidth?: string | number;
  inactive?: boolean;
  /** Parent surface context. Adjusts hover tokens for tags on colored backgrounds. */
  background?: TagBackground;
  /** Makes the tag clickable. Pair with pressed/onPressedChange for filter-chip behaviour. */
  onClick?: () => void;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  className?: string;
}

const ICON_SIZE: Record<TagSize, number> = { md: 20, sm: 16, xs: 12 };

const TEXT_STYLE_MAP: Record<TagSize, string> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};

export const Tag = forwardRef<HTMLDivElement, TagProps>(
  (
    {
      label,
      intent    = 'neutral',
      contrast  = 'faint',
      elevation = 'none',
      size      = 'md',
      rounded   = false,
      icon: Icon,
      removable = false,
      onRemove,
      removeIcon: RemoveIcon,
      maxWidth,
      inactive  = false,
      background,
      onClick,
      pressed,
      onPressedChange,
      className,
    },
    ref
  ) => {
    const isInteractive  = !!onClick || !!onPressedChange;
    const hasRemove      = removable && !!onRemove;
    const iconSize       = ICON_SIZE[size];
    const textStyle      = TEXT_STYLE_MAP[size];
    const elevKey        = elevation.charAt(0).toUpperCase() + elevation.slice(1);
    const sizeKey        = size.toUpperCase() as 'MD' | 'SM' | 'XS';

    const classes = cn(
      styles.tag,
      styles[`intent${intent.charAt(0).toUpperCase() + intent.slice(1)}`],
      styles[`contrast${contrast.charAt(0).toUpperCase() + contrast.slice(1)}`],
      styles[`elevation${elevKey}`],
      styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
      rounded    && styles.rounded,
      // Pill padding correction — extra space-050 on bare sides (no content anchor)
      rounded && !Icon      && (styles as Record<string, string>)[`roundedLeft${sizeKey}`],
      rounded && !hasRemove && (styles as Record<string, string>)[`roundedRight${sizeKey}`],
      // Icon-edge correction — reduce padding to (height − icon) / 2 on icon sides
      !!Icon    && (styles as Record<string, string>)[`iconLeft${sizeKey}`],
      hasRemove && (styles as Record<string, string>)[`iconRight${sizeKey}`],
      removable  && styles.removable,
      isInteractive && styles.interactive,
      background && background !== 'faint' && styles[
        background === 'always-dark' ? 'onAlwaysDark'
          : `on${background.charAt(0).toUpperCase() + background.slice(1)}`
      ],
      inactive   && styles.inactive,
      pressed    && styles.pressed,
      className,
    );

    const style = maxWidth != null
      ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }
      : undefined;

    const handleInteract = isInteractive && !inactive
      ? () => {
          onPressedChange?.(!pressed);
          onClick?.();
        }
      : undefined;

    const handleKeyDown = isInteractive && !inactive
      ? (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPressedChange?.(!pressed);
            onClick?.();
          }
        }
      : undefined;

    return (
      <div
        ref={ref}
        className={classes}
        style={style}
        onClick={handleInteract}
        onKeyDown={handleKeyDown}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive && !inactive ? 0 : undefined}
        aria-pressed={onPressedChange != null ? pressed : undefined}
        aria-disabled={inactive || undefined}
      >
        {Icon && <Icon size={iconSize} />}
        <LabelWrap size={size}>
          <Text variant={textStyle as never} as="span" color="inherit">
            {label}
          </Text>
        </LabelWrap>
        {removable && onRemove && (
          <button
            type="button"
            className={styles.removeButton}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label={`Remove ${label}`}
            tabIndex={-1}
          >
            {RemoveIcon ? <RemoveIcon size={iconSize} /> : <Cross size={iconSize} />}
          </button>
        )}
      </div>
    );
  }
);

Tag.displayName = 'Tag';

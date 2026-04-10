import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Text } from '@/components/Text';
import { ChevronDown } from '@ds-mo/icons';
import type { IconComponent } from '@/types/icons';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonIntent = 'none' | 'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonContrast = 'strong' | 'bold' | 'medium' | 'faint';

export interface ButtonProps {
  /** Polymorphic element type. Defaults to 'button'. */
  as?: React.ElementType;
  /** Visual variant. Defaults to 'primary'. */
  variant?: ButtonVariant;
  /** Label text. */
  label?: string;
  /** Leading icon component from @ds-mo/icons. */
  icon?: IconComponent;
  /** Semantic intent. Defaults to 'brand'. */
  intent?: ButtonIntent;
  /** Size. Defaults to 'md'. */
  size?: ButtonSize;
  /** Pill shape with extra padding. */
  rounded?: boolean;
  /** Fill container width. Label truncates if space is tight. */
  fullWidth?: boolean;
  /** Fixed width. Omit for content width. */
  width?: React.CSSProperties['width'];
  /** Contrast level (primary variant only). Defaults to 'bold'. */
  contrast?: ButtonContrast;
  /** Show trailing ChevronDown dropdown indicator. */
  dropdown?: boolean;
  /** Badge count. */
  badgeCount?: number;
  /** Show elevation shadow. When false, secondary gets a border instead. Defaults to true. */
  elevation?: boolean;
  /** Show loading spinner in place of icon. Prevents interaction. */
  loading?: boolean;

  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  id?: string;
  'aria-label'?: string;
  href?: string;
  target?: string;
  rel?: string;
}

const ICON_SIZE_MAP: Record<ButtonSize, number> = { xs: 12, sm: 16, md: 20, lg: 24 };

const TEXT_STYLE_MAP: Record<ButtonSize, string> = {
  xs: 'text-caption-emphasis',
  sm: 'text-body-small-emphasis',
  md: 'text-body-medium-emphasis',
  lg: 'text-body-large-emphasis',
};

/** Inline spinner placeholder — swap for <Loader> when that component is built. */
const Spinner = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    className={styles.spinner}
    aria-hidden="true"
  >
    <circle
      cx="10"
      cy="10"
      r="7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="44"
      strokeDashoffset="33"
    />
  </svg>
);

export const Button = forwardRef<HTMLElement, ButtonProps>(
  (
    {
      as,
      variant = 'primary',
      label,
      icon: Icon,
      intent = 'brand',
      size = 'md',
      rounded = false,
      fullWidth = false,
      width,
      contrast = 'bold',
      dropdown = false,
      badgeCount,
      elevation = true,
      loading = false,
      onClick,
      onMouseEnter,
      onMouseLeave,
      className,
      disabled = false,
      type = 'button',
      id,
      'aria-label': ariaLabel,
      href,
      target,
      rel,
    },
    ref
  ) => {
    const Component = (as ?? 'button') as React.ElementType;
    const isButton = !as || as === 'button';
    const isInteractive = !disabled && !loading;

    const hasIcon = !!Icon;
    const hasLabel = !!label;
    const showLeading = hasIcon || loading; // spinner fills the icon slot
    const isIconOnly = showLeading && !hasLabel;
    const isLabelOnly = hasLabel && !showLeading;
    const isIconAndLabel = showLeading && hasLabel;
    const iconSize = ICON_SIZE_MAP[size];
    const textStyle = TEXT_STYLE_MAP[size];

    const classes = cn(
      styles.button,
      styles[variant],
      styles[`intent${intent.charAt(0).toUpperCase() + intent.slice(1)}`],
      size !== 'md' && styles[`size${size.toUpperCase()}`],
      rounded && styles.rounded,
      (disabled || loading) && styles.disabled,
      isIconOnly && styles.iconOnly,
      isLabelOnly && styles.labelOnly,
      isIconAndLabel && styles.iconAndLabel,
      dropdown && styles.dropdown,
      variant === 'primary' && intent !== 'none' && contrast !== 'bold' && styles[`contrast${contrast.charAt(0).toUpperCase() + contrast.slice(1)}`],
      !elevation && variant !== 'tertiary' && styles.noElevation,
      fullWidth && styles.fullWidth,
      className,
    );

    const resolvedAriaLabel = ariaLabel || label || 'button';

    const extraProps: Record<string, unknown> = {};
    if (isButton) {
      extraProps.type = type;
      extraProps.disabled = disabled || loading;
    }
    if (href) extraProps.href = href;
    if (target) extraProps.target = target;
    if (rel) extraProps.rel = rel;

    return (
      <Component
        ref={ref}
        id={id}
        className={classes}
        style={width ? { width } : undefined}
        onClick={isInteractive ? onClick : undefined}
        onMouseEnter={isInteractive ? onMouseEnter : undefined}
        onMouseLeave={isInteractive ? onMouseLeave : undefined}
        aria-label={resolvedAriaLabel}
        aria-busy={loading || undefined}
        {...extraProps}
      >
        {loading ? (
          <Spinner size={iconSize} />
        ) : (
          Icon && <Icon size={iconSize} />
        )}
        {label && (
          <span className={cn(styles.labelWrap, fullWidth && styles.labelWrapFull)}>
            <Text variant={textStyle as never} as="span" color="inherit">
              {label}
            </Text>
          </span>
        )}
        {dropdown && <ChevronDown size={iconSize} />}
        {badgeCount != null && badgeCount > 0 && (
          <span className={styles.badge}>{badgeCount > 9 ? '+' : badgeCount}</span>
        )}
      </Component>
    );
  }
);

Button.displayName = 'Button';

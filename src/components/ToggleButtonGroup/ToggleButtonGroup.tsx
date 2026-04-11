import React from 'react';
import { cn } from '@/utils/cn';
import styles from './ToggleButtonGroup.module.css';

export interface ToggleButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Renders ToggleButton children flush side-by-side with a 1px divider between them.
 * Outer corners keep the button's own border-radius; inner corners are flattened.
 *
 * Individual button chrome (shadow/border) is suppressed — the group container
 * carries the elevation so it wraps the whole control as one visual unit.
 *
 * Divider behaviour by elevation:
 *   elevated / flat / floating — full-height color-border-tertiary line
 *   none (ghost)               — short centred line (icon/text height)
 *
 * Rounded groups: outer edges keep pill padding; inner edges revert to base padding.
 * Pressed state and onPressedChange are managed by the consumer on each ToggleButton.
 */
export const ToggleButtonGroup = ({ children, className }: ToggleButtonGroupProps) => {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const count = items.length;

  // Read elevation + rounded from first child to drive the group container style.
  const firstEl   = items[0] as React.ReactElement<Record<string, unknown>> | undefined;
  const firstProps = firstEl?.props as { elevation?: string; rounded?: boolean } | undefined;
  const groupElevation = firstProps?.elevation ?? 'elevated';
  const groupRounded   = !!firstProps?.rounded;
  const groupElevKey   = groupElevation.charAt(0).toUpperCase() + groupElevation.slice(1);

  return (
    <div
      className={cn(
        styles.group,
        (styles as Record<string, string>)[`group${groupElevKey}`],
        groupRounded && styles.groupRounded,
        className,
      )}
      role="group"
    >
      {items.map((child, i) => {
        const el = child as React.ReactElement<Record<string, unknown>>;
        const p = el.props as {
          className?: string;
          elevation?: string;
          size?: string;
          rounded?: boolean;
          pressed?: boolean;
          icon?: unknown;
          label?: unknown;
        };

        const isFirst = i === 0;
        const isLast  = i === count - 1;
        const isMid   = !isFirst && !isLast;

        const size       = (p.size ?? 'md') as 'xs' | 'sm' | 'md';
        const isRounded  = !!p.rounded;
        const isPressed  = !!p.pressed;
        const isIconOnly = !!p.icon && !p.label;
        // Ghost: elevation='none' (no chrome) → short centred divider
        const isGhost    = (p.elevation ?? 'elevated') === 'none';

        // XS rounded has no extra padding in ToggleButton so needs no correction
        const sizeKey = size.toUpperCase() as 'XS' | 'SM' | 'MD';
        const needsRoundedCorrection = isRounded && !isIconOnly && size !== 'xs';

        // Divider injected as a separate element so it's never affected by
        // the adjacent button's opacity (e.g. disabled state).
        const dividerClasses = cn(
          styles.divider,
          isGhost && styles.dividerGhost,
          isGhost && size === 'xs' && styles.dividerGhostXS,
          isGhost && size === 'sm' && styles.dividerGhostSM,
        );

        return (
          <React.Fragment key={i}>
            {i > 0 && <div className={dividerClasses} aria-hidden="true" />}
            {React.cloneElement(el, {
              className: cn(
                p.className,
                styles.item,
                isFirst && styles.first,
                isLast  && styles.last,
                isMid   && styles.middle,

                // Ghost variant: ::after overlay gets 4px radius treatment
                isGhost && styles.itemShort,

                // Ghost + pressed: selected state background chip
                isGhost && isPressed && styles.itemPressed,

                // Rounded: revert inner-edge padding to base (non-pill) value
                needsRoundedCorrection && isFirst && (styles as Record<string, string>)[`roundedFirst${sizeKey}`],
                needsRoundedCorrection && isLast  && (styles as Record<string, string>)[`roundedLast${sizeKey}`],
                needsRoundedCorrection && isMid   && (styles as Record<string, string>)[`roundedMid${sizeKey}`],
              ),
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

ToggleButtonGroup.displayName = 'ToggleButtonGroup';

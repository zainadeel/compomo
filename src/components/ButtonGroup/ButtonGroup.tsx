import React from 'react';
import { cn } from '@/utils/cn';
import styles from './ButtonGroup.module.css';

export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Renders Button children flush side-by-side with a 1px divider between them.
 * Outer corners keep the button's own border-radius; inner corners are flattened.
 *
 * Individual button chrome (shadow/border) is suppressed — the group container
 * carries the elevation so it wraps the whole control as one visual unit.
 *
 * Divider behaviour by variant:
 *   secondary / primary+none — full-height color-border-tertiary line
 *   primary (with intent)    — color-border-tertiary-on-{contrast}-background
 *   ghost (secondary+none)   — short centred line (icon/text height)
 *
 * Rounded groups: outer edges keep pill padding; inner edges revert to base padding.
 * Mix of intents is only valid when variant="secondary"; primary groups must be
 * homogeneous (same intent + contrast on all items).
 */
export const ButtonGroup = ({ children, className }: ButtonGroupProps) => {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const count = items.length;

  // Read elevation + rounded from first child to drive the group container style.
  const firstEl    = items[0] as React.ReactElement<Record<string, unknown>> | undefined;
  const firstProps = firstEl?.props as { variant?: string; elevation?: string; rounded?: boolean } | undefined;
  const firstVariant    = firstProps?.variant ?? 'secondary';
  const firstElevation  = firstProps?.elevation ?? (firstVariant === 'primary' ? 'none' : 'flat');
  const groupRounded    = !!firstProps?.rounded;
  const groupElevKey    = firstElevation.charAt(0).toUpperCase() + firstElevation.slice(1);

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
          variant?: string;
          elevation?: string;
          size?: string;
          intent?: string;
          contrast?: string;
          rounded?: boolean;
          icon?: unknown;
          label?: unknown;
        };

        const isFirst = i === 0;
        const isLast  = i === count - 1;
        const isMid   = !isFirst && !isLast;

        const variant    = p.variant  ?? 'secondary';
        const size       = (p.size    ?? 'md') as 'xs' | 'sm' | 'md' | 'lg';
        const contrast   = p.contrast ?? 'bold';
        const intent     = p.intent   ?? 'brand';
        const isRounded  = !!p.rounded;
        const isIconOnly = !!p.icon && !p.label;
        // Ghost: secondary button with elevation='none' (replaces old tertiary variant)
        const isGhost    = variant === 'secondary' && (p.elevation ?? 'flat') === 'none';
        const isPrimary  = variant === 'primary' && intent !== 'none';

        // Contrast class suffix — capitalised first letter
        const contrastKey = contrast.charAt(0).toUpperCase() + contrast.slice(1);

        // Size suffix for rounded padding correction — uppercase
        // XS rounded has no extra padding in Button so needs no correction
        const sizeKey = size.toUpperCase() as 'MD' | 'SM' | 'LG' | 'XS';
        const needsRoundedCorrection = isRounded && !isIconOnly && size !== 'xs';

        // Divider injected as a separate element so it's never affected by
        // the adjacent button's opacity (e.g. disabled state).
        const dividerClasses = cn(
          styles.divider,
          isGhost && styles.dividerGhost,
          isGhost && size === 'xs' && styles.dividerGhostXS,
          isGhost && size === 'sm' && styles.dividerGhostSM,
          isGhost && size === 'lg' && styles.dividerGhostLG,
          isPrimary && (styles as Record<string, string>)[`divider${contrastKey}`],
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

                // Ghost (secondary+elevation=none): ::after overlay gets 4px radius treatment
                isGhost && styles.itemShort,

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

ButtonGroup.displayName = 'ButtonGroup';

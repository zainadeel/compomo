import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Text } from '@/components/Text';
import styles from './Tab.module.css';

export type TabBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

export interface TabProps {
  /** id of this tab. Pair with the tabpanel's `aria-labelledby` to wire SR semantics. */
  id?: string;
  /** id of the tabpanel this tab controls. Sets `aria-controls`. */
  controls?: string;
  label: string;
  isSelected?: boolean;
  disabled?: boolean;
  /** Parent surface context. Adjusts hover tokens and fg for tabs on colored backgrounds. */
  background?: TabBackground;
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  /** Override tab order. Defaults to a roving pattern (0 when selected, -1 otherwise). */
  tabIndex?: number;
  className?: string;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(
  (
    {
      id,
      controls,
      label,
      isSelected = false,
      disabled = false,
      background,
      onClick,
      onKeyDown,
      onFocus,
      tabIndex,
      className,
    },
    ref,
  ) => {
    const bgClass = background && background !== 'faint'
      ? styles[background === 'always-dark' ? 'onAlwaysDark' : `on${background.charAt(0).toUpperCase() + background.slice(1)}`]
      : undefined;
    const effectiveTabIndex = tabIndex ?? (isSelected ? 0 : -1);
    return (
    <button
      ref={ref}
      id={id}
      className={cn(styles.tab, isSelected && styles.tabSelected, bgClass, className)}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={controls}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      tabIndex={effectiveTabIndex}
    >
      <Text variant={isSelected ? 'text-body-medium-emphasis' : 'text-body-medium'} as="span">
        {label}
      </Text>
    </button>
    );
  }
);

Tab.displayName = 'Tab';

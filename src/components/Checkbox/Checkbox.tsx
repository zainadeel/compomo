import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Text } from '@/components/Text';
import type { IconComponent } from '@/types/icons';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  label: string;
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  inactive?: boolean;
  className?: string;
  /** Icon for checked state. */
  checkedIcon?: IconComponent;
  /** Icon for unchecked state. */
  uncheckedIcon?: IconComponent;
  /** Icon for indeterminate state. */
  indeterminateIcon?: IconComponent;
}

export const Checkbox = forwardRef<HTMLDivElement, CheckboxProps>(
  (
    {
      label,
      checked = false,
      indeterminate = false,
      onChange,
      inactive = false,
      className,
      checkedIcon: CheckedIcon,
      uncheckedIcon: UncheckedIcon,
      indeterminateIcon: IndeterminateIcon,
    },
    ref
  ) => {
    const handleClick = () => {
      if (!inactive) onChange?.(!checked);
    };

    const iconColor = indeterminate || checked ? 'var(--color-foreground-primary)' : 'var(--color-foreground-secondary)';
    const Icon = indeterminate ? IndeterminateIcon : checked ? CheckedIcon : UncheckedIcon;

    return (
      <div
        ref={ref}
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-inactive={inactive}
        tabIndex={inactive ? -1 : 0}
        className={cn(styles.checkbox, inactive && styles.inactive, className)}
        onClick={handleClick}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleClick(); } }}
      >
        {Icon ? <Icon size={20} color={iconColor} /> : (
          <span className={cn(styles.box, (checked || indeterminate) && styles.boxChecked)}>
            {(checked || indeterminate) && <span className={styles.checkmark}>{indeterminate ? '−' : '✓'}</span>}
          </span>
        )}
        <Text variant="text-body-medium" as="span" color="inherit">
          {label}
        </Text>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

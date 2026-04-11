import React, { forwardRef, useState } from 'react';
import { cn } from '@/utils/cn';
import styles from './Toggle.module.css';

export interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  inactive?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked = false, onChange, inactive = false, className, 'aria-label': ariaLabel }, ref) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
      if (inactive) return;
      e.preventDefault();
      setIsPressed(true);
    };

    const handleMouseUp = () => {
      if (inactive || !isPressed) return;
      setIsPressed(false);
      onChange?.(!checked);
    };

    const handleMouseLeave = () => {
      if (isPressed) setIsPressed(false);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={inactive}
        className={cn(styles.toggle, checked && styles.checked, inactive && styles.inactive, className)}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <span className={styles.thumb} />
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';

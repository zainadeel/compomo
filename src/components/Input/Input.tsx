import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import type { IconComponent } from '@/types/icons';
import styles from './Input.module.css';

export type InputType = 'text' | 'email' | 'tel' | 'url' | 'search' | 'password';

export interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  type?: InputType;
  inactive?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  /** Content rendered inside the field on the right. */
  suffix?: React.ReactNode;
  /** Icon for clear button (search type). */
  clearIcon?: IconComponent;
  'aria-label'?: string;
}

export const Input = forwardRef<HTMLDivElement, InputProps>(
  (
    {
      value,
      onChange,
      id,
      placeholder,
      autoFocus = false,
      className,
      type = 'text',
      inactive = false,
      onKeyDown,
      suffix,
      clearIcon: ClearIcon,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const showClear = type === 'search' && value.length > 0 && !inactive;

    const handleClear = () => {
      onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <div ref={ref} className={cn(styles.wrapper, className)}>
        <div className={styles.row}>
          <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className={styles.input}
            autoFocus={autoFocus}
            disabled={inactive}
            aria-label={ariaLabel}
          />
          {showClear && (
            <button type="button" className={styles.clearButton} onClick={handleClear} aria-label="Clear">
              {ClearIcon ? <ClearIcon size={16} /> : <span aria-hidden>&times;</span>}
            </button>
          )}
          {suffix && <div className={styles.suffix}>{suffix}</div>}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

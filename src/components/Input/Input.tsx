import React, { forwardRef, useEffect, useId } from 'react';
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
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Marks the input as invalid; sets `aria-invalid` and applies error styling. */
  error?: boolean;
  /** Message rendered below the input when `error` is true; auto-linked via `aria-describedby`. */
  errorMessage?: string;
}

const isDevEnv = (): boolean => {
  const meta = import.meta as { env?: { DEV?: boolean } };
  return Boolean(meta.env?.DEV);
};

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
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      error = false,
      errorMessage,
    },
    ref
  ) => {
    const reactId = useId();
    const errorId = `${reactId}-error`;
    const showClear = type === 'search' && value.length > 0 && !inactive;
    const showErrorMessage = error && Boolean(errorMessage);

    const describedBy =
      [ariaDescribedBy, showErrorMessage ? errorId : undefined].filter(Boolean).join(' ') ||
      undefined;

    useEffect(() => {
      if (!isDevEnv()) return;
      if (!id && !ariaLabel && !ariaLabelledBy) {
        console.warn(
          '[@ds-mo/ui] <Input> is missing an accessible name. Provide one of: `id` (paired with a <label htmlFor>), `aria-label`, or `aria-labelledby`.'
        );
      }
    }, [id, ariaLabel, ariaLabelledBy]);

    const handleClear = () => {
      onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <div className={styles.container}>
        <div ref={ref} className={cn(styles.wrapper, error && styles.wrapperError, className)}>
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
              aria-labelledby={ariaLabelledBy}
              aria-describedby={describedBy}
              aria-invalid={error || undefined}
            />
            {showClear && (
              <button type="button" className={styles.clearButton} onClick={handleClear} aria-label="Clear">
                {ClearIcon ? <ClearIcon size={16} /> : <span aria-hidden>&times;</span>}
              </button>
            )}
            {suffix && <div className={styles.suffix}>{suffix}</div>}
          </div>
        </div>
        {showErrorMessage && (
          <div id={errorId} role="alert" className={styles.errorText}>
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

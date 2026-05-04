import React, { forwardRef, useRef } from 'react';
import { cn } from '@/utils/cn';
import { Text } from '@/components/Text';
import styles from './Radio.module.css';

export interface RadioOption {
  label: string;
  value: string;
  inactive?: boolean;
}

export interface RadioGroupProps {
  /** Currently selected value. */
  value: string;
  /** Called when selection changes. */
  onChange: (value: string) => void;
  /** Radio options to render. */
  options: RadioOption[];
  /** Accessible name for the group. One of `aria-label` or `aria-labelledby` is required. */
  'aria-label'?: string;
  /** ID of an element labeling the group. One of `aria-label` or `aria-labelledby` is required. */
  'aria-labelledby'?: string;
  /** Layout direction. */
  direction?: 'vertical' | 'horizontal';
  /** Disables the entire group. */
  inactive?: boolean;
  className?: string;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      value,
      onChange,
      options,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      direction = 'vertical',
      inactive = false,
      className,
    },
    ref
  ) => {
    if (!ariaLabel && !ariaLabelledBy) {
      const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
        .process?.env?.NODE_ENV;
      if (env !== 'production') {
        console.warn(
          'RadioGroup: an accessible name is required. Pass either `aria-label` or `aria-labelledby`.'
        );
      }
    }

    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

    const isActive = (i: number) =>
      i >= 0 && i < options.length && !inactive && !options[i].inactive;

    const activeIndices = options.reduce<number[]>((acc, _, i) => {
      if (isActive(i)) acc.push(i);
      return acc;
    }, []);

    const selectedIdx = options.findIndex(o => o.value === value);
    const focusableIdx = isActive(selectedIdx)
      ? selectedIdx
      : (activeIndices[0] ?? -1);

    const focusAndSelect = (i: number) => {
      itemRefs.current[i]?.focus();
      if (options[i].value !== value) onChange(options[i].value);
    };

    const moveFocus = (from: number, delta: 1 | -1) => {
      if (activeIndices.length === 0) return;
      const pos = activeIndices.indexOf(from);
      // If focus somehow lands on an inactive radio, anchor at the boundary so
      // the first arrow keystroke moves to the nearest active option.
      const startPos = pos === -1 ? (delta === 1 ? -1 : 0) : pos;
      const nextPos =
        (startPos + delta + activeIndices.length) % activeIndices.length;
      focusAndSelect(activeIndices[nextPos]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const idx = itemRefs.current.findIndex(el => el === target);
      if (idx === -1) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(idx, 1);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(idx, -1);
          break;
        case 'Home':
          e.preventDefault();
          if (activeIndices.length) focusAndSelect(activeIndices[0]);
          break;
        case 'End':
          e.preventDefault();
          if (activeIndices.length)
            focusAndSelect(activeIndices[activeIndices.length - 1]);
          break;
      }
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onKeyDown={handleKeyDown}
        className={cn(
          styles.group,
          direction === 'horizontal' && styles.horizontal,
          className
        )}
      >
        {options.map((opt, i) => (
          <RadioItem
            key={opt.value}
            ref={el => {
              itemRefs.current[i] = el;
            }}
            label={opt.label}
            checked={value === opt.value}
            inactive={inactive || opt.inactive}
            tabIndex={i === focusableIdx ? 0 : -1}
            onChange={() => onChange(opt.value)}
          />
        ))}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

/* ─── Individual Radio Item ─────────────────────────────────────────────────── */

export interface RadioItemProps {
  label: string;
  checked?: boolean;
  onChange?: () => void;
  inactive?: boolean;
  /** Roving tabindex value. RadioGroup manages this; defaults to -1 when inactive, else 0. */
  tabIndex?: number;
  className?: string;
}

export const RadioItem = forwardRef<HTMLDivElement, RadioItemProps>(
  (
    { label, checked = false, onChange, inactive = false, tabIndex, className },
    ref
  ) => {
    const handleActivate = () => {
      if (!inactive && !checked) onChange?.();
    };

    const resolvedTabIndex = tabIndex ?? (inactive ? -1 : 0);

    return (
      <div
        ref={ref}
        role="radio"
        aria-checked={checked}
        aria-disabled={inactive || undefined}
        tabIndex={resolvedTabIndex}
        className={cn(styles.radio, inactive && styles.inactive, className)}
        onClick={handleActivate}
        onKeyDown={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleActivate();
          }
        }}
      >
        <span className={cn(styles.circle, checked && styles.circleChecked)}>
          {checked && <span className={styles.dot} />}
        </span>
        <Text variant="text-body-medium" as="span" color="inherit">
          {label}
        </Text>
      </div>
    );
  }
);

RadioItem.displayName = 'RadioItem';

import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { Text } from '@/components/Text';
import styles from './Slider.module.css';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  id?: string;
  inactive?: boolean;
  className?: string;
  /** Human-readable text for assistive tech when the numeric value alone isn't meaningful (e.g. "Low", "Medium", "High"). Maps to `aria-valuetext`. */
  valueText?: string;
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onChange, min = 0, max = 100, step = 1, label, id: idProp, inactive = false, className, valueText }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const containerRef = useRef<HTMLDivElement>(null);
    const [pct, setPct] = useState(() => {
      const range = max - min;
      return range === 0 ? 0 : Math.round(((value - min) / range) * 100);
    });

    const sync = useCallback(() => {
      const range = max - min;
      setPct(range === 0 ? 0 : Math.round(((value - min) / range) * 100));
    }, [value, min, max]);

    useEffect(() => { sync(); }, [sync]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    };

    return (
      <div ref={ref} className={cn(styles.field, className)}>
        <div className={styles.labelRow}>
          <Text variant="text-body-small-emphasis" as="label" htmlFor={id}>{label}</Text>
          <Text variant="text-body-small-emphasis" as="span">{value}</Text>
        </div>
        <div
          ref={containerRef}
          className={cn(styles.track, inactive && styles.trackInactive, pct === 0 && styles.trackAtMin)}
          style={{ '--slider-pct': pct } as React.CSSProperties}
        >
          <div className={styles.trackInner}>
            <div className={styles.fillTrack}><div className={styles.fill} /></div>
            <div className={styles.thumb} />
          </div>
          <input
            type="range"
            id={id}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleInput}
            disabled={inactive}
            className={styles.input}
            aria-valuetext={valueText}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';

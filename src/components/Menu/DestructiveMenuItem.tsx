import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Text } from '@/components/Text';
import styles from './DestructiveMenuItem.module.css';

export interface DestructiveMenuItemProps {
  label: string;
  onClick: () => void;
  holdDuration?: number;
  subtext?: string;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLButtonElement>) => void;
}

export const DestructiveMenuItem = forwardRef<HTMLButtonElement, DestructiveMenuItemProps>(
  ({ label, onClick, holdDuration = 4000, subtext, tabIndex, onKeyDown, onFocus }, ref) => {
    const [progress, setProgress] = useState(0);
    const pressTimerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const isHoldingRef = useRef(false);

    const resetState = () => {
      setProgress(0);
      isHoldingRef.current = false;
      if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
      if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    };

    const startHold = () => {
      if (isHoldingRef.current) return;
      isHoldingRef.current = true;
      if (holdDuration === 0) { onClick(); resetState(); return; }
      startTimeRef.current = performance.now();
      const animate = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
        setProgress(newProgress);
        if (newProgress < 100) animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
      pressTimerRef.current = window.setTimeout(() => { onClick(); resetState(); }, holdDuration);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      startHold();
    };

    const handleMouseUp = (e: React.MouseEvent) => { e.stopPropagation(); resetState(); };
    const handleMouseLeave = (e: React.MouseEvent) => { e.stopPropagation(); resetState(); };

    const isSpaceKey = (e: React.KeyboardEvent) => e.key === ' ' || e.key === 'Spacebar';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isSpaceKey(e)) {
        e.preventDefault();
        if (e.repeat) return;
        e.stopPropagation();
        startHold();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        return;
      }
      onKeyDown?.(e);
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isSpaceKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        resetState();
      }
    };

    const handleBlur = () => { resetState(); };

    useEffect(() => () => { resetState(); }, []);

    return (
      <button
        ref={ref}
        className={styles.destructiveMenuItem}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={handleBlur}
        onFocus={onFocus}
        type="button"
        role="menuitem"
        tabIndex={tabIndex ?? -1}
        aria-keyshortcuts="Space"
      >
        <div
          className={styles.progressFill}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Hold to confirm ${label}`}
        />
        <div className={styles.content}>
          <Text variant="text-body-medium" as="span" className={styles.label}>{label}</Text>
          {subtext && <Text variant="text-body-small" as="span" className={styles.subtext}>{subtext}</Text>}
        </div>
      </button>
    );
  }
);

DestructiveMenuItem.displayName = 'DestructiveMenuItem';

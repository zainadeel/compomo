import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { Tab } from '@/components/Tab';
import styles from './TabGroup.module.css';

export interface TabGroupTab {
  label: string;
  /** id for the tab. Pair with `panelId` to wire SR semantics on the consumer's tabpanel. */
  id?: string;
  /** id of the tabpanel this tab controls. Forwarded to the Tab as `aria-controls`. */
  panelId?: string;
  disabled?: boolean;
}

export interface TabGroupProps {
  /** Tab definitions. */
  tabs: TabGroupTab[];
  /** Index of the active tab. */
  activeIndex?: number;
  /** Called when a tab is activated (click or keyboard). */
  onTabChange?: (index: number) => void;
  /** Tablist orientation. Determines which arrow keys navigate. */
  orientation?: 'horizontal' | 'vertical';
  /** Accessible label for the tablist. */
  'aria-label'?: string;
  /** id of an external label for the tablist. */
  'aria-labelledby'?: string;
  className?: string;
}

export const TabGroup = forwardRef<HTMLDivElement, TabGroupProps>(
  (
    {
      tabs,
      activeIndex = 0,
      onTabChange,
      orientation = 'horizontal',
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref,
  ) => {
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    const updateIndicator = useCallback(() => {
      const el = tabsRef.current[activeIndex];
      if (el) {
        setIndicator({
          left: el.offsetLeft,
          width: el.offsetWidth,
        });
      }
    }, [activeIndex]);

    useEffect(() => {
      updateIndicator();
    }, [updateIndicator]);

    useEffect(() => {
      const observer = new ResizeObserver(updateIndicator);
      const container = tabsRef.current[0]?.parentElement;
      if (container) observer.observe(container);
      return () => observer.disconnect();
    }, [updateIndicator]);

    const findEnabled = useCallback(
      (from: number, step: number): number => {
        const len = tabs.length;
        if (len === 0) return from;
        let i = from;
        for (let n = 0; n < len; n++) {
          i = (i + step + len) % len;
          if (!tabs[i].disabled) return i;
        }
        return from;
      },
      [tabs],
    );

    const activate = useCallback(
      (index: number) => {
        if (index !== activeIndex) onTabChange?.(index);
        tabsRef.current[index]?.focus();
      },
      [activeIndex, onTabChange],
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const isHorizontal = orientation !== 'vertical';
      const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
      const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

      let nextIndex: number | null = null;
      if (e.key === nextKey) {
        nextIndex = findEnabled(activeIndex, 1);
      } else if (e.key === prevKey) {
        nextIndex = findEnabled(activeIndex, -1);
      } else if (e.key === 'Home') {
        nextIndex = findEnabled(-1, 1);
      } else if (e.key === 'End') {
        nextIndex = findEnabled(tabs.length, -1);
      }

      if (nextIndex !== null) {
        e.preventDefault();
        activate(nextIndex);
      }
    };

    return (
      <div
        ref={ref}
        role="tablist"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
        onKeyDown={handleKeyDown}
        className={cn(styles.tabGroup, className)}
      >
        <div className={styles.tabsRow}>
          {tabs.map((tab, i) => (
            <Tab
              key={tab.id ?? i}
              ref={el => { tabsRef.current[i] = el; }}
              id={tab.id}
              controls={tab.panelId}
              label={tab.label}
              isSelected={i === activeIndex}
              disabled={tab.disabled}
              onClick={() => onTabChange?.(i)}
            />
          ))}
        </div>
        <div className={styles.track}>
          <div
            className={styles.indicator}
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: indicator.width,
            }}
          />
        </div>
      </div>
    );
  }
);

TabGroup.displayName = 'TabGroup';

import React from 'react';
import { cn } from '@/utils/cn';
import styles from './LabelWrap.module.css';

interface LabelWrapProps {
  children: React.ReactNode;
  /**
   * Maps to typography size — controls optical horizontal padding:
   *   xs  → 2px (caption scale)
   *   sm | md | lg → 4px (body scale, default)
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Enables truncation with ellipsis — use inside full-width containers. */
  truncate?: boolean;
  className?: string;
}

/**
 * Internal utility wrapper used inside interactive components (Button, Tag,
 * Input, Select, MenuItem, etc.) to:
 *   1. Kill the inherited line-height strut from body { line-height: 1.5 }
 *   2. Add optical horizontal padding around the text
 *
 * Not exported from the public barrel — internal use only.
 */
export const LabelWrap = ({ children, size = 'md', truncate = false, className }: LabelWrapProps) => (
  <span className={cn(styles.labelWrap, size === 'xs' && styles.sizeXs, truncate && styles.truncate, className)}>
    {children}
  </span>
);

LabelWrap.displayName = 'LabelWrap';

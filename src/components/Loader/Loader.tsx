import React from 'react';
import styles from './Loader.module.css';

export interface LoaderProps {
  /**
   * Render size in px. Designed at 16px (r=6, strokeWidth=1).
   * Stroke weight scales proportionally with size — same behaviour as icons.
   * Defaults to 20.
   */
  size?: number;
  className?: string;
  /**
   * Accessible label announced by assistive tech when the Loader is used
   * standalone. When provided, the spinner is wrapped in a live region
   * (`role="status"`, `aria-live="polite"`) and the label is rendered
   * visually-hidden so screen readers announce it on mount.
   *
   * Omit when the Loader is rendered inside a host that already conveys
   * busy state (e.g. a Button with `aria-busy`) — the spinner stays
   * `aria-hidden` to avoid double-announcing.
   */
  label?: string;
}

/**
 * Placeholder spinner component. Will be replaced with a full Loader
 * component once motion/brand specs are finalised.
 *
 * Designed at 16×16 viewBox so it matches the icon grid:
 *   - r=5  → 10px circle in a 16px box (3px optical padding each side)
 *   - strokeWidth=1 at native size → scales to 1.25px at 20px, 1.5px at 24px
 */
export const Loader = ({ size = 20, className, label }: LoaderProps) => {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={`${styles.loader}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="23.6 7.9"
      />
    </svg>
  );

  if (label === undefined) return svg;

  return (
    <span role="status" aria-live="polite" className={styles.status}>
      {svg}
      <span className={styles.visuallyHidden}>{label}</span>
    </span>
  );
};

Loader.displayName = 'Loader';

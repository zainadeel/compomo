import React from 'react';
import { Text } from '@/components/Text';
import styles from './Badge.module.css';

export interface BadgeProps {
  count: number;
  isSelected?: boolean;
  className?: string;
  /**
   * Accessible label announced by screen readers. Takes precedence over `labelFormat`.
   * Provide this when the badge has a specific meaning (e.g. `"3 unread messages"`).
   */
  'aria-label'?: string;
  /**
   * Formats the accessible label from the count. Used when `aria-label` is not provided.
   * Defaults to returning the count as a string.
   */
  labelFormat?: (count: number) => string;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  isSelected = false,
  className,
  'aria-label': ariaLabel,
  labelFormat,
}) => {
  if (count === 0) return null;
  const displayText = count > 9 ? '+' : count.toString();
  const accessibleLabel = ariaLabel ?? labelFormat?.(count) ?? String(count);
  return (
    <span className={`${styles.badge} ${className || ''}`} aria-label={accessibleLabel}>
      <Text variant="text-caption-emphasis" as="span" color={isSelected ? 'primary' : 'secondary'}>
        {displayText}
      </Text>
    </span>
  );
};

Badge.displayName = 'Badge';

import React, { forwardRef } from 'react';
import { Text } from '@/components/Text';
import { Surface } from '@/components/Surface';
import type { IconComponent } from '@/types';
import styles from './MenuItem.module.css';

export type MenuItemSelectionStyle = 'highlight' | 'radio' | 'noOverlay';

export type MenuItemRole = 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';

export interface MenuItemProps {
  label: string;
  onClick: () => void;
  isSelected?: boolean;
  isInactive?: boolean;
  icon?: IconComponent;
  labelColor?: 'primary' | 'secondary' | 'tertiary';
  subtext?: string;
  showToggle?: boolean;
  toggleValue?: boolean;
  intent?: 'negative';
  selectionStyle?: MenuItemSelectionStyle;
  showTrailingChevron?: boolean;
  checkIcon?: IconComponent;
  chevronIcon?: IconComponent;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLButtonElement>) => void;
}

export const MenuItem = forwardRef<HTMLButtonElement, MenuItemProps>(
  ({
    label,
    onClick,
    isSelected = false,
    isInactive = false,
    icon: Icon,
    labelColor,
    subtext,
    showToggle = false,
    toggleValue = false,
    intent,
    selectionStyle = 'highlight',
    showTrailingChevron = false,
    checkIcon: CheckIcon,
    chevronIcon: ChevronIcon,
    tabIndex,
    onKeyDown,
    onFocus,
  }, ref) => {
    const useRadioStyle = selectionStyle === 'radio';
    const noOverlay = selectionStyle === 'noOverlay' || useRadioStyle;
    const showSelectedOverlay = isSelected && !noOverlay;

    const role: MenuItemRole = showToggle
      ? 'menuitemcheckbox'
      : useRadioStyle
        ? 'menuitemradio'
        : 'menuitem';

    const ariaChecked: boolean | undefined =
      role === 'menuitemcheckbox'
        ? !!toggleValue
        : role === 'menuitemradio'
          ? !!isSelected
          : undefined;

    return (
      <Surface
        ref={ref as React.Ref<HTMLElement>}
        as="button"
        interactive={!isInactive}
        selected={showSelectedOverlay}
        radius="sm"
        className={`${styles.menuItem} ${isSelected ? styles.menuItemSelected : ''} ${isInactive ? styles.menuItemInactive : ''} ${intent === 'negative' ? styles.menuItemNegative : ''} ${labelColor === 'tertiary' ? styles.menuItemLabelTertiary : ''}`}
        onClick={onClick}
        type="button"
        inactive={isInactive}
        role={role}
        tabIndex={tabIndex ?? -1}
        aria-checked={ariaChecked}
        aria-disabled={isInactive || undefined}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
      >
        {Icon && (
          <div className={styles.iconPrefix} aria-hidden="true">
            <Icon size={20} />
          </div>
        )}
        <div className={styles.content}>
          <Text
            variant={isSelected ? 'text-body-medium-emphasis' : 'text-body-medium'}
            color={labelColor}
            as="span"
            className={styles.label}
          >
            {label}
          </Text>
          {subtext && (
            <Text variant="text-body-small" as="span" className={styles.subtext}>
              {subtext}
            </Text>
          )}
        </div>
        {showToggle && (
          <div className={styles.toggleSuffix} aria-hidden="true">
            <div className={`${styles.toggle} ${toggleValue ? styles.toggleOn : ''}`}>
              <div className={styles.toggleThumb} />
            </div>
          </div>
        )}
        {useRadioStyle && isSelected && CheckIcon && (
          <div className={styles.checkSuffix} aria-hidden="true">
            <CheckIcon size={20} />
          </div>
        )}
        {showTrailingChevron && ChevronIcon && (
          <div className={styles.chevronSuffix} aria-hidden="true">
            <ChevronIcon size={20} />
          </div>
        )}
      </Surface>
    );
  }
);

MenuItem.displayName = 'MenuItem';

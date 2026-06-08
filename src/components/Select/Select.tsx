import React, { forwardRef, useId, useState, useRef, useEffect, useCallback } from 'react';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import type { MenuItemData } from '../../wc/components/Menu/Menu';
import type { IconComponent } from '@/types';
import styles from './Select.module.css';
import '../../../../dist/components/ds-menu.js';

type DsMenuEl = HTMLElement & {
  open: boolean;
  items: MenuItemData[];
  anchor?: HTMLElement;
  menuWidth?: string;
  side?: string;
  align?: string;
};

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  inactive?: boolean;
  id?: string;
  chevronIcon?: IconComponent;
  /** Accessible name. Required when no associated `<label htmlFor>` element exists. */
  'aria-label'?: string;
  /** Accessible name reference. Use when a visible label already exists outside the trigger. */
  'aria-labelledby'?: string;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder = 'Select option',
      className,
      inactive = false,
      id,
      chevronIcon: ChevronIcon,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref
  ) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<DsMenuEl | null>(null);

    const reactId = useId();
    const triggerId = id ?? `select-${reactId}`;

    const selectedIndex = options.findIndex(opt => opt.value === value);
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
    const selectedLabel = selectedOption?.label || placeholder;

    const syncMenuItems = useCallback(() => {
      const menu = menuRef.current;
      if (!menu) return;
      menu.items = options.map(opt => ({
        label: opt.label,
        value: String(opt.value),
        isSelected: opt.value === value,
      }));
    }, [options, value]);

    useEffect(() => {
      const menu = menuRef.current;
      const trigger = buttonRef.current;
      if (!menu || !trigger) return;

      menu.anchor = trigger;

      const onSelect = (e: Event) => {
        const detail = (e as CustomEvent<MenuItemData>).detail;
        if (detail?.value === undefined) return;
        const matched = options.find(opt => String(opt.value) === detail.value);
        onChange(matched?.value ?? detail.value);
        setIsMenuOpen(false);
      };
      const onClose = () => setIsMenuOpen(false);

      menu.addEventListener('dsSelect', onSelect);
      menu.addEventListener('dsClose', onClose);
      return () => {
        menu.removeEventListener('dsSelect', onSelect);
        menu.removeEventListener('dsClose', onClose);
      };
    }, [onChange, options]);

    useEffect(() => {
      const menu = menuRef.current;
      if (!menu) return;
      menu.open = isMenuOpen;
    }, [isMenuOpen]);

    useEffect(() => {
      syncMenuItems();
    }, [syncMenuItems]);

    const openMenu = () => {
      if (inactive || options.length === 0) return;
      const menu = menuRef.current;
      const trigger = buttonRef.current;
      if (menu && trigger) {
        menu.menuWidth = `${trigger.offsetWidth}px`;
        menu.anchor = trigger;
      }
      syncMenuItems();
      setIsMenuOpen(true);
    };

    const handleToggle = () => {
      if (inactive) return;
      if (isMenuOpen) {
        setIsMenuOpen(false);
      } else {
        openMenu();
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (inactive || options.length === 0) return;

      if (!isMenuOpen) {
        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowUp':
          case 'Enter':
          case ' ':
            event.preventDefault();
            openMenu();
            break;
          default:
            break;
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMenuOpen(false);
        buttonRef.current?.focus();
      }
    };

    return (
      <div ref={ref} className={`${styles.selectWrapper} ${className || ''}`}>
        <Surface
          id={triggerId}
          ref={buttonRef as React.RefObject<HTMLElement>}
          as="button"
          type="button"
          elevation="elevated"
          radius="sm"
          interactive
          selected={isMenuOpen}
          className={styles.selectButton}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          inactive={inactive}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isMenuOpen}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
        >
          <Text
            variant="text-body-medium"
            as="span"
            color={selectedOption ? 'primary' : 'secondary'}
          >
            {selectedLabel}
          </Text>
          {ChevronIcon && (
            <span className={styles.chevron}>
              <ChevronIcon size={16} />
            </span>
          )}
        </Surface>
        {React.createElement('ds-menu', {
          ref: (el: DsMenuEl | null) => {
            menuRef.current = el;
          },
          side: 'bottom',
          align: 'start',
        })}
      </div>
    );
  }
);

Select.displayName = 'Select';

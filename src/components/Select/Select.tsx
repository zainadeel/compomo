import React, { forwardRef, useId, useState, useRef, useEffect, useCallback } from 'react';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { Menu } from '@/components/Menu';
import type { MenuItemData } from '@/components/Menu';
import type { IconComponent } from '@/types';
import styles from './Select.module.css';

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
    const [activeIndex, setActiveIndex] = useState(-1);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const reactId = useId();
    const triggerId = id ?? `select-${reactId}`;
    const listboxId = `${triggerId}-listbox`;
    const getOptionId = useCallback((index: number) => `${triggerId}-option-${index}`, [triggerId]);

    const selectedIndex = options.findIndex(opt => opt.value === value);
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
    const selectedLabel = selectedOption?.label || placeholder;

    const commitSelection = useCallback(
      (index: number) => {
        const option = options[index];
        if (!option) return;
        onChange(option.value);
        setIsMenuOpen(false);
      },
      [options, onChange]
    );

    const openWith = useCallback(
      (initialIndex: number) => {
        if (inactive || options.length === 0) return;
        const clamped = Math.max(0, Math.min(options.length - 1, initialIndex));
        setActiveIndex(clamped);
        setIsMenuOpen(true);
      },
      [inactive, options.length]
    );

    useEffect(() => {
      if (isMenuOpen) {
        setActiveIndex(prev => {
          if (prev >= 0 && prev < options.length) return prev;
          return selectedIndex >= 0 ? selectedIndex : 0;
        });
      } else {
        setActiveIndex(-1);
      }
    }, [isMenuOpen, options.length, selectedIndex]);

    const menuItems: MenuItemData[] = options.map((option, index) => ({
      label: option.label,
      onClick: () => commitSelection(index),
      isSelected: option.value === value,
    }));

    const handleToggle = () => {
      if (inactive) return;
      if (isMenuOpen) {
        setIsMenuOpen(false);
      } else {
        openWith(selectedIndex >= 0 ? selectedIndex : 0);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (inactive || options.length === 0) return;
      const last = options.length - 1;

      if (!isMenuOpen) {
        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowUp':
          case 'Enter':
          case ' ':
            event.preventDefault();
            openWith(selectedIndex >= 0 ? selectedIndex : 0);
            return;
          case 'Home':
            event.preventDefault();
            openWith(0);
            return;
          case 'End':
            event.preventDefault();
            openWith(last);
            return;
          default:
            return;
        }
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setActiveIndex(prev => Math.min(last, (prev < 0 ? -1 : prev) + 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setActiveIndex(prev => Math.max(0, (prev < 0 ? options.length : prev) - 1));
          break;
        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setActiveIndex(last);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (activeIndex >= 0) commitSelection(activeIndex);
          break;
        case 'Escape':
          event.preventDefault();
          setIsMenuOpen(false);
          break;
        case 'Tab':
          setIsMenuOpen(false);
          break;
      }
    };

    const activeDescendantId =
      isMenuOpen && activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

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
          aria-controls={isMenuOpen ? listboxId : undefined}
          aria-activedescendant={activeDescendantId}
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
        <Menu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          anchorRef={buttonRef as React.RefObject<HTMLElement | null>}
          items={menuItems}
          side="bottom"
          align="start"
          sideOffset={4}
          alignOffset={-4}
          matchAnchorWidth
          matchAnchorWidthOffset={8}
          role="listbox"
          id={listboxId}
          activeIndex={activeIndex}
          getOptionId={getOptionId}
        />
      </div>
    );
  }
);

Select.displayName = 'Select';

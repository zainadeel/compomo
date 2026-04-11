import React, { forwardRef, useState, useRef } from 'react';
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
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onChange, options, placeholder = 'Select option', className, inactive = false, id, chevronIcon: ChevronIcon }, ref) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const selectedOption = options.find(opt => opt.value === value);
    const selectedLabel = selectedOption?.label || placeholder;

    const menuItems: MenuItemData[] = options.map(option => ({
      label: option.label,
      onClick: () => {
        onChange(option.value);
        setIsMenuOpen(false);
      },
      isSelected: option.value === value,
    }));

    const handleToggle = () => {
      if (!inactive) setIsMenuOpen(prev => !prev);
    };

    return (
      <div ref={ref} className={`${styles.selectWrapper} ${className || ''}`}>
        <Surface
          id={id}
          ref={buttonRef as React.RefObject<HTMLElement>}
          as="button"
          type="button"
          elevation="elevated"
          radius="sm"
          interactive
          selected={isMenuOpen}
          className={styles.selectButton}
          onClick={handleToggle}
          inactive={inactive}
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
        />
      </div>
    );
  }
);

Select.displayName = 'Select';

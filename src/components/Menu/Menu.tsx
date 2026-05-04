import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Text } from '@/components/Text';
import { Surface } from '@/components/Surface';
import { MenuItem as MenuItemComponent } from './MenuItem';
import { DestructiveMenuItem } from './DestructiveMenuItem';
import { getCssSpacePx } from '@/utils/css-tokens';
import type { IconComponent } from '@/types';
import type { MenuItemSelectionStyle } from './MenuItem';
import styles from './Menu.module.css';

const CLOSE_ANIMATION_MS = 220;

export type MenuSide = 'top' | 'right' | 'bottom' | 'left';
export type MenuAlign = 'start' | 'center' | 'end';

export interface MenuItemData {
  label: string;
  onClick: () => void;
  isSelected?: boolean;
  isDestructive?: boolean;
  isInactive?: boolean;
  intent?: 'negative';
  keepOpenOnClick?: boolean;
  holdDuration?: number;
  icon?: IconComponent;
  subtext?: string;
  showToggle?: boolean;
  toggleValue?: boolean;
  selectionStyle?: MenuItemSelectionStyle;
}

export interface MenuSection {
  header?: string;
  items: MenuItemData[];
}

export interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  items?: MenuItemData[];
  sections?: MenuSection[];
  side?: MenuSide;
  align?: MenuAlign;
  sideOffset?: number;
  alignOffset?: number;
  sideOffsetToken?: string;
  alignOffsetToken?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  matchAnchorWidth?: boolean;
  matchAnchorWidthOffset?: number;
  usePortal?: boolean;
  /** Container role + item role semantics. Defaults to `menu` (items are buttons). `listbox` makes items render as `option` with `aria-selected`. */
  role?: 'menu' | 'listbox';
  /** DOM id for the popup container — required when an external combobox references it via `aria-controls`/`aria-activedescendant`. */
  id?: string;
  /** Accessible label for the popup container. Defaults to `'Menu'` for menu role; omitted for listbox (let consumer provide via aria-labelledby on the combobox). */
  ariaLabel?: string;
  /** Active descendant index for listbox keyboard nav — highlights one option visually without moving DOM focus. */
  activeIndex?: number;
  /** Builds the DOM id for option `index`. Required in listbox mode if `aria-activedescendant` is used externally. */
  getOptionId?: (index: number) => string;
}

export const Menu: React.FC<MenuProps> = ({
  isOpen,
  onClose,
  anchorRef,
  items,
  sections,
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  alignOffset = 0,
  sideOffsetToken,
  alignOffsetToken,
  width,
  minWidth,
  maxWidth,
  matchAnchorWidth = false,
  matchAnchorWidthOffset = 0,
  usePortal = true,
  role = 'menu',
  id,
  ariaLabel,
  activeIndex,
  getOptionId,
}) => {
  const isListbox = role === 'listbox';
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isPositionReady, setIsPositionReady] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menuSize, setMenuSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [anchorSize, setAnchorSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const positionCalculatedRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastSectionsRef = useRef<MenuSection[]>([]);

  const menuSections: MenuSection[] = sections || (items ? [{ items }] : []);

  const hasItems = menuSections.some((s) => s.items.length > 0);
  if (!isClosing && menuSections.length > 0 && hasItems) {
    lastSectionsRef.current = menuSections;
  }
  const sectionsToRender = isClosing ? lastSectionsRef.current : menuSections;

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setIsPositionReady(false);
      positionCalculatedRef.current = false;
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        positionCalculatedRef.current = false;
      }, CLOSE_ANIMATION_MS);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  useLayoutEffect(() => {
    if (!isOpen || !shouldRender || !menuRef.current) return;
    const updateSize = () => {
      if (!menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setMenuSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    requestAnimationFrame(() => requestAnimationFrame(updateSize));
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(menuRef.current);
      return () => observer.disconnect();
    }
  }, [isOpen, shouldRender, menuSections.length]);

  useLayoutEffect(() => {
    if (!isOpen || !shouldRender || !anchorRef.current || !menuRef.current) return;
    const calculatePosition = () => {
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      if (!anchor || !menu) return;
      const anchorRect = anchor.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const menuWidth = menuRect.width || menuSize.width || 200;
      const menuHeight = menuRect.height || menuSize.height || 160;
      setAnchorSize({ width: anchorRect.width, height: anchorRect.height });
      const gap = sideOffsetToken != null ? getCssSpacePx(sideOffsetToken, 12) : sideOffset;
      const alignOff = alignOffsetToken != null ? getCssSpacePx(alignOffsetToken, 4) : alignOffset;
      let x = 0, y = 0;
      switch (side) {
        case 'top':
          y = anchorRect.top - menuHeight - gap;
          x = align === 'start' ? anchorRect.left + alignOff : align === 'end' ? anchorRect.right - menuWidth + alignOff : anchorRect.left + anchorRect.width / 2 - menuWidth / 2 + alignOff;
          break;
        case 'bottom':
          y = anchorRect.bottom + gap;
          x = align === 'start' ? anchorRect.left + alignOff : align === 'end' ? anchorRect.right - menuWidth + alignOff : anchorRect.left + anchorRect.width / 2 - menuWidth / 2 + alignOff;
          break;
        case 'left':
          x = anchorRect.left - menuWidth - gap;
          y = align === 'start' ? anchorRect.top + alignOff : align === 'end' ? anchorRect.bottom - menuHeight + alignOff : anchorRect.top + anchorRect.height / 2 - menuHeight / 2 + alignOff;
          break;
        case 'right':
          x = anchorRect.right + gap;
          y = align === 'start' ? anchorRect.top + alignOff : align === 'end' ? anchorRect.bottom - menuHeight + alignOff : anchorRect.top + anchorRect.height / 2 - menuHeight / 2 + alignOff;
          break;
      }
      const vp = 4;
      setPosition({
        x: Math.min(Math.max(x, vp), window.innerWidth - menuWidth - vp),
        y: Math.min(Math.max(y, vp), window.innerHeight - menuHeight - vp),
      });
      positionCalculatedRef.current = true;
      setIsPositionReady(true);
    };
    if (!positionCalculatedRef.current) {
      calculatePosition();
      requestAnimationFrame(() => { if (!positionCalculatedRef.current) calculatePosition(); });
    }
    const handleScrollResize = () => calculatePosition();
    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);
    return () => {
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
    };
  }, [isOpen, shouldRender, anchorRef, side, align, sideOffset, alignOffset, sideOffsetToken, alignOffsetToken, menuSize.width, menuSize.height, menuSections.length, matchAnchorWidthOffset]);

  useEffect(() => {
    if (!isOpen || !shouldRender) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (menuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isOpen, shouldRender, onClose, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!shouldRender || sectionsToRender.length === 0) return null;

  const renderMenuItem = (item: MenuItemData, key: number, flatIndex: number) => {
    if (item.isDestructive) {
      return (
        <DestructiveMenuItem
          key={key}
          label={item.label}
          subtext={item.subtext}
          holdDuration={item.holdDuration ?? 4000}
          onClick={() => { item.onClick(); if (!item.keepOpenOnClick) onClose(); }}
        />
      );
    }
    const optionId = isListbox && getOptionId ? getOptionId(flatIndex) : undefined;
    return (
      <MenuItemComponent
        key={key}
        icon={item.icon}
        label={item.label}
        subtext={item.subtext}
        onClick={() => { if (!item.isInactive) { item.onClick(); if (!item.keepOpenOnClick) onClose(); } }}
        isSelected={item.isSelected}
        isInactive={item.isInactive}
        intent={item.intent}
        showToggle={item.showToggle}
        toggleValue={item.toggleValue}
        selectionStyle={item.selectionStyle}
        role={isListbox ? 'option' : undefined}
        id={optionId}
        ariaSelected={isListbox ? !!item.isSelected : undefined}
        isActive={isListbox && activeIndex === flatIndex}
        tabIndex={isListbox ? -1 : undefined}
      />
    );
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate(${Math.round(position.x)}px, ${Math.round(position.y)}px)`,
    willChange: 'transform',
    zIndex: 9998,
    visibility: isPositionReady ? 'visible' : 'hidden',
    ...(matchAnchorWidth && anchorSize.width > 0 ? { width: `${anchorSize.width + matchAnchorWidthOffset}px` } : width ? { width } : {}),
    ...(minWidth ? { minWidth } : {}),
    ...(maxWidth ? { maxWidth } : {}),
  };

  let flatIndexCounter = 0;
  const containerLabel = ariaLabel ?? (isListbox ? undefined : 'Menu');
  const menuContent = (
    <div
      ref={menuRef}
      id={id}
      className={`${styles.menuContainer} ${isClosing ? styles.closing : ''}`}
      style={menuStyle}
      role={role}
      aria-label={containerLabel}
    >
      {sectionsToRender.map((section, sectionIndex) => (
        <Surface
          key={sectionIndex}
          as="div"
          className={styles.menuSection}
          edge={sectionIndex < sectionsToRender.length - 1 ? 'bottom' : undefined}
          elevation="none"
        >
          {section.header && (
            <div className={styles.sectionHeader}>
              <Text variant="text-body-small-emphasis" as="span" className={styles.sectionLabel}>{section.header}</Text>
            </div>
          )}
          {section.items.map((item, itemIndex) => renderMenuItem(item, itemIndex, flatIndexCounter++))}
        </Surface>
      ))}
    </div>
  );

  if (usePortal) return createPortal(menuContent, document.body);
  return menuContent;
};

Menu.displayName = 'Menu';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import styles from './Modal.module.css';

export type ModalWidth = 'sm' | 'md' | 'lg';

const WIDTH_MAP: Record<ModalWidth, string> = {
  sm: 'var(--dimension-modal-width-sm, 400px)',
  md: 'var(--dimension-modal-width-md, 560px)',
  lg: 'var(--dimension-modal-width-lg, 720px)',
};

const CLOSE_ANIMATION_MS = 220;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (root: HTMLElement): HTMLElement[] => {
  const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: ModalWidth | string;
  bodyClassName?: string;
  initialFocus?: React.RefObject<HTMLElement>;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
  bodyClassName,
  initialFocus,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  const resolvedWidth = useMemo(() => {
    if (width === 'sm' || width === 'md' || width === 'lg') {
      return WIDTH_MAP[width];
    }
    return width;
  }, [width]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, CLOSE_ANIMATION_MS);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !shouldRender) return;
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const id = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (initialFocus?.current) {
        initialFocus.current.focus();
        return;
      }
      const focusables = getFocusableElements(dialog);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialog.focus();
      }
    });
    return () => {
      cancelAnimationFrame(id);
      const previous = previouslyFocusedRef.current;
      if (previous && document.contains(previous)) {
        previous.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [isOpen, shouldRender, initialFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = getFocusableElements(dialog);
    if (focusables.length === 0) {
      e.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || active === dialog || !dialog.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!shouldRender) return null;

  const describedById = subtitle != null ? subtitleId : undefined;

  return createPortal(
    <div
      className={`${styles.backdrop} ${isClosing ? styles.closing : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <Surface
        ref={dialogRef}
        background="primary"
        elevation="floating"
        radius="var(--dimension-radius-275, 22px)"
        className={styles.dialog}
        style={{ width: `min(${resolvedWidth}, calc(100vw - 32px))` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <Text id={titleId} as="h2" variant="text-title-small">
            {title}
          </Text>
          {subtitle != null && (
            <div id={subtitleId} className={styles.subtitle}>
              {subtitle}
            </div>
          )}
        </div>
        <div className={`${styles.body} ${bodyClassName ?? ''}`.trim()}>
          {children}
        </div>
        {footer != null && (
          <div className={styles.footer}>{footer}</div>
        )}
      </Surface>
    </div>,
    document.body
  );
};

Modal.displayName = 'Modal';

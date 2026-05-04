import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { getCssTimeMs } from '@/utils/css-tokens';
import { Text } from '@/components/Text';
import styles from './Tooltip.module.css';

const HOVER_DELAY_FALLBACK_MS = 1000;
const INSTANT_REOPEN_MS = 300;
const FADE_OUT_DURATION_MS = 200;

let lastTooltipDismissedAt = 0;

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';

export interface TooltipProps {
  label: string;
  children: React.ReactElement;
  delay?: number;
  side?: TooltipSide;
  align?: TooltipAlign;
  sideOffset?: number;
  alignOffset?: number;
  shortcutKey?: string;
  shortcutKeyPosition?: 'start' | 'end';
  usePortal?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  label,
  children,
  delay,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  alignOffset = 0,
  shortcutKey,
  shortcutKeyPosition = 'end',
  usePortal = true,
}) => {
  const hoverDelayMs = getCssTimeMs('--effect-animation-delay-medium-3', HOVER_DELAY_FALLBACK_MS);
  const resolvedDelay = delay ?? hoverDelayMs;
  const anchorRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const setAnchorRef = useCallback(
    (el: HTMLElement | null) => {
      (anchorRef as React.MutableRefObject<HTMLElement | null>).current = el;
      const childEl = React.Children.only(children) as React.ReactElement<{ ref?: React.Ref<unknown> }>;
      const childRef = 'ref' in childEl ? childEl.ref : undefined;
      if (typeof childRef === 'function') childRef(el);
      else if (childRef && typeof childRef === 'object') (childRef as React.MutableRefObject<unknown>).current = el;
    },
    [children]
  );

  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltipSize, setTooltipSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewportPadding = 4;

  const clearDelayTimer = () => {
    if (delayTimerRef.current) { clearTimeout(delayTimerRef.current); delayTimerRef.current = null; }
  };

  const handleOpen = () => {
    clearDelayTimer();
    const showImmediately = Date.now() - lastTooltipDismissedAt < INSTANT_REOPEN_MS;
    if (showImmediately) {
      setOpen(true); setShouldRender(true); setIsClosing(false); return;
    }
    delayTimerRef.current = setTimeout(() => {
      delayTimerRef.current = null;
      setOpen(true); setShouldRender(true); setIsClosing(false);
    }, resolvedDelay);
  };

  const handleClose = () => {
    clearDelayTimer();
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    if (!open && !shouldRender) return;
    lastTooltipDismissedAt = Date.now();
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setShouldRender(false); setOpen(false); setIsClosing(false);
    }, FADE_OUT_DURATION_MS);
  };

  useEffect(() => () => { clearDelayTimer(); if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  useEffect(() => {
    if (!shouldRender) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shouldRender]);

  useLayoutEffect(() => {
    if (!shouldRender || !tooltipRef.current) return;
    const updateSize = () => {
      if (!tooltipRef.current) return;
      const rect = tooltipRef.current.getBoundingClientRect();
      const w = rect.width || tooltipRef.current.offsetWidth;
      const h = rect.height || tooltipRef.current.offsetHeight;
      if (w > 0 && h > 0) setTooltipSize({ width: w, height: h });
    };
    updateSize();
    requestAnimationFrame(updateSize);
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(tooltipRef.current);
      return () => observer.disconnect();
    }
  }, [shouldRender, label, shortcutKey, shortcutKeyPosition]);

  useLayoutEffect(() => {
    if (!shouldRender || !anchorRef.current || !tooltipRef.current) return;
    const calculatePosition = () => {
      if (!anchorRef.current || !tooltipRef.current) return;
      const a = anchorRef.current.getBoundingClientRect();
      const tw = tooltipRef.current.getBoundingClientRect().width || tooltipSize.width || 80;
      const th = tooltipRef.current.getBoundingClientRect().height || tooltipSize.height || 24;
      let x = 0, y = 0;
      switch (side) {
        case 'top':
          y = a.top - th - sideOffset;
          x = align === 'start' ? a.left + alignOffset : align === 'end' ? a.right - tw + alignOffset : a.left + a.width / 2 - tw / 2 + alignOffset;
          break;
        case 'bottom':
          y = a.bottom + sideOffset;
          x = align === 'start' ? a.left + alignOffset : align === 'end' ? a.right - tw + alignOffset : a.left + a.width / 2 - tw / 2 + alignOffset;
          break;
        case 'left':
          x = a.left - tw - sideOffset;
          y = align === 'start' ? a.top + alignOffset : align === 'end' ? a.bottom - th + alignOffset : a.top + a.height / 2 - th / 2 + alignOffset;
          break;
        case 'right':
          x = a.right + sideOffset;
          y = align === 'start' ? a.top + alignOffset : align === 'end' ? a.bottom - th + alignOffset : a.top + a.height / 2 - th / 2 + alignOffset;
          break;
      }
      setPosition({
        x: Math.min(Math.max(x, viewportPadding), window.innerWidth - tw - viewportPadding),
        y: Math.min(Math.max(y, viewportPadding), window.innerHeight - th - viewportPadding),
      });
    };
    calculatePosition();
    requestAnimationFrame(() => requestAnimationFrame(calculatePosition));
  }, [shouldRender, side, align, sideOffset, alignOffset, tooltipSize.width, tooltipSize.height, label]);

  useEffect(() => {
    if (!shouldRender) return;
    const onScrollResize = () => {
      if (!anchorRef.current || !tooltipRef.current) return;
      const a = anchorRef.current.getBoundingClientRect();
      const tw = tooltipSize.width || 80;
      const th = tooltipSize.height || 24;
      let x = 0, y = 0;
      switch (side) {
        case 'top': y = a.top - th - sideOffset; x = align === 'start' ? a.left + alignOffset : align === 'end' ? a.right - tw + alignOffset : a.left + a.width / 2 - tw / 2 + alignOffset; break;
        case 'bottom': y = a.bottom + sideOffset; x = align === 'start' ? a.left + alignOffset : align === 'end' ? a.right - tw + alignOffset : a.left + a.width / 2 - tw / 2 + alignOffset; break;
        case 'left': x = a.left - tw - sideOffset; y = align === 'start' ? a.top + alignOffset : align === 'end' ? a.bottom - th + alignOffset : a.top + a.height / 2 - th / 2 + alignOffset; break;
        case 'right': x = a.right + sideOffset; y = align === 'start' ? a.top + alignOffset : align === 'end' ? a.bottom - th + alignOffset : a.top + a.height / 2 - th / 2 + alignOffset; break;
      }
      setPosition({
        x: Math.min(Math.max(x, viewportPadding), window.innerWidth - tw - viewportPadding),
        y: Math.min(Math.max(y, viewportPadding), window.innerHeight - th - viewportPadding),
      });
    };
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    return () => { window.removeEventListener('scroll', onScrollResize, true); window.removeEventListener('resize', onScrollResize); };
  }, [shouldRender, side, align, sideOffset, alignOffset, tooltipSize.width, tooltipSize.height]);

  const keyHint = shortcutKey ? (
    <div className={styles.keyHint} aria-hidden>
      <Text variant="text-caption-emphasis" as="span" color="primary">{shortcutKey}</Text>
    </div>
  ) : null;

  const tooltipContent = shouldRender ? (
    <div
      ref={tooltipRef}
      id={tooltipId}
      className={`${styles.tooltip} ${isClosing ? styles.closing : ''}`}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${Math.round(position.x)}px, ${Math.round(position.y)}px)`,
        willChange: 'transform',
        zIndex: 10000,
      }}
      role="tooltip"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <div className={styles.tooltipInner}>
        {shortcutKey && shortcutKeyPosition === 'start' && keyHint}
        <Text variant="text-body-small" as="span" color="primary">{label}</Text>
        {shortcutKey && shortcutKeyPosition === 'end' && keyHint}
      </div>
    </div>
  ) : null;

  type TriggerProps = {
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    'aria-describedby'?: string;
  };
  const trigger = React.Children.only(children);
  const triggerEl = React.isValidElement<TriggerProps>(trigger) ? trigger : null;
  const existingDescribedBy = triggerEl?.props['aria-describedby'];
  const mergedDescribedBy =
    [existingDescribedBy, shouldRender ? tooltipId : undefined].filter(Boolean).join(' ') ||
    undefined;
  const triggerWithRefAndHandlers = triggerEl
    ? React.cloneElement(triggerEl, {
        ref: setAnchorRef,
        'aria-describedby': mergedDescribedBy,
        onMouseEnter: (e: React.MouseEvent) => {
          handleOpen();
          triggerEl.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          handleClose();
          triggerEl.props.onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent) => {
          handleOpen();
          triggerEl.props.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent) => {
          handleClose();
          triggerEl.props.onBlur?.(e);
        },
      } as Partial<TriggerProps> & { ref: typeof setAnchorRef })
    : children;

  return (
    <>
      {triggerWithRefAndHandlers}
      {usePortal ? createPortal(tooltipContent, document.body) : tooltipContent}
    </>
  );
};

Tooltip.displayName = 'Tooltip';

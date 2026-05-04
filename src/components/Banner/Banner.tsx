import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Cross } from '@ds-mo/icons';
import { Surface } from '@/components/Surface';
import { Text } from '@/components/Text';
import { getCssTimeMs } from '@/utils/css-tokens';
import styles from './Banner.module.css';

const TOAST_DURATION_FALLBACK_MS = 4000;
const FADE_OUT_DURATION_MS = 200;

export type BannerIntent =
  | 'brand' | 'positive' | 'negative' | 'warning' | 'caution'
  | 'ai' | 'neutral' | 'walkthrough' | 'guide';

export type BannerContrast = 'faint' | 'medium' | 'bold' | 'strong';

export interface BannerProps {
  intent: BannerIntent;
  contrast: BannerContrast;
  message: string;
  header?: boolean;
  className?: string;
  floating?: boolean;
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. Defaults to "Dismiss". */
  dismissLabel?: string;
}

const getContentColorVar = (intent: BannerIntent, contrast: BannerContrast): string => {
  if (contrast === 'bold') return 'var(--color-foreground-on-bold-background-primary)';
  const contentContrast = contrast === 'faint' ? 'bold' : contrast === 'medium' ? 'strong' : 'medium';
  return `var(--color-foreground-${contentContrast}-${intent})`;
};

export const Banner: React.FC<BannerProps> = ({
  intent,
  contrast,
  message,
  header = false,
  className = '',
  floating = false,
  onDismiss,
  dismissLabel = 'Dismiss',
}) => {
  const toastDurationMs = getCssTimeMs('--effect-animation-delay-long-2', TOAST_DURATION_FALLBACK_MS);
  const messageColor = getContentColorVar(intent, contrast);
  const [isClosing, setIsClosing] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beginClose = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    dismissTimerRef.current = null;
    if (floating) {
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        onDismiss?.();
      }, FADE_OUT_DURATION_MS);
    } else {
      onDismiss?.();
    }
  }, [floating, onDismiss]);

  const scheduleDismiss = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      dismissTimerRef.current = null;
      beginClose();
    }, toastDurationMs);
  }, [beginClose, toastDurationMs]);

  useEffect(() => {
    if (floating && message) scheduleDismiss();
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [floating, message, scheduleDismiss]);

  const isAssertive = intent === 'negative';
  const role = isAssertive ? 'alert' : 'status';
  const ariaLive = isAssertive ? undefined : 'polite';

  const content = (
    <div
      className={`${styles.bannerWrapper} ${className}`.trim()}
      style={{ '--banner-content': messageColor } as React.CSSProperties}
      role={role}
      aria-live={ariaLive}
    >
      <Surface
        elevation={floating ? 'floating' : 'elevated'}
        intent={intent}
        contrast={contrast}
        radius="sm"
        className={styles.banner}
      >
        {header && (
          <div className={styles.bannerHeaderSurface}>
            <div className={styles.bannerHeader} aria-hidden />
          </div>
        )}
        <div className={styles.bannerBody}>
          <Text variant="text-body-medium" as="span" className={styles.message}>
            {message}
          </Text>
          {onDismiss && (
            <button
              type="button"
              className={styles.dismiss}
              onClick={beginClose}
              aria-label={dismissLabel}
            >
              <Cross size={16} />
            </button>
          )}
        </div>
      </Surface>
    </div>
  );

  if (floating) {
    return createPortal(
      <div className={styles.floatingPosition} style={{ zIndex: 9998 }}>
        <div className={`${styles.floatingToast} ${isClosing ? styles.closing : ''}`}>
          {content}
        </div>
      </div>,
      document.body
    );
  }

  return content;
};

Banner.displayName = 'Banner';

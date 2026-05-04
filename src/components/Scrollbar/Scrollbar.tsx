import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import styles from './Scrollbar.module.css';

export type ScrollbarVariant = 'default' | 'thick';

export interface ScrollbarProps {
  children: React.ReactNode;
  className?: string;
  variant?: ScrollbarVariant;
  showTrackOnHover?: boolean;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  fadeOverlay?: React.ReactNode;
  contentRef?: React.RefObject<HTMLDivElement>;
}

export const Scrollbar: React.FC<ScrollbarProps> = ({
  children,
  className,
  variant = 'default',
  showTrackOnHover = true,
  onScroll,
  fadeOverlay,
  contentRef: externalContentRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalContentRef = useRef<HTMLDivElement>(null);
  const contentRef = externalContentRef || internalContentRef;
  const thumbRef = useRef<HTMLDivElement>(null);
  const thumbHRef = useRef<HTMLDivElement>(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  const handleMouseEnter = useCallback(() => {
    if (showTrackOnHover) setIsPointerInside(true);
  }, [showTrackOnHover]);

  const handleMouseLeave = useCallback(() => {
    setIsPointerInside(false);
  }, []);

  const updateThumb = useCallback(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const containerHeight = container.clientHeight;
    const containerWidth = container.clientWidth;
    const contentHeight = content.scrollHeight;
    const contentWidth = content.scrollWidth;
    const scrollTop = content.scrollTop;
    const scrollLeft = content.scrollLeft;

    if (contentHeight <= containerHeight) {
      setThumbHeight(0);
    } else {
      const ratio = containerHeight / contentHeight;
      const h = Math.max(20, containerHeight * ratio);
      setThumbHeight(h);
      setThumbTop((scrollTop / (contentHeight - containerHeight)) * (containerHeight - h));
    }

    if (contentWidth <= containerWidth) {
      setThumbWidth(0);
    } else {
      const ratio = containerWidth / contentWidth;
      const w = Math.max(20, containerWidth * ratio);
      setThumbWidth(w);
      setThumbLeft((scrollLeft / (contentWidth - containerWidth)) * (containerWidth - w));
    }
  }, [contentRef]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const handleScroll = (e: Event) => {
      updateThumb();
      if (onScroll) onScroll(e as unknown as React.UIEvent<HTMLDivElement>);
    };
    content.addEventListener('scroll', handleScroll);
    return () => content.removeEventListener('scroll', handleScroll);
  }, [updateThumb, onScroll, contentRef]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const handleResize = () => updateThumb();
    window.addEventListener('resize', handleResize);
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(handleResize);
      observer.observe(content);
      return () => { window.removeEventListener('resize', handleResize); observer.disconnect(); };
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [updateThumb, contentRef]);

  useEffect(() => { updateThumb(); }, [updateThumb, children]);

  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const content = contentRef.current;
    if (!content) return;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = content.scrollTop;
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container || !content) return;
      const deltaY = e.clientY - dragStartY.current;
      const scrollableHeight = content.scrollHeight - container.clientHeight;
      const scrollRatio = scrollableHeight / (container.clientHeight - thumbHeight);
      content.scrollTop = Math.max(0, Math.min(scrollableHeight, dragStartScrollTop.current + deltaY * scrollRatio));
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [thumbHeight, contentRef]);

  const handleThumbHMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const content = contentRef.current;
    if (!content) return;
    setIsDraggingH(true);
    dragStartX.current = e.clientX;
    dragStartScrollLeft.current = content.scrollLeft;
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container || !content) return;
      const deltaX = e.clientX - dragStartX.current;
      const scrollableWidth = content.scrollWidth - container.clientWidth;
      const scrollRatio = scrollableWidth / (container.clientWidth - thumbWidth);
      content.scrollLeft = Math.max(0, Math.min(scrollableWidth, dragStartScrollLeft.current + deltaX * scrollRatio));
    };
    const handleMouseUp = () => {
      setIsDraggingH(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [thumbWidth, contentRef]);

  const showThumb = thumbHeight > 0;
  const showThumbH = thumbWidth > 0;
  const showTrack = showTrackOnHover && (isPointerInside || isDragging || isDraggingH);
  const isScrollable = showThumb || showThumbH;

  // A11y model: the custom thumbs are a visual reskin of the native scrollbar,
  // not a separate widget. The `.content` div retains native `overflow: auto`,
  // so when it is focusable the browser handles arrow keys, Page Up/Down,
  // Home/End, and Space for free — implementing the full `role="scrollbar"`
  // ARIA pattern would just re-create that behavior. We therefore expose the
  // scroll container itself as the keyboard target (tabIndex=0 only when
  // content overflows) and hide the decorative thumbs from assistive tech.
  return (
    <div
      ref={containerRef}
      className={cn(styles.container, variant === 'thick' && styles.thick, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-dragging={isDragging || isDraggingH}
      data-show-track={showTrack ? 'true' : 'false'}
    >
      <div
        ref={contentRef}
        className={styles.content}
        tabIndex={isScrollable ? 0 : undefined}
      >
        {children}
      </div>
      {fadeOverlay}
      {showThumb && (
        <div className={styles.track} aria-hidden="true">
          <div ref={thumbRef} className={styles.thumb} style={{ height: `${thumbHeight}px`, top: `${thumbTop}px` }} onMouseDown={handleThumbMouseDown} />
        </div>
      )}
      {showThumbH && (
        <div className={styles.trackHorizontal} aria-hidden="true">
          <div ref={thumbHRef} className={styles.thumbHorizontal} style={{ width: `${thumbWidth}px`, left: `${thumbLeft}px` }} onMouseDown={handleThumbHMouseDown} />
        </div>
      )}
    </div>
  );
};

Scrollbar.displayName = 'Scrollbar';

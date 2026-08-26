import {
  computeAnchoredPosition,
  type AnchoredPosition,
  type AnchoredPositionInput,
} from './anchored-position';

/** Frames to wait for an anchor and popup to become measurable before giving up. */
const POSITION_RETRY_BUDGET = 8;

/**
 * How the scroll/resize path reschedules. Each consumer family measured
 * differently before consolidation, and the differences are preserved verbatim
 * so placement timing is unchanged.
 *
 * - `sync` — measure inside the listener. Selects.
 * - `frame` — coalesce and measure on the next frame. Tooltips.
 * - `double-frame` — coalesce, measure next frame, then measure once more the
 *   frame after. Scroll-driven owners such as ShellPage commit a compact-header
 *   render in the frame after the scroll event, so a single frame reads a stale
 *   anchor rect. Menus.
 */
export type AnchoredLiveUpdateMode = 'sync' | 'frame' | 'double-frame';

export interface AnchoredPositionControllerOptions {
  /** Resolve the anchor at measure time; positioning retries while this is null. */
  getAnchor: () => HTMLElement | null;
  /** Resolve the popup at measure time; positioning retries while this is null. */
  getPopup: () => HTMLElement | null;
  /** Stable owner fallback when framework bindings assign open before anchor. */
  getOwnerDocument?: () => Document | null;
  /**
   * Build the layout input for one measurement pass.
   *
   * The owning component keeps its own anchor semantics here — inner-cell align
   * offsets, minimum widths, and token resolution stay with the component rather
   * than moving into this controller. Return `null` when the component's own
   * guards say the popup is not measurable yet, which schedules a retry.
   */
  measure: (anchor: HTMLElement, popup: HTMLElement) => AnchoredPositionInput | null;
  /** Commit a changed position. Not called when the result is unchanged. */
  apply: (position: AnchoredPosition) => void;
  /**
   * Move a `popover="manual"` popup into the native top layer before measuring.
   *
   * Use this for popups that remain in their owner's DOM tree. The top layer
   * gives `position: fixed` viewport coordinates even when an application
   * ancestor establishes a fixed-position containing block through containment,
   * transforms, or filters.
   */
  topLayer?: boolean;
  /** Fired once per `start()` when the first measurement succeeds. */
  onReady?: () => void;
  /** Scroll/resize behavior. Defaults to `sync`. */
  liveUpdate?: AnchoredLiveUpdateMode;
  /**
   * Re-measure when the popup or anchor resizes. Tooltips need this because the
   * label's `ds-text` upgrade changes the measured width after mount.
   */
  observeResize?: boolean;
  /**
   * Follow CSS transitions or animations that move the anchor without resizing
   * it. The observer only runs a measurement loop while related motion is active.
   */
  observeAnchorMotion?: boolean;
  retryBudget?: number;
}

/**
 * Lifecycle owner for an element-anchored popup: listener binding, measurement
 * retries, frame coalescing, and teardown.
 *
 * Pairs with `computeAnchoredPosition`, which owns the geometry. Split this way
 * because the geometry is pure and exhaustively testable while the lifecycle is
 * timing-dependent; keeping them separate means the risky half lives in exactly
 * one place.
 *
 * Not suitable for overlays that place several popups in one shared pass — Toast
 * positions N anchored records inside a single layout commit and keeps its own
 * scheduler, using only the geometry function.
 */
export class AnchoredPositionController {
  private readonly options: AnchoredPositionControllerOptions;
  private scrollResizeHandler: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private retryRaf: number | null = null;
  private liveRaf: number | null = null;
  private anchorMotionRaf: number | null = null;
  private activeAnchorMotions = 0;
  private ownerDocument: Document | null = null;
  private last: AnchoredPosition | null = null;
  private isReady = false;
  private readonly anchorMotionStartHandler = (event: Event) => {
    if (!this.eventCanMoveAnchor(event)) return;
    this.activeAnchorMotions += 1;
    this.scheduleAnchorMotionUpdate();
  };
  private readonly anchorMotionEndHandler = (event: Event) => {
    if (!this.eventCanMoveAnchor(event)) return;
    this.activeAnchorMotions = Math.max(0, this.activeAnchorMotions - 1);
    this.scheduleAnchorMotionUpdate();
  };

  constructor(options: AnchoredPositionControllerOptions) {
    this.options = options;
  }

  /** `true` once a measurement has succeeded, for gating popup reveal. */
  get ready(): boolean {
    return this.isReady;
  }

  /**
   * Bind scroll/resize tracking for an opening popup.
   *
   * Deliberately does not schedule placement: every consumer binds listeners and
   * then schedules in its own order, and folding both into one call produced two
   * overlapping retry loops. Call `schedule()` or `update()` separately.
   */
  observe(): void {
    this.bindListeners();
  }

  /** Unbind tracking, cancel pending frames, and clear the cached position. */
  unobserve(): void {
    this.unbindListeners();
    this.cancel();
    this.last = null;
    this.isReady = false;
  }

  /**
   * Retry measurement each frame until it succeeds or the budget runs out, so a
   * popup is never revealed at 0,0 after a failed first pass.
   */
  schedule(onReady?: () => void): void {
    this.cancelRetry();
    this.isReady = false;

    let remaining = this.options.retryBudget ?? POSITION_RETRY_BUDGET;

    const attempt = () => {
      this.retryRaf = null;
      if (this.update()) {
        this.isReady = true;
        this.options.onReady?.();
        onReady?.();
        return;
      }
      if (remaining > 0) {
        remaining -= 1;
        this.retryRaf = requestAnimationFrame(attempt);
      }
    };

    this.retryRaf = requestAnimationFrame(attempt);
  }

  /** Measure and commit once. @returns `false` when the popup is not measurable. */
  update(): boolean {
    const anchor = this.options.getAnchor();
    if (!anchor) return false;
    const popup = this.options.getPopup();
    if (!popup) return false;
    this.observeResizeTargets();

    if (
      this.options.topLayer &&
      typeof popup.showPopover === 'function' &&
      !popup.matches(':popover-open')
    ) {
      try {
        popup.showPopover();
      } catch {
        // The popup may not be connected yet. The scheduled retry will try again
        // on the next frame instead of measuring it in the wrong coordinate space.
        return false;
      }
    }

    const input = this.options.measure(anchor, popup);
    if (!input) return false;

    const next = computeAnchoredPosition(input);
    if (
      !this.last ||
      this.last.x !== next.x ||
      this.last.y !== next.y ||
      this.last.resolvedSide !== next.resolvedSide ||
      this.last.availableHeight !== next.availableHeight
    ) {
      this.last = next;
      this.options.apply(next);
    }
    return true;
  }

  /** Reposition an already-open popup without hiding it. */
  scheduleLiveUpdate(): void {
    const mode = this.options.liveUpdate ?? 'sync';
    if (mode === 'sync') {
      this.update();
      return;
    }

    if (this.liveRaf !== null) return;

    if (mode === 'frame') {
      this.liveRaf = requestAnimationFrame(() => {
        this.liveRaf = null;
        this.update();
      });
      return;
    }

    // double-frame stays coalesced until the second frame resolves.
    this.liveRaf = requestAnimationFrame(() => {
      this.update();
      this.liveRaf = requestAnimationFrame(() => {
        this.liveRaf = null;
        this.update();
      });
    });
  }

  /** Cancel pending retry and live frames without unbinding listeners. */
  cancel(): void {
    this.cancelRetry();
    if (this.liveRaf !== null) {
      cancelAnimationFrame(this.liveRaf);
      this.liveRaf = null;
    }
    if (this.anchorMotionRaf !== null) {
      cancelAnimationFrame(this.anchorMotionRaf);
      this.anchorMotionRaf = null;
    }
  }

  private cancelRetry(): void {
    if (this.retryRaf === null) return;
    cancelAnimationFrame(this.retryRaf);
    this.retryRaf = null;
  }

  private bindListeners(): void {
    this.unbindListeners();
    this.scrollResizeHandler = () => this.scheduleLiveUpdate();
    // Capture phase so scrolling inside any ancestor repositions the popup.
    window.addEventListener('scroll', this.scrollResizeHandler, true);
    window.addEventListener('resize', this.scrollResizeHandler);

    if (this.options.observeResize && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.update());
      this.observeResizeTargets();
    }

    if (this.options.observeAnchorMotion) {
      this.ownerDocument =
        this.options.getAnchor()?.ownerDocument ?? this.options.getOwnerDocument?.() ?? null;
      this.ownerDocument?.addEventListener('transitionrun', this.anchorMotionStartHandler, true);
      this.ownerDocument?.addEventListener('transitionend', this.anchorMotionEndHandler, true);
      this.ownerDocument?.addEventListener('transitioncancel', this.anchorMotionEndHandler, true);
      this.ownerDocument?.addEventListener('animationstart', this.anchorMotionStartHandler, true);
      this.ownerDocument?.addEventListener('animationend', this.anchorMotionEndHandler, true);
      this.ownerDocument?.addEventListener('animationcancel', this.anchorMotionEndHandler, true);
    }
  }

  private unbindListeners(): void {
    if (this.scrollResizeHandler) {
      window.removeEventListener('scroll', this.scrollResizeHandler, true);
      window.removeEventListener('resize', this.scrollResizeHandler);
      this.scrollResizeHandler = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.ownerDocument?.removeEventListener('transitionrun', this.anchorMotionStartHandler, true);
    this.ownerDocument?.removeEventListener('transitionend', this.anchorMotionEndHandler, true);
    this.ownerDocument?.removeEventListener('transitioncancel', this.anchorMotionEndHandler, true);
    this.ownerDocument?.removeEventListener('animationstart', this.anchorMotionStartHandler, true);
    this.ownerDocument?.removeEventListener('animationend', this.anchorMotionEndHandler, true);
    this.ownerDocument?.removeEventListener('animationcancel', this.anchorMotionEndHandler, true);
    this.ownerDocument = null;
    this.activeAnchorMotions = 0;
  }

  private eventCanMoveAnchor(event: Event): boolean {
    const anchor = this.options.getAnchor();
    const target = event.target;
    if (!anchor || !(target instanceof Element)) return false;
    // Motion on the anchor or one of its layout ancestors can move its rect.
    // Descendant-only animation is irrelevant unless it resizes the anchor,
    // which the ResizeObserver path already covers.
    return target === anchor || target.contains(anchor);
  }

  private scheduleAnchorMotionUpdate(): void {
    if (this.anchorMotionRaf !== null) return;
    const tick = () => {
      this.anchorMotionRaf = null;
      this.update();
      if (this.activeAnchorMotions <= 0 || !this.options.getAnchor()?.isConnected) {
        this.activeAnchorMotions = 0;
        return;
      }
      this.anchorMotionRaf = requestAnimationFrame(tick);
    };
    this.anchorMotionRaf = requestAnimationFrame(tick);
  }

  /**
   * Re-attach the resize observer after the popup remounts. Safe to call
   * repeatedly; `ResizeObserver.observe` ignores duplicate targets.
   */
  observeResizeTargets(): void {
    if (!this.resizeObserver) return;
    const popup = this.options.getPopup();
    if (popup) this.resizeObserver.observe(popup);
    const anchor = this.options.getAnchor();
    if (anchor) this.resizeObserver.observe(anchor);
  }
}

import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import {
  resolveCssLengthPx,
  resolveCssTimeMs,
  resolveMotionTimeMs,
  TOKEN_DEFAULTS,
} from '../../utils';
import {
  toastManager as defaultToastManager,
  type ToastActionEventDetail,
  type ToastCloseContext,
  type ToastCloseEventDetail,
  type ToastEventDetail,
  type ToastManager,
  type ToastRecord,
  type ToastSwipeDirection,
} from '../../toast';
import { computeTooltipPosition } from '../Tooltip/tooltip-position';

interface ToastTimer {
  timerKey: number;
  remaining: number;
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | null;
}

interface SwipeState {
  id: string;
  x: number;
  y: number;
  direction?: ToastSwipeDirection;
}

interface AnchoredPosition {
  x: number;
  y: number;
  side: 'top' | 'right' | 'bottom' | 'left';
}

interface ActiveSwipe {
  id: string;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  maxDistance: number;
  cancelled: boolean;
  axis: 'x' | 'y' | null;
}

const SWIPE_THRESHOLD = 40;
const SWIPE_REVERSE_CANCEL_THRESHOLD = 10;
const GLOBAL_STACK_HOVER = '__global-stack__';
const INTERACTIVE_SWIPE_SELECTOR =
  'button,a,input,textarea,select,[role="button"],[data-ds-toast-swipe-ignore]';

const attachedManagers = new WeakMap<ToastManager, Toast>();
const connectedToastRegions = new Set<Toast>();
let activeToastRegion: Toast | null = null;
let toastInstanceCounter = 0;

@Component({
  tag: 'ds-toast',
  styleUrl: 'Toast.css',
  scoped: true,
})
export class Toast {
  @Element() el!: HTMLElement;

  /** Manager that supplies toast records. Assign as a JavaScript property. */
  @Prop() manager: ToastManager = defaultToastManager;
  /** Maximum visible global-stack records. Limited records remain mounted and inert. */
  @Prop() limit: number = 3;
  /** Default auto-dismiss delay. Use 0 for persistent records. */
  @Prop() timeout: number | string = TOKEN_DEFAULTS.animationDelayLong2;
  /** Accessible label for the notification region. */
  @Prop() label: string = 'Notifications';
  /** Localized accessible label for every toast close action. */
  @Prop() closeLabel: string = 'Close notification';
  /** Keep the global stack 16px above the persistent mobile shell bar below 768px. */
  @Prop({ attribute: 'avoid-mobile-shell-bar', reflect: true })
  avoidMobileShellBar: boolean = false;
  /** Allowed swipe-to-dismiss directions. Assign as a JavaScript property. */
  @Prop() swipeDirections: ToastSwipeDirection[] = ['down', 'right'];

  @State() private records: readonly ToastRecord[] = [];
  @State() private expanded = false;
  @State() private keyboardActive = false;
  @State() private swipe: SwipeState | null = null;
  @State() private layoutVersion = 0;

  @Event() dsToastClose!: EventEmitter<ToastCloseEventDetail>;
  @Event() dsToastRemove!: EventEmitter<ToastEventDetail>;
  @Event() dsToastAction!: EventEmitter<ToastActionEventDetail>;

  private readonly instanceId = ++toastInstanceCounter;
  private readonly domIds = new Map<string, number>();
  private readonly timers = new Map<string, ToastTimer>();
  private readonly closeWatchdogs = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly closeFrames = new Map<string, number>();
  private readonly closeEvents = new Set<string>();
  private readonly activationFrames = new Map<string, number>();
  private readonly pauseReasons = new Set<string>();
  private readonly hoveredIds = new Set<string>();
  private readonly heights = new Map<string, number>();
  private readonly measuredUpdateKeys = new Map<string, number>();
  private readonly anchoredPositions = new Map<string, AnchoredPosition>();
  private readonly dismissedSwipeDirections = new Map<string, ToastSwipeDirection>();
  private readonly observedElements = new Set<Element>();
  private readonly pendingRemovals: Array<{
    manager: ToastManager;
    context: ToastCloseContext;
  }> = [];

  private unsubscribe: (() => void) | null = null;
  private attachedManager: ToastManager | null = null;
  private previousFocus: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private layoutFrame: number | null = null;
  private activeSwipe: ActiveSwipe | null = null;
  private nextDomId = 0;
  private connected = false;
  private pendingHoverLeave = false;

  connectedCallback() {
    this.connect();
  }

  componentDidLoad() {
    this.connect();
  }

  private connect() {
    if (this.connected) return;
    this.connected = true;
    this.resizeObserver ??= new ResizeObserver(() => this.scheduleLayout());
    this.mutationObserver ??= new MutationObserver(() => this.scheduleLayout());
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
    if (!this.unsubscribe) this.attachManager(this.manager);
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
    window.addEventListener('resize', this.handleWindowResize);
    window.addEventListener('scroll', this.scheduleLayout, true);
    document.addEventListener('keydown', this.handleDocumentKeyDown);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    connectedToastRegions.add(this);
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- module coordinator tracks the active connected viewport
    if (!activeToastRegion) activeToastRegion = this;
  }

  componentDidRender() {
    this.syncObservedElements();
    this.flushPendingRemovals();
    this.scheduleLayout();
  }

  disconnectedCallback() {
    this.connected = false;
    this.flushPendingRemovals();
    this.detachManager();
    this.resetManagerState();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.observedElements.clear();
    if (this.layoutFrame !== null) cancelAnimationFrame(this.layoutFrame);
    this.layoutFrame = null;
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('scroll', this.scheduleLayout, true);
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    connectedToastRegions.delete(this);
    if (activeToastRegion === this) {
      const remaining = Array.from(connectedToastRegions);
      activeToastRegion = remaining[remaining.length - 1] ?? null;
    }
  }

  @Watch('manager')
  onManagerChange(next: ToastManager) {
    this.detachManager();
    this.resetManagerState();
    if (this.connected) this.attachManager(next);
  }

  @Watch('timeout')
  onTimeoutChange() {
    for (const timer of this.timers.values()) {
      if (timer.handle) clearTimeout(timer.handle);
    }
    this.timers.clear();
    this.syncTimers();
  }

  private attachManager(manager: ToastManager) {
    const attached = attachedManagers.get(manager);
    if (attached && attached !== this) {
      console.warn('[ds-toast] A manager can control only one connected ds-toast instance.');
      return;
    }
    attachedManagers.set(manager, this);
    this.attachedManager = manager;
    this.unsubscribe = manager.subscribe(records => {
      this.records = records;
      this.syncLifecycle(records);
      this.scheduleLayout();
    });
  }

  private detachManager() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.attachedManager && attachedManagers.get(this.attachedManager) === this) {
      attachedManagers.delete(this.attachedManager);
    }
    this.attachedManager = null;
  }

  private resetManagerState() {
    this.flushPendingRemovals();
    if (this.el.contains(document.activeElement)) this.restorePreviousFocus();
    this.clearAllTimers();
    for (const frame of this.activationFrames.values()) cancelAnimationFrame(frame);
    for (const frame of this.closeFrames.values()) cancelAnimationFrame(frame);
    this.activationFrames.clear();
    this.closeFrames.clear();
    this.closeEvents.clear();
    this.pauseReasons.clear();
    this.hoveredIds.clear();
    this.pendingHoverLeave = false;
    this.heights.clear();
    this.measuredUpdateKeys.clear();
    this.anchoredPositions.clear();
    this.dismissedSwipeDirections.clear();
    this.domIds.clear();
    this.activeSwipe = null;
    this.swipe = null;
    this.expanded = false;
    this.keyboardActive = false;
    this.records = [];
    this.resizeObserver?.disconnect();
    this.observedElements.clear();
  }

  private syncObservedElements() {
    const next = new Set<Element>(
      this.el.querySelectorAll<HTMLElement>('.toast-positioner'),
    );
    for (const record of this.records) {
      if (!record.positioner) continue;
      const anchor = this.resolveAnchor(record.positioner.anchor);
      if (anchor) next.add(anchor);
    }

    for (const element of this.observedElements) {
      if (!next.has(element)) {
        this.resizeObserver?.unobserve(element);
        this.observedElements.delete(element);
      }
    }
    for (const element of next) {
      if (this.observedElements.has(element)) continue;
      this.resizeObserver?.observe(element);
      this.observedElements.add(element);
    }
  }

  private flushPendingRemovals() {
    for (const pending of this.pendingRemovals.splice(0)) {
      pending.manager.notifyRemove(pending.context);
      this.dsToastRemove.emit({
        id: pending.context.id,
        toast: pending.context.toast,
      });
    }
  }

  private syncLifecycle(records: readonly ToastRecord[]) {
    const recordIds = new Set(records.map(record => record.id));
    for (const id of this.hoveredIds) {
      if (id !== GLOBAL_STACK_HOVER && !recordIds.has(id)) this.hoveredIds.delete(id);
    }
    const hasEndingRecords = records.some(
      record => record.transitionStatus === 'ending',
    );
    if (this.pendingHoverLeave && !hasEndingRecords && !this.hoveredIds.size) {
      this.pendingHoverLeave = false;
      this.expanded = false;
      this.resumeTimers('hover');
    } else if (!this.hoveredIds.size && !this.pendingHoverLeave) {
      this.resumeTimers('hover');
    }

    for (const [id, timer] of this.timers) {
      if (recordIds.has(id)) continue;
      if (timer.handle) clearTimeout(timer.handle);
      this.timers.delete(id);
    }

    for (const [id, watchdog] of this.closeWatchdogs) {
      if (recordIds.has(id)) continue;
      clearTimeout(watchdog);
      this.closeWatchdogs.delete(id);
    }

    for (const [id, frame] of this.activationFrames) {
      if (recordIds.has(id)) continue;
      cancelAnimationFrame(frame);
      this.activationFrames.delete(id);
    }

    for (const [id, frame] of this.closeFrames) {
      if (recordIds.has(id)) continue;
      cancelAnimationFrame(frame);
      this.closeFrames.delete(id);
    }

    for (const id of this.domIds.keys()) {
      if (recordIds.has(id)) continue;
      this.closeEvents.delete(id);
      this.domIds.delete(id);
      this.heights.delete(id);
      this.measuredUpdateKeys.delete(id);
      this.anchoredPositions.delete(id);
      this.dismissedSwipeDirections.delete(id);
    }

    for (const record of records) {
      this.ensureDomId(record.id);
      if (
        record.transitionStatus === 'starting' &&
        !this.activationFrames.has(record.id)
      ) {
        const manager = this.attachedManager;
        const frame = requestAnimationFrame(() => {
          this.activationFrames.delete(record.id);
          manager?.activate(record.id);
        });
        this.activationFrames.set(record.id, frame);
      }

      if (record.transitionStatus === 'ending') {
        this.clearToastTimer(record.id);
        this.beginRemoval(record);
      } else {
        const watchdog = this.closeWatchdogs.get(record.id);
        if (watchdog) clearTimeout(watchdog);
        this.closeWatchdogs.delete(record.id);
        const closeFrame = this.closeFrames.get(record.id);
        if (closeFrame) cancelAnimationFrame(closeFrame);
        this.closeFrames.delete(record.id);
        this.closeEvents.delete(record.id);
      }
    }

    this.syncTimers();
  }

  private syncTimers() {
    const activeIds = new Set<string>();
    for (const record of this.records) {
      if (record.transitionStatus !== 'active') continue;
      activeIds.add(record.id);
      const duration = this.resolveToastTimeout(record);
      if (duration <= 0) {
        this.clearToastTimer(record.id);
        continue;
      }

      const existing = this.timers.get(record.id);
      if (!existing || existing.timerKey !== record.timerKey) {
        this.clearToastTimer(record.id);
        this.timers.set(record.id, {
          timerKey: record.timerKey,
          remaining: duration,
          startedAt: 0,
          handle: null,
        });
      }
      if (!this.isPaused) this.startToastTimer(record.id);
    }

    for (const id of this.timers.keys()) {
      if (!activeIds.has(id)) this.clearToastTimer(id);
    }
  }

  private resolveToastTimeout(record: ToastRecord): number {
    const value = record.timeout ?? this.timeout;
    if (typeof value === 'number') return Math.max(0, value);
    return resolveCssTimeMs(value, TOKEN_DEFAULTS.animationDelayLong2);
  }

  private startToastTimer(id: string) {
    const timer = this.timers.get(id);
    if (!timer || timer.handle || timer.remaining <= 0) return;
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => {
      timer.handle = null;
      timer.remaining = 0;
      this.manager.close(id, 'timeout');
    }, timer.remaining);
  }

  private pauseTimers(reason: string) {
    const wasPaused = this.isPaused;
    this.pauseReasons.add(reason);
    if (wasPaused) return;
    const now = Date.now();
    for (const timer of this.timers.values()) {
      if (!timer.handle) continue;
      clearTimeout(timer.handle);
      timer.handle = null;
      timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    }
  }

  private resumeTimers(reason: string) {
    this.pauseReasons.delete(reason);
    if (this.isPaused) return;
    for (const id of this.timers.keys()) this.startToastTimer(id);
  }

  private get isPaused(): boolean {
    return this.pauseReasons.size > 0;
  }

  private clearToastTimer(id: string) {
    const timer = this.timers.get(id);
    if (timer?.handle) clearTimeout(timer.handle);
    this.timers.delete(id);
  }

  private clearAllTimers() {
    for (const timer of this.timers.values()) {
      if (timer.handle) clearTimeout(timer.handle);
    }
    for (const watchdog of this.closeWatchdogs.values()) clearTimeout(watchdog);
    this.timers.clear();
    this.closeWatchdogs.clear();
  }

  private beginRemoval(record: ToastRecord) {
    if (!this.closeEvents.has(record.id)) {
      this.closeEvents.add(record.id);
      this.dsToastClose.emit({
        id: record.id,
        reason: record.closeReason ?? 'programmatic',
        toast: record,
      });
      this.moveFocusAfterClose(record.id);
    }
    if (
      this.closeWatchdogs.has(record.id) ||
      this.closeFrames.has(record.id)
    ) return;

    const duration = resolveMotionTimeMs(
      TOKEN_DEFAULTS.motionShort3,
      TOKEN_DEFAULTS.animationDurationShort3,
    );
    if (duration <= 0) {
      queueMicrotask(() => this.completeRemoval(record));
      return;
    }
    const frame = requestAnimationFrame(() => {
      this.closeFrames.delete(record.id);
      const current = this.records.find(candidate => candidate.id === record.id);
      if (!current || current.transitionStatus !== 'ending') return;
      this.closeWatchdogs.set(
        record.id,
        setTimeout(() => this.completeRemoval(current), duration),
      );
    });
    this.closeFrames.set(record.id, frame);
  }

  private completeRemoval(record: ToastRecord) {
    const current = this.records.find(candidate => candidate.id === record.id);
    if (!current || current.transitionStatus !== 'ending') return;
    const watchdog = this.closeWatchdogs.get(record.id);
    if (watchdog) clearTimeout(watchdog);
    this.closeWatchdogs.delete(record.id);
    const closeFrame = this.closeFrames.get(record.id);
    if (closeFrame) cancelAnimationFrame(closeFrame);
    this.closeFrames.delete(record.id);
    const manager = this.attachedManager;
    const context = manager?.remove(record.id);
    if (manager && context) this.pendingRemovals.push({ manager, context });
  }

  private handleAnimationComplete(record: ToastRecord) {
    if (record.transitionStatus === 'ending') this.completeRemoval(record);
  }

  private bindAnimationCancel(element: HTMLDivElement | undefined, id: string) {
    if (!element || element.dataset['cancelBound'] === 'true') return;
    element.dataset['cancelBound'] = 'true';
    element.addEventListener('animationcancel', () => {
      const record = this.records.find(candidate => candidate.id === id);
      if (record) this.handleAnimationComplete(record);
    });
  }

  private handleWindowBlur = () => this.pauseTimers('window');
  private handleWindowFocus = () => this.resumeTimers('window');
  private handleVisibilityChange = () => {
    if (document.hidden) this.pauseTimers('document');
    else this.resumeTimers('document');
  };

  private handlePointerEnter(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- pointer interaction selects the viewport that receives F6
    activeToastRegion = this;
    this.pendingHoverLeave = false;
    this.hoveredIds.add(id);
    this.expanded = true;
    this.pauseTimers('hover');
  }

  private handlePointerLeave(id: string) {
    this.hoveredIds.delete(id);
    if (this.hoveredIds.size) return;
    if (this.records.some(record => record.transitionStatus === 'ending')) {
      this.pendingHoverLeave = true;
      return;
    }
    this.expanded = false;
    this.resumeTimers('hover');
  }

  private handleFocusIn = () => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !active.matches(':focus-visible')) return;
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- module coordinator routes F6 to the last focused viewport
    activeToastRegion = this;
    this.keyboardActive = true;
    this.expanded = true;
    this.pauseTimers('focus');
  };

  private handleFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (next instanceof Node && this.el.contains(next)) return;
    if (!this.keyboardActive) return;
    this.keyboardActive = false;
    this.expanded = this.hoveredIds.size > 0;
    this.resumeTimers('focus');
  };

  private handleDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'F6') return;
    const eligible = Array.from(connectedToastRegions).filter(
      region => region.activeRecords.length > 0,
    );
    const target =
      activeToastRegion && activeToastRegion.activeRecords.length
        ? activeToastRegion
        : eligible[eligible.length - 1];
    if (target !== this) return;
    event.preventDefault();
    if (!this.el.contains(document.activeElement)) {
      this.previousFocus = document.activeElement as HTMLElement | null;
    }
    this.keyboardActive = true;
    this.regionElement?.focus();
  };

  private handleRegionKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      const target = event.target as HTMLElement;
      const positioner = target.closest<HTMLElement>('.toast-positioner');
      const id = positioner?.dataset['toastId'] ?? this.activeRecords[0]?.id;
      if (id) {
        event.preventDefault();
        this.manager.close(id, 'escape');
      }
      return;
    }

    if (event.key === 'Tab' && event.shiftKey && event.target === this.regionElement) {
      event.preventDefault();
      this.restorePreviousFocus();
    }
  };

  private get regionElement(): HTMLElement | null {
    return this.el.querySelector<HTMLElement>('.toast-region');
  }

  private restorePreviousFocus() {
    this.previousFocus?.focus?.();
    this.previousFocus = null;
    this.keyboardActive = false;
  }

  private moveFocusAfterClose(id: string) {
    const active = document.activeElement;
    const closing = this.positionerElement(id);
    if (!active || !closing?.contains(active)) return;
    requestAnimationFrame(() => {
      const next = this.activeRecords.find(record => record.id !== id);
      const control = next
        ? this.positionerElement(next.id)?.querySelector<
            HTMLElement & { setFocus?: () => Promise<void> }
          >('ds-button-unfilled')
        : null;
      if (control?.setFocus) void control.setFocus();
      else if (next) this.regionElement?.focus();
      else this.restorePreviousFocus();
    });
  }

  private handleAction(record: ToastRecord, event: CustomEvent<MouseEvent>) {
    const detail: ToastActionEventDetail = {
      id: record.id,
      toast: record,
      originalEvent: event.detail,
    };
    this.dsToastAction.emit(detail);
    record.action?.onAction?.({
      id: record.id,
      data: record.data,
      manager: this.manager,
      originalEvent: event.detail,
    });
  }

  private handlePointerDown(record: ToastRecord, event: PointerEvent) {
    if (event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest(INTERACTIVE_SWIPE_SELECTOR)) return;

    const surface = event.currentTarget as HTMLElement;
    surface.setPointerCapture(event.pointerId);
    this.activeSwipe = {
      id: record.id,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      maxDistance: 0,
      cancelled: false,
      axis: null,
    };
    this.swipe = { id: record.id, x: 0, y: 0 };
    if (event.pointerType === 'touch') this.pauseTimers('swipe');
  }

  private handlePointerMove(event: PointerEvent) {
    const active = this.activeSwipe;
    if (!active || active.pointerId !== event.pointerId || active.cancelled) return;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (!active.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 1) {
      active.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }
    if (!active.axis) return;
    const horizontal = active.axis === 'x';
    const direction: ToastSwipeDirection = horizontal
      ? dx >= 0 ? 'right' : 'left'
      : dy >= 0 ? 'down' : 'up';
    const allowed = this.swipeDirections.includes(direction);
    const rawDistance = horizontal ? Math.abs(dx) : Math.abs(dy);
    const distance = allowed ? rawDistance : Math.sqrt(rawDistance);
    const signed = (horizontal ? dx : dy) < 0 ? -distance : distance;
    const x = horizontal ? signed : 0;
    const y = horizontal ? 0 : signed;

    if (active.maxDistance - distance >= SWIPE_REVERSE_CANCEL_THRESHOLD) {
      active.cancelled = true;
      this.cancelSwipe();
      return;
    }
    active.maxDistance = Math.max(active.maxDistance, distance);
    if (rawDistance > 1) event.preventDefault();
    this.swipe = { id: active.id, x, y, direction: allowed ? direction : undefined };
  }

  private handlePointerUp(event: PointerEvent) {
    const active = this.activeSwipe;
    if (!active || active.pointerId !== event.pointerId) return;
    const swipe = this.swipe;
    const distance = swipe ? Math.max(Math.abs(swipe.x), Math.abs(swipe.y)) : 0;
    const shouldDismiss =
      !active.cancelled &&
      !!swipe?.direction &&
      distance >= SWIPE_THRESHOLD;
    const id = active.id;
    const wasTouch = active.pointerType === 'touch';
    this.activeSwipe = null;
    this.swipe = null;
    if (wasTouch) this.resumeTimers('swipe');
    if (shouldDismiss && swipe.direction) {
      this.dismissedSwipeDirections.set(id, swipe.direction);
      this.manager.close(id, 'swipe');
    }
  }

  private handlePointerCancel(event: PointerEvent) {
    if (this.activeSwipe?.pointerId !== event.pointerId) return;
    this.cancelSwipe();
  }

  private cancelSwipe() {
    const wasTouch = this.activeSwipe?.pointerType === 'touch';
    this.activeSwipe = null;
    this.swipe = null;
    if (wasTouch) this.resumeTimers('swipe');
  }

  private get touchAction(): string {
    const horizontal =
      this.swipeDirections.includes('left') || this.swipeDirections.includes('right');
    const vertical =
      this.swipeDirections.includes('up') || this.swipeDirections.includes('down');
    if (horizontal && vertical) return 'none';
    if (horizontal) return 'pan-y';
    if (vertical) return 'pan-x';
    return 'auto';
  }

  private handleWindowResize = () => {
    this.heights.clear();
    this.measuredUpdateKeys.clear();
    this.layoutVersion += 1;
    this.scheduleLayout();
  };

  private scheduleLayout = () => {
    if (this.layoutFrame !== null) return;
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutFrame = null;
      this.measureLayout();
    });
  };

  private measureNaturalHeight(element: HTMLElement, expandedWidth: boolean): number {
    const surface = element.querySelector<HTMLElement>('.toast-surface');
    if (!surface) return 0;
    const previousWidth = element.style.width;
    const previousTransition = element.style.transition;
    const previousHeight = surface.style.height;

    if (expandedWidth) {
      element.style.transition = 'none';
      element.style.width = '100%';
    }
    surface.style.height = 'auto';
    const height = surface.getBoundingClientRect().height;

    surface.style.height = previousHeight;
    if (expandedWidth) {
      element.style.width = previousWidth;
      element.getBoundingClientRect();
      element.style.transition = previousTransition;
    }
    return height;
  }

  private measureLayout() {
    let changed = false;
    for (const record of this.records) {
      const element = this.positionerElement(record.id);
      if (!element) continue;
      let height = this.heights.get(record.id) ?? 0;
      const needsHeightMeasurement =
        height <= 0 || this.measuredUpdateKeys.get(record.id) !== record.updateKey;
      if (needsHeightMeasurement) {
        height = this.measureNaturalHeight(element, !record.positioner);
        if (height > 0) {
          if (this.heights.get(record.id) !== height) changed = true;
          this.heights.set(record.id, height);
          this.measuredUpdateKeys.set(record.id, record.updateKey);
        }
      }

      if (!record.positioner) continue;
      const anchor = this.resolveAnchor(record.positioner.anchor);
      if (!anchor || height <= 0) {
        if (this.anchoredPositions.delete(record.id)) changed = true;
        continue;
      }
      const rect = element.getBoundingClientRect();
      const sideOffset = resolveCssLengthPx(
        record.positioner.sideOffset,
        TOKEN_DEFAULTS.space050,
      );
      const alignOffset = resolveCssLengthPx(record.positioner.alignOffset, 0);
      const position = computeTooltipPosition({
        anchorRect: anchor.getBoundingClientRect(),
        popupWidth: rect.width,
        popupHeight: height,
        side: record.positioner.side ?? 'top',
        align: record.positioner.align ?? 'center',
        sideOffsetPx: sideOffset,
        alignOffsetPx: alignOffset,
        viewportPadPx: resolveCssLengthPx(undefined, TOKEN_DEFAULTS.space200),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
      const current = this.anchoredPositions.get(record.id);
      if (
        !current ||
        current.x !== position.x ||
        current.y !== position.y ||
        current.side !== position.resolvedSide
      ) {
        this.anchoredPositions.set(record.id, {
          x: position.x,
          y: position.y,
          side: position.resolvedSide,
        });
        changed = true;
      }
    }
    if (changed) this.layoutVersion += 1;
  }

  private resolveAnchor(anchor: HTMLElement | string): HTMLElement | null {
    return typeof anchor === 'string' ? document.getElementById(anchor) : anchor;
  }

  private positionerElement(id: string): HTMLElement | null {
    return (
      Array.from(this.el.querySelectorAll<HTMLElement>('.toast-positioner'))
        .find(element => element.dataset['toastId'] === id) ?? null
    );
  }

  private ensureDomId(id: string): number {
    const current = this.domIds.get(id);
    if (current) return current;
    const next = ++this.nextDomId;
    this.domIds.set(id, next);
    return next;
  }

  private get activeRecords(): ToastRecord[] {
    return this.records.filter(record => record.transitionStatus !== 'ending');
  }

  private globalLayout() {
    const globalRecords = this.records.filter(record => !record.positioner);
    let offset = 0;
    let visibleIndex = 0;
    const gap = resolveCssLengthPx(undefined, TOKEN_DEFAULTS.space200);
    const layouts = new Map<string, { index: number; offset: number; limited: boolean }>();

    globalRecords.forEach((record, domIndex) => {
      if (record.transitionStatus === 'ending') {
        layouts.set(record.id, { index: domIndex, offset, limited: false });
        return;
      }

      const limited = visibleIndex >= Math.max(1, this.limit);
      layouts.set(record.id, { index: visibleIndex, offset, limited });
      offset += (this.heights.get(record.id) ?? 0) + gap;
      visibleIndex += 1;
    });
    return layouts;
  }

  private renderToast(
    record: ToastRecord,
    layout: { index: number; offset: number; limited: boolean },
  ) {
    const domId = this.ensureDomId(record.id);
    const titleId = `ds-toast-${this.instanceId}-${domId}-title`;
    const descriptionId = `ds-toast-${this.instanceId}-${domId}-description`;
    const swipe = this.swipe?.id === record.id ? this.swipe : null;
    const swipeDirection = swipe?.direction ?? this.dismissedSwipeDirections.get(record.id);
    const anchored = !!record.positioner;
    const anchoredPosition = this.anchoredPositions.get(record.id);
    const hiddenHighPriority = record.priority === 'high' && !this.keyboardActive;
    const focusTabIndex = this.keyboardActive && !layout.limited ? 0 : -1;
    const toastHeight = this.heights.get(record.id);

    return (
      <div
        ref={(element?: HTMLDivElement) => this.bindAnimationCancel(element, record.id)}
        class={{
          'toast-positioner': true,
          'toast-positioner--anchored': anchored,
          'toast-positioner--ending': record.transitionStatus === 'ending',
        }}
        data-toast-id={record.id}
        data-behind={!anchored && layout.index > 0 ? '' : undefined}
        data-limited={layout.limited ? '' : undefined}
        data-positioned={anchored ? String(!!anchoredPosition) : undefined}
        data-side={anchoredPosition?.side}
        inert={layout.limited ? true : undefined}
        aria-hidden={layout.limited ? 'true' : undefined}
        style={{
          '--toast-index': String(layout.index),
          '--toast-offset-y': `${layout.offset}px`,
          '--toast-height': toastHeight ? `${toastHeight}px` : undefined,
          zIndex: String(this.records.length - layout.index),
          left: anchoredPosition ? `${anchoredPosition.x}px` : undefined,
          top: anchoredPosition ? `${anchoredPosition.y}px` : undefined,
        }}
        onAnimationEnd={() => this.handleAnimationComplete(record)}
      >
        <div
          class={{
            'toast-surface': true,
            'toast-surface--swiping': !!swipe,
          }}
          role={record.priority === 'high' ? 'alertdialog' : 'dialog'}
          aria-modal="false"
          aria-labelledby={
            record.title ? titleId : record.description ? descriptionId : undefined
          }
          aria-describedby={record.title && record.description ? descriptionId : undefined}
          aria-hidden={hiddenHighPriority ? 'true' : undefined}
          data-type={record.type}
          data-priority={record.priority}
          data-transition-status={record.transitionStatus}
          data-swiping={swipe ? '' : undefined}
          data-swipe-direction={swipeDirection}
          style={{
            '--toast-swipe-movement-x': `${swipe?.x ?? 0}px`,
            '--toast-swipe-movement-y': `${swipe?.y ?? 0}px`,
            touchAction: this.touchAction,
          }}
          onPointerDown={(event: PointerEvent) => this.handlePointerDown(record, event)}
          onPointerMove={(event: PointerEvent) => this.handlePointerMove(event)}
          onPointerUp={(event: PointerEvent) => this.handlePointerUp(event)}
          onPointerCancel={(event: PointerEvent) => this.handlePointerCancel(event)}
          onPointerEnter={
            anchored ? () => this.handlePointerEnter(record.id) : undefined
          }
          onPointerLeave={
            anchored ? () => this.handlePointerLeave(record.id) : undefined
          }
        >
          <div class="toast-content">
            <div class="toast-copy">
              {record.title && (
                <ds-text
                  class="toast-title"
                  as="div"
                  variant="text-title-small"
                  color="primary"
                  textId={titleId}
                >
                  {record.title}
                </ds-text>
              )}
              {record.description && (
                <ds-text
                  class="toast-description"
                  as="div"
                  variant="text-body-medium"
                  color="secondary"
                  textId={descriptionId}
                >
                  {record.description}
                </ds-text>
              )}
            </div>
            {record.action && (
              <ds-button-unfilled
                class="toast-action"
                variant="label"
                size="md"
                type="button"
                label={record.action.label}
                aria-label={record.action.ariaLabel}
                hasBorder
                focusTabIndex={focusTabIndex}
                aria-hidden={!this.keyboardActive ? 'true' : undefined}
                onDsClick={(event: CustomEvent<MouseEvent>) =>
                  this.handleAction(record, event)
                }
              />
            )}
          </div>
          <ds-button-unfilled
            class="toast-close"
            variant="icon"
            size="md"
            type="button"
            icon="Cross"
            aria-label={this.closeLabel}
            hasBorder={false}
            activeFill={false}
            focusTabIndex={focusTabIndex}
            aria-hidden={!this.keyboardActive ? 'true' : undefined}
            onDsClick={() => this.manager.close(record.id, 'close-button')}
          />
        </div>
      </div>
    );
  }

  render() {
    void this.layoutVersion;
    const globalLayouts = this.globalLayout();
    const globalRecords = this.records.filter(record => !record.positioner);
    const anchoredRecords = this.records.filter(record => !!record.positioner);
    const highPriority = this.records.filter(
      record =>
        record.priority === 'high' &&
        record.transitionStatus !== 'ending' &&
        !globalLayouts.get(record.id)?.limited,
    );

    return (
      <Host>
        <section
          class="toast-region"
          role="region"
          aria-label={this.label}
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions text"
          tabIndex={-1}
          onFocusin={this.handleFocusIn}
          onFocusout={(event: FocusEvent) => this.handleFocusOut(event)}
          onKeyDown={(event: KeyboardEvent) => this.handleRegionKeyDown(event)}
        >
          <div
            class="toast-viewport"
            data-expanded={this.expanded ? '' : undefined}
            onPointerEnter={() => this.handlePointerEnter(GLOBAL_STACK_HOVER)}
            onPointerLeave={() => this.handlePointerLeave(GLOBAL_STACK_HOVER)}
          >
            {globalRecords.map(record =>
              this.renderToast(
                record,
                globalLayouts.get(record.id) ?? { index: 0, offset: 0, limited: false },
              )
            )}
          </div>
          <div class="toast-anchored-layer">
            {anchoredRecords.map(record =>
              this.renderToast(record, { index: 0, offset: 0, limited: false })
            )}
          </div>
          <div class="toast-assertive-announcer">
            {highPriority.map(record => (
              <div role="alert" aria-atomic="true">
                {[record.title, record.description].filter(Boolean).join('. ')}
              </div>
            ))}
          </div>
        </section>
      </Host>
    );
  }
}

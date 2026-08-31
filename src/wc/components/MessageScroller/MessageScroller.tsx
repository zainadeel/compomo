import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
} from '@stencil/core';
import type { MessageScrollerPosition } from '../conversation-types';
import { ScrollOverlayController } from '../../utils/scroll-overlay-controller';
import { resolveCssLengthPx } from '../../utils/resolve-css-length-px';
import {
  isMessageScrollerTranscriptReset,
  pruneMessageScrollerTranscriptSet,
} from './message-scroller-transcript';

const LIVE_EDGE_THRESHOLD = 24;

@Component({
  tag: 'ds-message-scroller',
  styleUrl: 'MessageScroller.css',
  styleUrls: ['../../utils/scroll-edge-fade.css'],
  scoped: true,
})
export class MessageScroller {
  @Element() el!: HTMLElement;

  @Prop() busy: boolean = false;
  @Prop() autoFollow: boolean = true;
  @Prop() defaultPosition: MessageScrollerPosition = 'last-anchor';
  @Prop() messagesLabel: string = 'Messages';

  @Event() dsReachStart!: EventEmitter<void>;

  @State() private showScrollToLatest = false;

  private viewport?: HTMLElement;
  private content?: HTMLElement;
  private overlay?: HTMLElement;
  private transcriptSlot?: HTMLSlotElement;
  private scrollOverlayController?: ScrollOverlayController;
  private mutationObserver?: MutationObserver;
  private following = true;
  private followReleased = false;
  private releasePendingAtLiveEdge = false;
  private atStart = false;
  private programmatic = false;
  private programmaticTimer?: ReturnType<typeof setTimeout>;
  private transcriptChildren: HTMLElement[] = [];
  private knownTranscriptElements = new Set<HTMLElement>();
  private knownTurnAnchors = new Set<HTMLElement>();
  private firstChildViewportTop?: number;
  private activeTurnAnchor?: HTMLElement;
  private activeTurnAnchorViewportTop?: number;
  private turnClearance = 0;
  private prependReconciliation = 0;
  private turnPositionGeneration = 0;
  private defaultPositionGeneration = 0;
  private transcriptResetPending = false;
  private hasLoaded = false;

  componentDidLoad() {
    this.hasLoaded = true;
    this.seedTranscriptBaseline();
    this.connectObservers();
    this.scheduleDefaultPosition();
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    document.addEventListener('selectionchange', this.handleSelectionChange);
  }

  connectedCallback() {
    if (!this.hasLoaded) return;
    this.seedTranscriptBaseline();
    this.connectObservers();
    this.scheduleDefaultPosition();
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    document.addEventListener('selectionchange', this.handleSelectionChange);
  }

  disconnectedCallback() {
    this.invalidateTranscriptWork();
    this.scrollOverlayController?.disconnect();
    this.scrollOverlayController = undefined;
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
    this.resetTranscriptTracking();
    this.resetTranscriptPositionState();
    this.transcriptResetPending = false;
    document.removeEventListener('selectionchange', this.handleSelectionChange);
  }

  @Method()
  async scrollToMessage(id: string): Promise<boolean> {
    const message = Array.from(
      this.el.querySelectorAll<HTMLElement & { messageId?: string }>('ds-message')
    ).find(item => item.messageId === id || item.getAttribute('message-id') === id);
    if (!message) return false;
    this.releasePendingAtLiveEdge = false;
    this.following = false;
    this.followReleased = true;
    this.showScrollToLatest = true;
    message.scrollIntoView({ block: 'start', behavior: this.motionBehavior() });
    return true;
  }

  @Method()
  async scrollToStart() {
    this.releasePendingAtLiveEdge = false;
    this.scrollTo(0);
    this.following = false;
    this.followReleased = true;
    this.showScrollToLatest = Boolean(
      this.viewport && this.viewport.scrollHeight > this.viewport.clientHeight
    );
  }

  @Method()
  async scrollToEnd() {
    this.releasePendingAtLiveEdge = false;
    this.following = true;
    this.followReleased = false;
    this.showScrollToLatest = false;
    this.scrollTo(this.viewport?.scrollHeight ?? 0);
  }

  private motionBehavior(): ScrollBehavior {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  private scrollTo(top: number) {
    if (!this.viewport) return;
    this.programmatic = true;
    const behavior = this.motionBehavior();
    this.viewport.scrollTo({ top, behavior });
    if (this.programmaticTimer) clearTimeout(this.programmaticTimer);
    this.programmaticTimer = setTimeout(
      () => {
        this.programmatic = false;
        this.programmaticTimer = undefined;
        if (this.following) {
          this.viewport!.scrollTop = top;
          this.showScrollToLatest = false;
        }
      },
      behavior === 'smooth' ? 600 : 0
    );
  }

  private invalidateTranscriptWork() {
    this.prependReconciliation += 1;
    this.turnPositionGeneration += 1;
    this.defaultPositionGeneration += 1;
    if (this.programmaticTimer) clearTimeout(this.programmaticTimer);
    this.programmaticTimer = undefined;
    this.programmatic = false;
  }

  private clearActiveTurnAnchor() {
    this.activeTurnAnchor = undefined;
    this.activeTurnAnchorViewportTop = undefined;
    this.turnClearance = 0;
    this.el.style.removeProperty('--ds-message-scroller-turn-clearance');
  }

  private resetTranscriptTracking() {
    this.transcriptChildren = [];
    this.knownTranscriptElements.clear();
    this.knownTurnAnchors.clear();
    this.firstChildViewportTop = undefined;
    this.clearActiveTurnAnchor();
  }

  private resetTranscriptPositionState() {
    this.following = true;
    this.followReleased = false;
    this.releasePendingAtLiveEdge = false;
    this.atStart = false;
    this.showScrollToLatest = false;
  }

  private trackTranscript(elements: readonly HTMLElement[]) {
    elements.forEach(element => {
      this.knownTranscriptElements.add(element);
      if (element.matches('ds-message[scroll-anchor]')) {
        this.knownTurnAnchors.add(element);
      }
    });
  }

  private seedTranscriptBaseline() {
    this.resetTranscriptTracking();
    this.transcriptChildren = this.getTranscriptChildren();
    this.trackTranscript(this.transcriptChildren);
    this.transcriptResetPending = false;
    this.rememberFirstChildTop();
  }

  private pruneTranscriptTracking(current: readonly HTMLElement[]) {
    pruneMessageScrollerTranscriptSet(this.knownTranscriptElements, current);
    pruneMessageScrollerTranscriptSet(this.knownTurnAnchors, current);
    if (this.activeTurnAnchor && !current.includes(this.activeTurnAnchor)) {
      this.clearActiveTurnAnchor();
    }
  }

  private scheduleDefaultPosition() {
    const generation = ++this.defaultPositionGeneration;
    requestAnimationFrame(() => {
      if (generation !== this.defaultPositionGeneration || !this.el.isConnected) return;
      this.applyDefaultPosition();
    });
  }

  private connectObservers() {
    if (!this.viewport || !this.content || !this.overlay) return;
    this.scrollOverlayController?.disconnect();
    this.mutationObserver?.disconnect();
    this.scrollOverlayController = new ScrollOverlayController({
      host: this.el,
      viewport: this.viewport,
      content: this.content,
      overlay: this.overlay,
      overlayContentSelector: '.message-scroller__overlay-stack',
      onGeometryChange: () => this.handleContentGrowth(),
    });
    this.scrollOverlayController.connect();
    this.mutationObserver = new MutationObserver(() => {
      this.handleTranscriptChange();
      this.handleContentGrowth();
    });
    this.mutationObserver.observe(this.el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private handleContentGrowth() {
    if (!this.viewport) return;
    this.syncTurnClearance();
    const nextHeight = this.viewport.scrollHeight;
    if (this.autoFollow && this.following && !this.followReleased) {
      this.viewport.scrollTop = nextHeight;
    }
    if (this.releasePendingAtLiveEdge && !this.isAtLiveEdge()) {
      this.releasePendingAtLiveEdge = false;
    }
    this.showScrollToLatest = !this.following && !this.isAtLiveEdge();
    this.scrollOverlayController?.sync();
  }

  private rememberFirstChildTop() {
    if (!this.viewport) return;
    const first = this.getTranscriptChildren()[0];
    this.firstChildViewportTop = first
      ? first.getBoundingClientRect().top - this.viewport.getBoundingClientRect().top
      : undefined;
  }

  private getTranscriptChildren(): HTMLElement[] {
    const assigned = this.transcriptSlot?.assignedElements() ?? [];
    const assignedTranscript = assigned.filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        (element.matches('ds-message') || element.matches('ds-agent-response'))
    );
    const queriedTranscript = Array.from(
      this.el.querySelectorAll<HTMLElement>('ds-message, ds-agent-response')
    ).filter(element => {
      if (element.closest('.message-scroller__interaction, .message-scroller__overlay-content')) {
        return false;
      }
      if (element.matches('ds-agent-response')) return true;
      return !element.closest('ds-agent-response');
    });
    return queriedTranscript.length > assignedTranscript.length
      ? queriedTranscript
      : assignedTranscript;
  }

  private handleTranscriptChange = () => {
    const current = this.getTranscriptChildren();
    const previous = this.transcriptChildren;
    const transcriptReset =
      isMessageScrollerTranscriptReset(previous, current) ||
      (this.transcriptResetPending && current.length > 0);
    if (transcriptReset) {
      this.invalidateTranscriptWork();
      this.resetTranscriptTracking();
      this.resetTranscriptPositionState();
      this.transcriptChildren = current;
      this.trackTranscript(current);
      this.transcriptResetPending = current.length === 0;
      this.rememberFirstChildTop();
      this.scrollOverlayController?.sync();
      if (current.length) this.scheduleDefaultPosition();
      return;
    }

    const hadKnownTranscript = this.knownTranscriptElements.size > 0;
    const previouslyKnown = new Set(this.knownTranscriptElements);
    const appendedAnchor = [...current].reverse().find((element, reverseIndex) => {
      if (!element.matches('ds-message[scroll-anchor]') || this.knownTurnAnchors.has(element)) {
        return false;
      }
      const index = current.length - reverseIndex - 1;
      return current.slice(index + 1).every(next => !this.knownTranscriptElements.has(next));
    });
    this.trackTranscript(current);
    this.pruneTranscriptTracking(current);
    if (!previous.length) {
      this.transcriptChildren = current;
      if (appendedAnchor && hadKnownTranscript) {
        this.scheduleNewTurnPosition(appendedAnchor);
      }
      return;
    }

    const firstKnownIndex = current.findIndex(element => previouslyKnown.has(element));
    const newTranscript = current.filter(element => !previouslyKnown.has(element));
    const prepended =
      (current.length > previous.length &&
        previous.every(
          (element, index) => current[current.length - previous.length + index] === element
        )) ||
      (!appendedAnchor &&
        newTranscript.length > 0 &&
        firstKnownIndex > 0 &&
        newTranscript.every(element => current.indexOf(element) < firstKnownIndex));

    this.transcriptChildren = current;
    if (prepended) {
      if (this.viewport) {
        const preservedElement = this.activeTurnAnchor?.isConnected
          ? this.activeTurnAnchor
          : previous[0];
        const preservedTop = this.activeTurnAnchor?.isConnected
          ? this.activeTurnAnchorViewportTop
          : this.firstChildViewportTop;
        if (preservedElement && preservedTop !== undefined) {
          this.reconcilePrependPosition(preservedElement, preservedTop);
          this.schedulePrependReconciliation(preservedElement, preservedTop, newTranscript);
        }
      }
      this.rememberFirstChildTop();
      this.rememberActiveTurnAnchorTop();
      this.scrollOverlayController?.sync();
      return;
    }
    if (appendedAnchor) {
      this.scheduleNewTurnPosition(appendedAnchor);
    }
  };

  private reconcilePrependPosition(element: HTMLElement, viewportTop: number) {
    if (!this.viewport || !element.isConnected) return;
    const nextTop = element.getBoundingClientRect().top - this.viewport.getBoundingClientRect().top;
    this.viewport.scrollTop += nextTop - viewportTop;
  }

  private schedulePrependReconciliation(
    element: HTMLElement,
    viewportTop: number,
    prepended: HTMLElement[]
  ) {
    const generation = ++this.prependReconciliation;
    // Prepended custom elements can gain height after their child-list mutation.
    // Reconcile against the original coordinate after their layouts settle.
    const pending = prepended
      .flatMap(item => [item, ...Array.from(item.querySelectorAll<HTMLElement>('*'))])
      .map(item => {
        const componentOnReady = (
          item as HTMLElement & { componentOnReady?: () => Promise<unknown> }
        ).componentOnReady;
        return componentOnReady ? componentOnReady.call(item).catch(() => undefined) : null;
      })
      .filter((promise): promise is Promise<unknown> => Boolean(promise));

    void Promise.all(pending).then(() => {
      requestAnimationFrame(() => {
        if (generation !== this.prependReconciliation) return;
        this.reconcilePrependPosition(element, viewportTop);
        requestAnimationFrame(() => {
          if (generation !== this.prependReconciliation) return;
          this.reconcilePrependPosition(element, viewportTop);
          this.rememberFirstChildTop();
          this.rememberActiveTurnAnchorTop();
          this.scrollOverlayController?.sync();
        });
      });
    });
  }

  private handleTranscriptSlotChange = () => this.handleTranscriptChange();

  private scheduleNewTurnPosition(anchor: HTMLElement) {
    const generation = ++this.turnPositionGeneration;
    requestAnimationFrame(() => {
      if (generation !== this.turnPositionGeneration || !anchor.isConnected || !this.viewport) {
        return;
      }
      this.positionNewTurn(anchor, generation);
    });
  }

  private positionNewTurn(anchor: HTMLElement, generation: number) {
    if (generation !== this.turnPositionGeneration || !this.viewport || !anchor.isConnected) return;
    this.activeTurnAnchor = anchor;
    this.syncTurnClearance();
    requestAnimationFrame(() => {
      if (generation !== this.turnPositionGeneration) return;
      this.finishPositionNewTurn(anchor, generation);
    });
  }

  private finishPositionNewTurn(anchor: HTMLElement, generation: number) {
    if (generation !== this.turnPositionGeneration || !this.viewport || !anchor.isConnected) {
      return;
    }
    const viewportRect = this.viewport.getBoundingClientRect();
    const anchorTop =
      anchor.getBoundingClientRect().top - viewportRect.top + this.viewport.scrollTop;
    const customOffset = getComputedStyle(this.el)
      .getPropertyValue('--ds-message-scroller-anchor-offset')
      .trim();
    const offset = resolveCssLengthPx(customOffset, 'var(--dimension-space-800)');
    const max = Math.max(this.viewport.scrollHeight - this.viewport.clientHeight, 0);
    const target = Math.min(Math.max(anchorTop - offset, 0), max);
    this.following = max - target <= LIVE_EDGE_THRESHOLD;
    this.followReleased = !this.following;
    this.showScrollToLatest = !this.following;
    this.programmatic = true;
    this.viewport.scrollTop = target;
    requestAnimationFrame(() => {
      if (generation !== this.turnPositionGeneration) return;
      this.programmatic = false;
      this.following = this.isAtLiveEdge();
      this.followReleased = !this.following;
      this.showScrollToLatest = !this.following;
      this.rememberFirstChildTop();
      this.rememberActiveTurnAnchorTop();
    });
    this.scrollOverlayController?.sync();
  }

  private rememberActiveTurnAnchorTop() {
    if (!this.viewport || !this.activeTurnAnchor?.isConnected) return;
    this.activeTurnAnchorViewportTop =
      this.activeTurnAnchor.getBoundingClientRect().top - this.viewport.getBoundingClientRect().top;
  }

  private syncTurnClearance() {
    if (!this.viewport || !this.activeTurnAnchor?.isConnected) return;
    const children = this.getTranscriptChildren();
    const last = children[children.length - 1];
    if (!last) return;
    const anchorRect = this.activeTurnAnchor.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();
    const customOffset = getComputedStyle(this.el)
      .getPropertyValue('--ds-message-scroller-anchor-offset')
      .trim();
    const offset = resolveCssLengthPx(customOffset, 'var(--dimension-space-800)');
    const contentAfterAnchor = Math.max(lastRect.bottom - anchorRect.top, 0);
    const clearance = Math.max(
      Math.ceil(this.viewport.clientHeight - offset - contentAfterAnchor),
      0
    );
    if (clearance === this.turnClearance) return;
    this.turnClearance = clearance;
    this.el.style.setProperty('--ds-message-scroller-turn-clearance', `${clearance}px`);
  }

  private applyDefaultPosition() {
    if (!this.viewport) return;
    this.releasePendingAtLiveEdge = false;
    if (this.defaultPosition === 'start') {
      this.viewport.scrollTop = 0;
      this.following = false;
      this.followReleased = true;
      this.showScrollToLatest = this.viewport.scrollHeight > this.viewport.clientHeight;
      this.scrollOverlayController?.sync();
      return;
    }
    if (this.defaultPosition === 'last-anchor') {
      const anchors = this.el.querySelectorAll<HTMLElement>('ds-message[scroll-anchor]');
      const last = anchors.item(anchors.length - 1);
      if (last) {
        last.scrollIntoView({ block: 'start' });
        this.following = this.isAtLiveEdge();
        this.followReleased = !this.following;
        this.showScrollToLatest = !this.following;
        this.scrollOverlayController?.sync();
        return;
      }
    }
    this.viewport.scrollTop = this.viewport.scrollHeight;
    this.following = true;
    this.followReleased = false;
    this.showScrollToLatest = false;
    this.scrollOverlayController?.sync();
  }

  private isAtLiveEdge(): boolean {
    if (!this.viewport) return true;
    return (
      this.viewport.scrollHeight - this.viewport.clientHeight - this.viewport.scrollTop <=
      LIVE_EDGE_THRESHOLD
    );
  }

  private handleScroll = () => {
    if (!this.viewport) return;
    this.scrollOverlayController?.sync();
    this.rememberFirstChildTop();
    this.rememberActiveTurnAnchorTop();
    if (this.programmatic) return;
    const atLiveEdge = this.isAtLiveEdge();
    if (this.releasePendingAtLiveEdge && atLiveEdge) {
      // A scroll event queued by the previous auto-follow can arrive after
      // reader input. Keep that stale event from restoring follow mode.
      this.following = false;
      this.followReleased = true;
      this.showScrollToLatest = false;
      return;
    }
    this.releasePendingAtLiveEdge = false;
    this.following = atLiveEdge;
    this.followReleased = !this.following;
    this.showScrollToLatest = !this.following;
    const nextAtStart = this.viewport.scrollTop <= LIVE_EDGE_THRESHOLD;
    if (nextAtStart && !this.atStart) this.dsReachStart.emit();
    this.atStart = nextAtStart;
  };

  private releaseFollow = () => {
    this.prependReconciliation += 1;
    this.releasePendingAtLiveEdge = this.isAtLiveEdge();
    this.following = false;
    this.followReleased = true;
    this.showScrollToLatest = !this.releasePendingAtLiveEdge;
  };

  private handleSelectionChange = () => {
    const selection = document.getSelection();
    if (
      selection &&
      !selection.isCollapsed &&
      selection.anchorNode &&
      this.el.contains(selection.anchorNode)
    ) {
      this.releaseFollow();
    }
  };

  render() {
    return (
      <Host>
        <div class="message-scroller">
          <div
            class="message-scroller__viewport"
            ref={element => {
              this.viewport = element;
            }}
            role="region"
            aria-label={this.messagesLabel}
            tabIndex={0}
            onScroll={this.handleScroll}
            onPointerDown={(event: PointerEvent) => {
              if (event.pointerType === 'touch') this.releaseFollow();
            }}
            onWheel={this.releaseFollow}
            onKeyDown={(event: KeyboardEvent) => {
              if (
                ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(
                  event.key
                )
              ) {
                this.releaseFollow();
              }
            }}
          >
            <div
              class="message-scroller__content scroll-edge-fade--block-window"
              ref={element => {
                this.content = element;
              }}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={this.busy ? 'true' : undefined}
            >
              <slot
                ref={element => {
                  this.transcriptSlot = element;
                }}
                onSlotchange={this.handleTranscriptSlotChange}
              />
            </div>
          </div>
          <div
            class="message-scroller__overlay"
            ref={element => {
              this.overlay = element;
            }}
          >
            <div class="message-scroller__overlay-stack">
              <div class="message-scroller__interaction">
                <slot name="interaction" />
              </div>
              <div class="message-scroller__overlay-content">
                <slot name="overlay" />
              </div>
            </div>
          </div>
          {this.showScrollToLatest ? (
            <div class="message-scroller__control ds-control-elevation ds-control-elevation--md ds-control-elevation--press-scale">
              <ds-tooltip label="Scroll to latest message" side="top" size="sm">
                <ds-button-unfilled
                  variant="icon"
                  icon="ChevronDown"
                  size="md"
                  rounded
                  hasBorder={false}
                  aria-label="Scroll to latest message"
                  onDsClick={() => void this.scrollToEnd()}
                />
              </ds-tooltip>
            </div>
          ) : null}
        </div>
      </Host>
    );
  }
}

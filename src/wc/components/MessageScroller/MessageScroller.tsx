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

const LIVE_EDGE_THRESHOLD = 24;

@Component({
  tag: 'ds-message-scroller',
  styleUrl: 'MessageScroller.css',
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
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private following = true;
  private atStart = false;
  private programmatic = false;
  private previousScrollHeight = 0;

  componentDidLoad() {
    this.connectObservers();
    requestAnimationFrame(() => this.applyDefaultPosition());
    document.addEventListener('selectionchange', this.handleSelectionChange);
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    document.removeEventListener('selectionchange', this.handleSelectionChange);
  }

  @Method()
  async scrollToMessage(id: string): Promise<boolean> {
    const message = Array.from(
      this.el.querySelectorAll<HTMLElement & { messageId?: string }>('ds-message')
    ).find(item => item.messageId === id || item.getAttribute('message-id') === id);
    if (!message) return false;
    this.following = false;
    this.showScrollToLatest = true;
    message.scrollIntoView({ block: 'start', behavior: this.motionBehavior() });
    return true;
  }

  @Method()
  async scrollToStart() {
    this.scrollTo(0);
    this.following = false;
    this.showScrollToLatest = Boolean(
      this.viewport && this.viewport.scrollHeight > this.viewport.clientHeight
    );
  }

  @Method()
  async scrollToEnd() {
    this.following = true;
    this.showScrollToLatest = false;
    this.scrollTo(this.viewport?.scrollHeight ?? 0);
  }

  private motionBehavior(): ScrollBehavior {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  private scrollTo(top: number) {
    if (!this.viewport) return;
    this.programmatic = true;
    this.viewport.scrollTo({ top, behavior: this.motionBehavior() });
    requestAnimationFrame(() => {
      this.programmatic = false;
    });
  }

  private connectObservers() {
    if (!this.viewport || !this.content) return;
    this.previousScrollHeight = this.viewport.scrollHeight;
    this.resizeObserver = new ResizeObserver(() => this.handleContentGrowth());
    this.resizeObserver.observe(this.content);
    this.mutationObserver = new MutationObserver(() => this.handleContentGrowth());
    this.mutationObserver.observe(this.content, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private handleContentGrowth() {
    if (!this.viewport) return;
    const nextHeight = this.viewport.scrollHeight;
    const delta = nextHeight - this.previousScrollHeight;
    if (delta > 0 && this.viewport.scrollTop <= LIVE_EDGE_THRESHOLD && !this.following) {
      this.viewport.scrollTop += delta;
    } else if (this.autoFollow && this.following) {
      this.viewport.scrollTop = nextHeight;
    }
    this.previousScrollHeight = nextHeight;
    this.showScrollToLatest = !this.following && !this.isAtLiveEdge();
  }

  private applyDefaultPosition() {
    if (!this.viewport) return;
    if (this.defaultPosition === 'start') {
      this.viewport.scrollTop = 0;
      this.following = false;
      this.showScrollToLatest = this.viewport.scrollHeight > this.viewport.clientHeight;
      return;
    }
    if (this.defaultPosition === 'last-anchor') {
      const anchors = this.el.querySelectorAll<HTMLElement>('ds-message[scroll-anchor]');
      const last = anchors.item(anchors.length - 1);
      if (last) {
        last.scrollIntoView({ block: 'start' });
        this.following = this.isAtLiveEdge();
        this.showScrollToLatest = !this.following;
        return;
      }
    }
    this.viewport.scrollTop = this.viewport.scrollHeight;
    this.following = true;
    this.showScrollToLatest = false;
  }

  private isAtLiveEdge(): boolean {
    if (!this.viewport) return true;
    return (
      this.viewport.scrollHeight - this.viewport.clientHeight - this.viewport.scrollTop <=
      LIVE_EDGE_THRESHOLD
    );
  }

  private handleScroll = () => {
    if (!this.viewport || this.programmatic) return;
    this.following = this.isAtLiveEdge();
    this.showScrollToLatest = !this.following;
    const nextAtStart = this.viewport.scrollTop <= LIVE_EDGE_THRESHOLD;
    if (nextAtStart && !this.atStart) this.dsReachStart.emit();
    this.atStart = nextAtStart;
  };

  private releaseFollow = () => {
    this.following = false;
    this.showScrollToLatest = !this.isAtLiveEdge();
  };

  private handleSelectionChange = () => {
    const selection = document.getSelection();
    if (
      selection &&
      !selection.isCollapsed &&
      selection.anchorNode &&
      this.el.contains(selection.anchorNode)
    ) {
      this.following = false;
      this.showScrollToLatest = !this.isAtLiveEdge();
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
            onPointerDown={this.releaseFollow}
            onKeyDown={(event: KeyboardEvent) => {
              if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) this.releaseFollow();
            }}
          >
            <div
              class="message-scroller__content"
              ref={element => {
                this.content = element;
              }}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={this.busy ? 'true' : undefined}
            >
              <slot />
            </div>
          </div>
          {this.showScrollToLatest ? (
            <div class="message-scroller__control">
              <ds-button-unfilled
                variant="icon"
                icon="ChevronDown"
                size="md"
                rounded
                aria-label="Scroll to latest message"
                onDsClick={() => void this.scrollToEnd()}
              />
            </div>
          ) : null}
        </div>
      </Host>
    );
  }
}

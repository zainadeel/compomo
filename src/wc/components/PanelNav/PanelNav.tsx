import { Component, Prop, Event, EventEmitter, Watch, State, Element, h, Host } from '@stencil/core';

export type PanelNavVariant = 'dashboard' | 'settings';

export interface PanelNavItem {
  id: string;
  icon: string;
  label: string;
  /** Show a notification dot badge on the item */
  dot?: boolean;
  flag?: boolean;
}

export interface PanelNavGroup {
  id?: string;
  label?: string;
  items: PanelNavItem[];
}

@Component({
  tag: 'ds-panel-nav',
  styleUrl: 'PanelNav.css',
  scoped: true,
})
export class PanelNav {
  /** Visual variant: `dashboard` = always-dark surface, `settings` = light surface */
  @Prop() variant: PanelNavVariant = 'dashboard';

  /** JSON string of `PanelNavGroup[]` */
  @Prop() groups: string = '[]';

  /** ID of the currently active/selected nav item */
  @Prop() activeId: string = '';

  /** Whether the nav is in collapsed (icon-only) state */
  @Prop() collapsed: boolean = false;

  /** Viewport width (px) below which the nav auto-collapses to icon-only mode. 0 = disabled. */
  @Prop() breakpoint: number = 0;

  /** Display name for the footer user section */
  @Prop() userName: string = '';

  /** Single character shown in the collapsed avatar */
  @Prop() userInitial: string = '';

  /** Emitted when a nav item is clicked. Detail = the item's `id`. */
  @Event() dsNavSelect!: EventEmitter<string>;

  /** Emitted when the collapse toggle is clicked. Detail = new collapsed state. */
  @Event() dsNavToggle!: EventEmitter<boolean>;

  /** Emitted when the footer left button (gear / dashboard) is clicked. */
  @Event() dsNavFooterAction!: EventEmitter<void>;

  @Element() el!: HTMLElement;

  @State() private parsedGroups: PanelNavGroup[] = [];
  @State() private atBottom = false;
  @State() private isAnimating = false;
  @State() private rovingIndex: number = 0;
  @State() private viewportNarrow: boolean = false;

  private transitionEndHandler?: (e: TransitionEvent) => void;
  private resizeObserver?: ResizeObserver;

  @Watch('collapsed')
  @Watch('viewportNarrow')
  onCollapsedChange() {
    this.startCollapseAnimation();
  }

  @Watch('breakpoint')
  onBreakpointChange() {
    this.disconnectResizeObserver();
    if (this.breakpoint > 0) this.connectResizeObserver();
  }

  private startCollapseAnimation() {
    this.isAnimating = true;
    const panel = this.el.querySelector('.panel-nav') as HTMLElement | null;
    if (this.transitionEndHandler) {
      panel?.removeEventListener('transitionend', this.transitionEndHandler);
    }
    this.transitionEndHandler = (e: TransitionEvent) => {
      if (e.propertyName === 'width') {
        this.isAnimating = false;
        panel?.removeEventListener('transitionend', this.transitionEndHandler!);
      }
    };
    panel?.addEventListener('transitionend', this.transitionEndHandler);
  }

  private connectResizeObserver() {
    this.viewportNarrow = window.innerWidth < this.breakpoint;
    this.resizeObserver = new ResizeObserver(() => {
      this.viewportNarrow = window.innerWidth < this.breakpoint;
    });
    this.resizeObserver.observe(document.documentElement);
  }

  private disconnectResizeObserver() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  @Watch('groups')
  onGroupsChange(val: string) {
    try {
      this.parsedGroups = JSON.parse(val);
    } catch {
      this.parsedGroups = [];
    }
    this.syncRovingIndex();
  }

  @Watch('activeId')
  onActiveIdChange() {
    this.syncRovingIndex();
  }

  componentWillLoad() {
    this.onGroupsChange(this.groups);
  }

  private getAllItems(): PanelNavItem[] {
    return this.parsedGroups.flatMap(g => g.items);
  }

  private syncRovingIndex() {
    const idx = this.getAllItems().findIndex(i => i.id === this.activeId);
    this.rovingIndex = idx >= 0 ? idx : 0;
  }

  private handleItemKeyDown(e: KeyboardEvent, index: number) {
    const total = this.getAllItems().length;
    let next = index;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); next = (index + 1) % total; break;
      case 'ArrowUp':   e.preventDefault(); next = (index - 1 + total) % total; break;
      case 'Home':      e.preventDefault(); next = 0; break;
      case 'End':       e.preventDefault(); next = total - 1; break;
      default: return;
    }
    this.rovingIndex = next;
    const buttons = Array.from(
      this.el.querySelectorAll<HTMLElement>('.panel-nav__body .panel-nav__item')
    );
    buttons[next]?.focus();
  }

  componentDidLoad() {
    this.checkScroll();
    if (this.breakpoint > 0) this.connectResizeObserver();
  }

  disconnectedCallback() {
    this.disconnectResizeObserver();
  }

  private checkScroll() {
    const body = this.el.querySelector('.panel-nav__body') as HTMLElement | null;
    if (!body) return;
    const remaining = body.scrollHeight - body.scrollTop - body.clientHeight;
    this.atBottom = remaining < 2;
  }

  private handleBodyScroll(e: Event) {
    const body = e.target as HTMLElement;
    const remaining = body.scrollHeight - body.scrollTop - body.clientHeight;
    this.atBottom = remaining < 2;
  }

  private handleItemClick(id: string) {
    this.dsNavSelect.emit(id);
  }

  private handleToggle() {
    this.dsNavToggle.emit(!this.collapsed);
  }

  private handleFooterAction() {
    this.dsNavFooterAction.emit();
  }

  render() {
    const isDashboard = this.variant === 'dashboard';
    const collapsed = this.collapsed || this.viewportNarrow;
    const { userName, userInitial } = this;

    const navCls: Record<string, boolean> = {
      'panel-nav': true,
      'panel-nav--dashboard': isDashboard,
      'panel-nav--settings': !isDashboard,
      'panel-nav--collapsed': collapsed,
      'panel-nav--animating': this.isAnimating,
      'panel-nav--at-bottom': this.atBottom,
    };

    return (
      <Host>
        <nav class={navCls} aria-label={isDashboard ? 'Main navigation' : 'Settings navigation'}>

          {/* ── Header: Motive logo, reveals collapse toggle on hover ── */}
          <div class="panel-nav__header">
            <button
              type="button"
              class="panel-nav__header-btn"
              onClick={() => this.handleToggle()}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              aria-expanded={collapsed ? 'false' : 'true'}
            >
              {/* Motive M mark — fades out on hover to reveal collapse toggle */}
              <span class="panel-nav__header-logo" aria-hidden="true">
                <svg class="panel-nav__m-mark" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.1159 4.31537H7.67021L2.53401 13.0703H0V15.6875H4.02716L8.24319 8.49978V15.6846H11.6342L15.8289 8.47829V15.6846H18.7122V4.3125H15.2559L11.1159 11.3648V4.31537Z" fill="currentColor"/>
                </svg>
              </span>
              {/* Collapse / expand icon — revealed on hover via CSS */}
              <span class="panel-nav__header-toggle" aria-hidden="true">
                <ds-icon
                  name={collapsed ? 'LeftExpandB' : 'LeftCollapseB'}
                  size="md"
                  color="inherit"
                />
              </span>
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div class="panel-nav__body" onScroll={e => this.handleBodyScroll(e)}>
            {(() => {
              let flatIdx = 0;
              return this.parsedGroups.map(group => (
                <div class="panel-nav__group">
                  {group.label && (
                    <span class="panel-nav__group-label">
                      <ds-text as="span" variant="text-caption-emphasis" color="inherit">
                        {group.label}
                      </ds-text>
                    </span>
                  )}
                  {group.items.map(item => {
                    const isActive = item.id === this.activeId;
                    const idx = flatIdx++;
                    return (
                      <button
                        type="button"
                        class={{
                          'panel-nav__item': true,
                          'panel-nav__item--active': isActive,
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        title={collapsed ? item.label : undefined}
                        tabIndex={idx === this.rovingIndex ? 0 : -1}
                        onClick={() => this.handleItemClick(item.id)}
                        onKeyDown={(e: KeyboardEvent) => this.handleItemKeyDown(e, idx)}
                        onFocus={() => { this.rovingIndex = idx; }}
                      >
                      <span class="panel-nav__item-icon">
                        <ds-icon
                          name={item.icon}
                          size="md"
                          color="inherit"
                          flag={item.flag}
                        />
                      </span>
                      <span class="panel-nav__item-label">
                        <span class="panel-nav__item-label-text">
                          <ds-text
                            as="span"
                            variant={isActive ? 'text-body-medium-emphasis' : 'text-body-medium'}
                            color="inherit"
                          >
                            {item.label}
                          </ds-text>
                        </span>
                      </span>
                      {item.dot && (
                        <span class="panel-nav__item-dot" aria-hidden="true" />
                      )}
                    </button>
                  );
                  })}
                </div>
              ));
            })()}
          </div>

          {/* ── Footer ── */}
          <div class="panel-nav__footer">
            {/* Left icon button — Gear in dashboard, Dashboard in settings */}
            <button
              type="button"
              class="panel-nav__footer-btn"
              title={isDashboard ? 'Settings' : 'Dashboard'}
              aria-label={isDashboard ? 'Open settings' : 'Go to dashboard'}
              onClick={() => this.handleFooterAction()}
            >
              <ds-icon name={isDashboard ? 'Gear' : 'Dashboard'} size="md" color="inherit" />
            </button>

            {/* Right user — label fades like nav items; right icon cross-fades chevron ↔ circle+initial */}
            <button
              type="button"
              class="panel-nav__item panel-nav__footer-user"
              aria-label={collapsed ? `User: ${userName}` : `User menu for ${userName}`}
            >
              <span class="panel-nav__item-label panel-nav__footer-user-label">
                <span class="panel-nav__item-label-text">
                  <ds-text as="span" variant="text-body-medium-emphasis" color="inherit">
                    {userName}
                  </ds-text>
                </span>
              </span>
              <span class="panel-nav__item-icon panel-nav__footer-user-icon" aria-hidden="true">
                <span class="panel-nav__footer-icon-expanded">
                  <ds-icon name="ChevronUpDown" size="md" color="inherit" />
                </span>
                <span class="panel-nav__footer-icon-collapsed">
                  <ds-icon name="Circle" size="md" color="inherit" />
                  <span class="panel-nav__user-initial">
                    <ds-text as="span" variant="text-caption-emphasis" color="inherit">
                      {userInitial}
                    </ds-text>
                  </span>
                </span>
              </span>
            </button>
          </div>

        </nav>
      </Host>
    );
  }
}

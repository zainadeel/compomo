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

  private transitionEndHandler?: (e: TransitionEvent) => void;

  @Watch('collapsed')
  onCollapsedChange() {
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

  @Watch('groups')
  onGroupsChange(val: string) {
    try {
      this.parsedGroups = JSON.parse(val);
    } catch {
      this.parsedGroups = [];
    }
  }

  componentWillLoad() {
    this.onGroupsChange(this.groups);
  }

  componentDidLoad() {
    this.checkScroll();
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
    const { collapsed, userName, userInitial } = this;

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
            {this.parsedGroups.map(group => (
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
                  return (
                    <button
                      type="button"
                      class={{
                        'panel-nav__item': true,
                        'panel-nav__item--active': isActive,
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      onClick={() => this.handleItemClick(item.id)}
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
            ))}
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

            {/* Right user — expanded: item-style with icon on right; mini: avatar + overlaid initial */}
            {collapsed ? (
              <button
                type="button"
                class="panel-nav__footer-btn panel-nav__footer-user-mini"
                title={userName}
                aria-label={`User: ${userName}`}
              >
                <ds-icon name="Circle" size="md" color="inherit" />
                <span class="panel-nav__user-initial" aria-hidden="true">
                  <ds-text as="span" variant="text-caption-emphasis" color="inherit">
                    {userInitial}
                  </ds-text>
                </span>
              </button>
            ) : (
              <button
                type="button"
                class="panel-nav__item panel-nav__footer-user"
                aria-label={`User menu for ${userName}`}
              >
                <span class="panel-nav__item-label">
                  <span class="panel-nav__item-label-text">
                    <ds-text as="span" variant="text-body-medium-emphasis" color="inherit">
                      {userName}
                    </ds-text>
                  </span>
                </span>
                <span class="panel-nav__item-icon">
                  <ds-icon name="ChevronUpDown" size="md" color="inherit" />
                </span>
              </button>
            )}
          </div>

        </nav>
      </Host>
    );
  }
}

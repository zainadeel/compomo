import { Component, Prop, Event, EventEmitter, Watch, State, h, Host } from '@stencil/core';

export type PanelNavVariant = 'dashboard' | 'settings';

export interface PanelNavItem {
  id: string;
  icon: string;
  label: string;
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

  /** Single character shown in the avatar circle */
  @Prop() userInitial: string = '';

  /** Emitted when a nav item is clicked. Detail = the item's `id`. */
  @Event() dsNavSelect!: EventEmitter<string>;

  /** Emitted when the collapse toggle is clicked. Detail = new collapsed state. */
  @Event() dsNavToggle!: EventEmitter<boolean>;

  @State() private parsedGroups: PanelNavGroup[] = [];

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

  private handleItemClick(id: string) {
    this.dsNavSelect.emit(id);
  }

  private handleToggle() {
    this.dsNavToggle.emit(!this.collapsed);
  }

  render() {
    const isDashboard = this.variant === 'dashboard';
    const { collapsed, userName, userInitial } = this;

    const navCls: Record<string, boolean> = {
      'panel-nav': true,
      'panel-nav--dashboard': isDashboard,
      'panel-nav--settings': !isDashboard,
      'panel-nav--collapsed': collapsed,
    };

    return (
      <Host>
        <nav class={navCls} aria-label={isDashboard ? 'Main navigation' : 'Settings navigation'}>

          {/* Scrollable body */}
          <div class="panel-nav__body">
            {this.parsedGroups.map((group, gi) => (
              <div class={{ 'panel-nav__group': true, 'panel-nav__group--divider': gi > 0 }}>
                {group.label && !collapsed && (
                  <span class="panel-nav__group-label">{group.label}</span>
                )}
                {group.items.map(item => {
                  const isActive = item.id === this.activeId;
                  return (
                    <button
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
                      {!collapsed && (
                        <span class="panel-nav__item-label">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div class="panel-nav__footer">
            <button
              class="panel-nav__footer-settings"
              title="Settings"
              onClick={() => this.handleToggle()}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              <ds-icon name="ChevronLeft" size="sm" color="inherit" class="panel-nav__toggle-icon" />
            </button>

            <div class="panel-nav__footer-user">
              {collapsed ? (
                <span class="panel-nav__avatar" aria-hidden="true">
                  {userInitial}
                </span>
              ) : (
                <span class="panel-nav__user-row">
                  <span class="panel-nav__avatar panel-nav__avatar--sm" aria-hidden="true">
                    {userInitial}
                  </span>
                  <span class="panel-nav__user-name">{userName}</span>
                  <ds-icon name="ChevronUpDown" size="sm" color="inherit" />
                </span>
              )}
            </div>
          </div>

        </nav>
      </Host>
    );
  }
}

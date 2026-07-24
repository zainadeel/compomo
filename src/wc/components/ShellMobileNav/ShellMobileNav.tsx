import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Prop,
  Watch,
} from '@stencil/core';
import type { NavChromeStyle } from '../../shell/nav-chrome';
import { deriveActiveIdFromUrl } from '../PanelNav/panel-nav-utils';
import type { PanelNavGroup, PanelNavItem } from '../PanelNav/panel-nav-types';
import type {
  ShellMobileNavAuxiliaryDetail,
  ShellMobileNavAuxiliaryId,
} from './shell-mobile-nav-types';

const CONTEXT_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'settings', label: 'Settings' },
];

@Component({
  tag: 'ds-shell-mobile-nav',
  styleUrl: 'ShellMobileNav.css',
  scoped: true,
})
export class ShellMobileNav {
  @Element() el!: HTMLElement;

  @Prop({ reflect: true }) open: boolean = false;
  @Prop() browseContext: NavChromeStyle = 'dashboard';
  @Prop() dashboardGroups: PanelNavGroup[] = [];
  @Prop() settingsGroups: PanelNavGroup[] = [];
  @Prop() currentUrl: string = '';
  @Prop() heading: string = 'Navigation';
  @Prop() navigationLabel: string = 'Application navigation';
  @Prop() dashboardLabel: string = 'Dashboard';
  @Prop() settingsLabel: string = 'Settings';
  @Prop() accountLabel: string = 'Account';
  @Prop() helpLabel: string = 'Help & Support';

  @Event() dsAreaSelect!: EventEmitter<string>;
  @Event() dsBrowseContextChange!: EventEmitter<NavChromeStyle>;
  @Event() dsAuxiliarySelect!: EventEmitter<ShellMobileNavAuxiliaryDetail>;
  @Event() dsClose!: EventEmitter<void>;

  private get groups(): PanelNavGroup[] {
    return this.browseContext === 'settings' ? this.settingsGroups : this.dashboardGroups;
  }

  private get items(): PanelNavItem[] {
    return this.groups.flatMap(group => group.items);
  }

  private get activeId(): string {
    return deriveActiveIdFromUrl(this.currentUrl, [
      ...this.dashboardGroups.flatMap(group => group.items),
      ...this.settingsGroups.flatMap(group => group.items),
    ]);
  }

  @Watch('open')
  handleOpenChange(open: boolean) {
    if (!open) return;
    requestAnimationFrame(() => {
      const selected = this.el.querySelector<HTMLElement>('[aria-current="page"]');
      const first = this.el.querySelector<HTMLElement>('.shell-mobile-nav__area');
      (selected ?? first)?.focus({ preventScroll: true });
    });
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (!this.open || event.key !== 'Escape') return;
    event.preventDefault();
    this.dsClose.emit();
  }

  private handleContextChange = (event: CustomEvent<string>) => {
    const next = event.detail === 'settings' ? 'settings' : 'dashboard';
    if (next === this.browseContext) return;
    this.dsBrowseContextChange.emit(next);
  };

  private selectAuxiliary(id: ShellMobileNavAuxiliaryId, event: MouseEvent) {
    this.dsAuxiliarySelect.emit({
      id,
      anchor: event.currentTarget as HTMLElement,
    });
  }

  private renderGroup(group: PanelNavGroup, index: number) {
    return (
      <section class="shell-mobile-nav__group" aria-labelledby={group.label ? `mobile-nav-group-${group.id ?? index}` : undefined}>
        {group.label && (
          <ds-text
            id={`mobile-nav-group-${group.id ?? index}`}
            class="shell-mobile-nav__group-label"
            as="h2"
            variant="text-caption"
            color="secondary"
          >
            {group.label}
          </ds-text>
        )}
        <div class="shell-mobile-nav__items">
          {group.items.map(item => {
            const selected = item.id === this.activeId;
            return (
              <button
                type="button"
                class={{
                  'shell-mobile-nav__area': true,
                  'shell-mobile-nav__area--selected': selected,
                  'ds-control--md': true,
                  'ds-focus-ring-inset': true,
                  'ds-interaction-fill': true,
                  'ds-interaction-fill--selected': selected,
                }}
                aria-current={selected ? 'page' : undefined}
                onClick={() => this.dsAreaSelect.emit(item.id)}
              >
                <ds-icon name={item.icon} size="md" color="inherit" />
                <ds-text as="span" variant="text-body-medium" emphasis color="inherit">
                  {item.label}
                </ds-text>
                {item.dot && (
                  <ds-badge class="shell-mobile-nav__dot" variant="dot" hasRing={false} label="" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  render() {
    const contextTabs = [
      { ...CONTEXT_TABS[0], label: this.dashboardLabel },
      { ...CONTEXT_TABS[1], label: this.settingsLabel },
    ];

    return (
      <Host aria-hidden={this.open ? undefined : 'true'} inert={this.open ? undefined : true}>
        <section
          id="ds-shell-mobile-navigation"
          class="shell-mobile-nav"
          aria-label={this.navigationLabel}
        >
          <header class="shell-mobile-nav__header">
            <ds-text as="h1" variant="text-title-medium" emphasis>
              {this.heading}
            </ds-text>
            <ds-tab-group
              tabs={contextTabs}
              value={this.browseContext}
              aria-label="Navigation context"
              onDsChange={this.handleContextChange}
            />
          </header>

          <nav class="shell-mobile-nav__body" aria-label={this.navigationLabel}>
            {this.groups.map((group, index) => this.renderGroup(group, index))}
          </nav>

          <footer class="shell-mobile-nav__footer">
            <button
              type="button"
              class="shell-mobile-nav__auxiliary ds-control--md ds-focus-ring-inset ds-interaction-fill"
              onClick={event => this.selectAuxiliary('help', event)}
            >
              <ds-icon name="CircleQuestion" size="md" color="inherit" />
              <ds-text as="span" variant="text-body-medium" emphasis color="inherit">
                {this.helpLabel}
              </ds-text>
            </button>
            <button
              type="button"
              class="shell-mobile-nav__auxiliary ds-control--md ds-focus-ring-inset ds-interaction-fill"
              onClick={event => this.selectAuxiliary('account', event)}
            >
              <ds-icon name="Avatar" size="md" color="inherit" />
              <ds-text as="span" variant="text-body-medium" emphasis color="inherit">
                {this.accountLabel}
              </ds-text>
            </button>
          </footer>
        </section>
      </Host>
    );
  }
}

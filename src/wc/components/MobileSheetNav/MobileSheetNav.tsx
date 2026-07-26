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

type MobileSheetNavHeaderDestinationId = 'account' | 'help';

const CONTEXT_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard', variant: 'icon' as const },
  { id: 'settings', label: 'Settings', icon: 'Gear', variant: 'icon' as const },
];

@Component({
  tag: 'ds-mobile-sheet-nav',
  styleUrl: 'MobileSheetNav.css',
  scoped: true,
})
export class MobileSheetNav {
  @Element() el!: HTMLElement;

  @Prop({ reflect: true }) open: boolean = false;
  @Prop() browseContext: NavChromeStyle = 'dashboard';
  @Prop() dashboardGroups: PanelNavGroup[] = [];
  @Prop() settingsGroups: PanelNavGroup[] = [];
  @Prop() currentUrl: string = '';
  @Prop() navigationLabel: string = 'Application navigation';
  @Prop() dashboardLabel: string = 'Dashboard';
  @Prop() settingsLabel: string = 'Settings';
  @Prop() accountLabel: string = 'Account';
  @Prop() helpLabel: string = 'Help & Support';

  @Event() dsAreaSelect!: EventEmitter<string>;
  @Event() dsBrowseContextChange!: EventEmitter<NavChromeStyle>;
  @Event() dsClose!: EventEmitter<void>;

  private get groups(): PanelNavGroup[] {
    return this.browseContext === 'settings' ? this.settingsGroups : this.dashboardGroups;
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
      const first = this.el.querySelector<HTMLElement>('.mobile-sheet-nav__item');
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

  private renderItem(item: PanelNavItem) {
    const selected = item.id === this.activeId;
    return (
      <button
        type="button"
        class={{
          'mobile-sheet-nav__item': true,
          'mobile-sheet-nav__item--selected': selected,
          'ds-control--lg': true,
          'ds-focus-ring-inset': true,
          'ds-interaction-fill': true,
        }}
        aria-current={selected ? 'page' : undefined}
        onClick={() => this.dsAreaSelect.emit(item.id)}
      >
        <ds-icon
          class="ds-interaction-fill__content"
          name={item.icon}
          size="lg"
          color="inherit"
        />
        <ds-text
          class="mobile-sheet-nav__item-label ds-interaction-fill__content"
          as="span"
          variant="text-body-large"
          emphasis={selected}
          color="inherit"
        >
          {item.label}
        </ds-text>
        {item.dot && (
          <ds-badge
            class="mobile-sheet-nav__dot ds-interaction-fill__content"
            variant="dot"
            hasRing={false}
            label=""
            aria-hidden="true"
          />
        )}
      </button>
    );
  }

  private renderLogo() {
    return (
      <span class="mobile-sheet-nav__logo" aria-hidden="true">
        {/* eslint-disable-next-line local/prefer-ds-icon -- Motive brand mark is not part of the IcoMo runtime catalog. */}
        <svg
          class="mobile-sheet-nav__logo-mark"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          focusable="false"
          aria-hidden="true"
        >
          <path
            d="M11.1159 4.31537H7.67021L2.53401 13.0703H0V15.6875H4.02716L8.24319 8.49978V15.6846H11.6342L15.8289 8.47829V15.6846H18.7122V4.3125H15.2559L11.1159 11.3648V4.31537Z"
            fill="currentColor"
          />
        </svg>
      </span>
    );
  }

  private renderHeaderDestination(
    id: MobileSheetNavHeaderDestinationId,
    icon: string,
    label: string
  ) {
    return (
      <ds-tooltip label={label} side="bottom" size="sm">
        <ds-button-unfilled
          variant="icon"
          size="lg"
          icon={icon}
          aria-label={label}
          activeFill={false}
          hasBorder={false}
          onDsClick={() => this.dsAreaSelect.emit(id)}
        />
      </ds-tooltip>
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
          id="ds-mobile-sheet-nav"
          class="mobile-sheet-nav"
        >
          <header class="mobile-sheet-nav__header ds-chrome-grid ds-chrome-space--md">
            <div class="mobile-sheet-nav__brand">{this.renderLogo()}</div>
            <ds-tab-group
              class="mobile-sheet-nav__context"
              tabs={contextTabs}
              value={this.browseContext}
              aria-label="Browse context"
              onDsChange={this.handleContextChange}
            />
            <div class="mobile-sheet-nav__actions">
              {this.renderHeaderDestination('help', 'CircleQuestion', this.helpLabel)}
              {this.renderHeaderDestination('account', 'Avatar', this.accountLabel)}
            </div>
          </header>

          <nav
            class="mobile-sheet-nav__body ds-chrome-column ds-chrome-space--md"
            aria-label={this.navigationLabel}
          >
            <div class="mobile-sheet-nav__sections">
              {this.groups
                .filter(group => group.items.length > 0)
                .map(group => (
                  <div class="mobile-sheet-nav__items">
                    {group.items.map(item => this.renderItem(item))}
                  </div>
                ))}
            </div>
          </nav>
        </section>
      </Host>
    );
  }
}

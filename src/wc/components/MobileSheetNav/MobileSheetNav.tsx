import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import type { NavChromeStyle } from '../../shell/nav-chrome';
import { derivePanelNavSelectionFromUrl } from '../PanelNav/panel-nav-utils';
import type {
  PanelNavChildItem,
  PanelNavChildSelectDetail,
  PanelNavGroup,
  PanelNavItem,
  PanelNavPresentation,
} from '../PanelNav/panel-nav-types';

type MobileSheetNavHeaderDestinationId = 'account' | 'help';

const CONTEXT_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard', variant: 'icon' as const },
  { id: 'settings', label: 'Settings', icon: 'Gear', variant: 'icon' as const },
];
let nextSheetId = 0;

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
  /** Flat area navigation or inline disclosure of each area's child routes. */
  @Prop() presentation: PanelNavPresentation = 'flat';
  /** Whether the router-derived current area owns the active mobile stage. */
  @Prop() routeSelectionActive: boolean = true;
  @Prop() navigationLabel: string = 'Application navigation';
  @Prop() dashboardLabel: string = 'Dashboard';
  @Prop() settingsLabel: string = 'Settings';
  @Prop() accountLabel: string = 'Account';
  @Prop() helpLabel: string = 'Help & Support';
  /** Show the optional Account shortcut in the sheet header. */
  @Prop() showAccount: boolean = true;

  @Event() dsAreaSelect!: EventEmitter<string>;
  /** Selecting a child requests routing; expanding its parent never navigates. */
  @Event() dsNavChildSelect!: EventEmitter<PanelNavChildSelectDetail>;
  @Event() dsBrowseContextChange!: EventEmitter<NavChromeStyle>;
  @Event() dsClose!: EventEmitter<void>;
  @State() private expandedParentId = '';
  private readonly instanceId = nextSheetId++;

  private get groups(): PanelNavGroup[] {
    return this.browseContext === 'settings' ? this.settingsGroups : this.dashboardGroups;
  }

  private get selection() {
    return derivePanelNavSelectionFromUrl(
      this.routeSelectionActive ? this.currentUrl : '',
      this.groups.flatMap(group => group.items)
    );
  }

  componentWillLoad() {
    this.syncExpandedParent();
  }

  @Watch('presentation')
  @Watch('currentUrl')
  @Watch('browseContext')
  @Watch('routeSelectionActive')
  syncExpandedParent() {
    this.expandedParentId = this.presentation === 'nested' ? this.selection.parentId : '';
  }

  @Watch('open')
  handleOpenChange(open: boolean) {
    if (!open) return;
    this.syncExpandedParent();
    requestAnimationFrame(() => {
      const selected = this.el.querySelector<HTMLElement>('[aria-current="page"]');
      const first = this.el.querySelector<HTMLElement>('.mobile-sheet-nav__item:not(:disabled)');
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
    const selected = item.id === this.selection.parentId;
    const disclosure = this.presentation === 'nested' && !!item.children?.length;
    const expanded = disclosure && item.id === this.expandedParentId;
    return (
      <button
        id={this.parentId(item.id)}
        type="button"
        class={{
          'mobile-sheet-nav__item': true,
          'mobile-sheet-nav__item--selected': selected,
          'mobile-sheet-nav__parent--muted':
            this.presentation === 'nested' &&
            this.expandedParentId !== '' &&
            this.expandedParentId !== item.id,
          'ds-control--lg': true,
          'ds-focus-ring-inset': true,
          'ds-interaction-fill': true,
        }}
        aria-current={selected && !disclosure ? 'page' : undefined}
        aria-expanded={disclosure ? String(expanded) : undefined}
        aria-controls={disclosure ? this.childrenId(item.id) : undefined}
        onClick={() =>
          disclosure
            ? (this.expandedParentId = expanded ? '' : item.id)
            : this.dsAreaSelect.emit(item.id)
        }
      >
        <ds-icon class="ds-interaction-fill__content" name={item.icon} size="lg" color="inherit" />
        <ds-text
          class="mobile-sheet-nav__item-label ds-interaction-fill__content"
          as="span"
          variant="text-body-large"
          emphasis={selected}
          color="inherit"
          lineTruncation={1}
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

  private parentId(id: string) {
    return `mobile-sheet-${this.instanceId}-${encodeURIComponent(id)}`;
  }
  private childrenId(id: string) {
    return `${this.parentId(id)}-children`;
  }

  private renderChild(parent: PanelNavItem, child: PanelNavChildItem, index: number) {
    const selected = parent.id === this.selection.parentId && child.id === this.selection.childId;
    return (
      <button
        type="button"
        disabled={child.isInactive}
        class={{
          'mobile-sheet-nav__item': true,
          'mobile-sheet-nav__child': true,
          'mobile-sheet-nav__item--selected': selected,
          'ds-nav-disclosure__item': true,
          'ds-control--lg': true,
          'ds-focus-ring-inset': true,
          'ds-interaction-fill': true,
        }}
        style={{
          '--ds-nav-disclosure-index': String(index),
          '--ds-nav-disclosure-reverse-index': String((parent.children?.length ?? 0) - index - 1),
        }}
        aria-current={selected ? 'page' : undefined}
        onClick={() => {
          if (!child.isInactive)
            this.dsNavChildSelect.emit({
              parentId: parent.id,
              childId: child.id,
              href: child.href,
            });
        }}
        onKeyDown={(event: KeyboardEvent) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.expandedParentId = '';
            this.el.querySelector<HTMLElement>(`#${CSS.escape(this.parentId(parent.id))}`)?.focus();
          }
        }}
      >
        <ds-text
          class="mobile-sheet-nav__item-label ds-interaction-fill__content"
          as="span"
          variant="text-body-large"
          emphasis={selected}
          color="inherit"
          lineTruncation={1}
        >
          {child.label}
        </ds-text>
        {child.dot ? (
          <ds-badge
            class="mobile-sheet-nav__dot ds-interaction-fill__content"
            variant="dot"
            hasRing={false}
            label=""
            aria-hidden="true"
          />
        ) : null}
      </button>
    );
  }

  private renderBranchDivider(position: 'before' | 'after', expanded: boolean) {
    return (
      <div
        class={{
          'ds-nav-disclosure-divider': true,
          'ds-nav-disclosure-divider--open': expanded,
          'mobile-sheet-nav__divider': true,
          [`mobile-sheet-nav__divider--${position}`]: true,
        }}
        aria-hidden="true"
      >
        <div class="ds-nav-disclosure-divider__clip">
          <span class="mobile-sheet-nav__divider-line" />
        </div>
      </div>
    );
  }

  private renderBranch(item: PanelNavItem, index: number, count: number) {
    const hasChildren = this.presentation === 'nested' && !!item.children?.length;
    const expanded = hasChildren && this.expandedParentId === item.id;
    return (
      <div key={item.id} class="mobile-sheet-nav__branch">
        {hasChildren && index > 0 ? this.renderBranchDivider('before', expanded) : null}
        {this.renderItem(item)}
        {this.presentation === 'nested' && item.children?.length ? (
          <div
            class={{ 'ds-nav-disclosure': true, 'ds-nav-disclosure--open': expanded }}
            inert={!expanded ? true : undefined}
            aria-hidden={!expanded ? 'true' : undefined}
          >
            <div
              class="mobile-sheet-nav__children"
              id={this.childrenId(item.id)}
              role="group"
              aria-labelledby={this.parentId(item.id)}
            >
              {item.children.map((child, index) => this.renderChild(item, child, index))}
            </div>
          </div>
        ) : null}
        {hasChildren && index < count - 1 ? this.renderBranchDivider('after', expanded) : null}
      </div>
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
        <section id="ds-mobile-sheet-nav" class="mobile-sheet-nav">
          <header
            class={{
              'mobile-sheet-nav__header': true,
              'mobile-sheet-nav__header--expanded-context': !this.showAccount,
              'ds-chrome-grid': true,
              'ds-chrome-space--md': true,
            }}
          >
            <div class="mobile-sheet-nav__brand">{this.renderLogo()}</div>
            <ds-tab-group
              class="mobile-sheet-nav__context"
              tabs={contextTabs}
              value={this.browseContext}
              size="lg"
              width={this.showAccount ? 'hug' : 'fill'}
              aria-label="Browse context"
              onDsChange={this.handleContextChange}
            />
            <div class="mobile-sheet-nav__actions">
              {this.renderHeaderDestination('help', 'CircleQuestion', this.helpLabel)}
              {this.showAccount
                ? this.renderHeaderDestination('account', 'Avatar', this.accountLabel)
                : null}
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
                    {group.items.map((item, index) =>
                      this.renderBranch(item, index, group.items.length)
                    )}
                  </div>
                ))}
            </div>
          </nav>
        </section>
      </Host>
    );
  }
}

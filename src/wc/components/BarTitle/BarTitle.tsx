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
import type { BreadcrumbItem, BreadcrumbSelectDetail } from '../Breadcrumb/breadcrumb-types';
import type { MenuItemData, MenuSection } from '../Menu/menu-types';
import {
  isBarTitleDivider,
  type BarTitleActionConfigItem,
  type BarTitleActionItem,
  type BarTitleMenuAction,
  type BarTitlePrimaryAction,
  type BarTitleSection,
  type BarTitleSectionItem,
  type BarTitlePlacement,
  type BarTitleSplitAction,
  type BarTitleVariant,
} from './bar-title-types';
import {
  barTitleActionIdIssues,
  barTitleChoiceSections,
  findBarTitleAction,
  overflowBarTitleActionSections,
  resolveBarTitleActionItems,
  visibleBarTitleActions,
} from './bar-title-actions';

let nextBarTitleId = 0;

type FocusableButton = HTMLElement & {
  setFocus?: (segment?: 'primary' | 'menu') => Promise<void>;
};

@Component({
  tag: 'ds-bar-title',
  styleUrl: 'BarTitle.css',
  scoped: true,
})
export class BarTitle {
  @Element() el!: HTMLElement;

  /** The page's single visible h1. */
  @Prop() heading!: string;

  /** Optional supporting copy shown in the expanded presentation. */
  @Prop() description: string = '';

  /** Show the leading page-level Back action. */
  @Prop({ attribute: 'show-back' }) showBack: boolean = false;

  /** Accessible name for the leading Back action. */
  @Prop() backAriaLabel: string = 'Back';

  /** Visible parent-page label used by the expanded breadcrumb when breadcrumbs is empty. */
  @Prop() backLabel: string = 'Back';

  /** Optional expanded ancestor path. Compact variants continue to use the Back action. */
  @Prop() breadcrumbs: BreadcrumbItem[] = [];

  /** Accessible name for the expanded breadcrumb navigation landmark. */
  @Prop() breadcrumbAriaLabel: string = 'Breadcrumb';

  /** Optional page sections exposed through the active-section menu. */
  @Prop() sections: BarTitleSectionItem[] = [];

  /** Id of the active page section. */
  @Prop() value: string = '';

  /** Accessible name for the page-section menu. */
  @Prop() sectionsAriaLabel: string = 'Change page section';

  /** The one highest-emphasis page action. */
  @Prop() primaryAction: BarTitlePrimaryAction | null = null;

  /** Secondary page actions shown in the overflow menu. Dividers create groups. */
  @Prop() actions: BarTitleActionItem[] = [];

  /**
   * Ordered page-header actions. When supplied, this replaces the legacy
   * primaryAction/actions presentation while preserving the same dsAction event.
   */
  @Prop() actionItems?: BarTitleActionConfigItem[];

  /** Accessible name for the page-actions menu. */
  @Prop() actionsAriaLabel: string = 'More page actions';

  /** Explicit visual/capacity variant. ShellPage owns automatic selection. */
  @Prop() variant: BarTitleVariant = 'expanded';

  /** Page-header placement, or compact application-shell bar placement. */
  @Prop({ reflect: true }) placement: BarTitlePlacement = 'page';

  /** Draw the page-title divider beneath the header. */
  @Prop() showDivider: boolean = true;

  /** Override divider visibility for compact and constrained variants. */
  @Prop() showCompactDivider?: boolean;

  /** Emitted when the leading Back action is activated. */
  @Event() dsBack!: EventEmitter<MouseEvent>;

  /** Emitted when an authored expanded breadcrumb item is activated. */
  @Event({ cancelable: true }) dsBreadcrumbSelect!: EventEmitter<BreadcrumbSelectDetail>;

  /** Emitted with the newly selected page-section id. */
  @Event() dsSectionChange!: EventEmitter<string>;

  /** Emitted with the activated primary or overflow action id. */
  @Event() dsAction!: EventEmitter<string>;

  @State() private sectionMenuOpen = false;
  @State() private openActionMenuId = '';
  @State() private sectionMenuInitialFocusVisible = false;
  @State() private actionMenuInitialFocusVisible = false;

  private readonly instanceId = nextBarTitleId++;
  private readonly sectionMenuTriggerId = `bar-title-section-trigger-${this.instanceId}`;
  private readonly sectionMenuId = `bar-title-section-menu-${this.instanceId}`;
  private readonly actionMenuTriggerId = `bar-title-action-trigger-${this.instanceId}`;
  private readonly actionMenuId = `bar-title-action-menu-${this.instanceId}`;
  private sectionTriggerEl: HTMLButtonElement | null = null;
  private actionTriggerEl: FocusableButton | null = null;
  private actionTriggerEls = new Map<string, FocusableButton>();

  componentWillLoad() {
    if (this.el.closest('ds-shell-page')) {
      this.el.setAttribute('data-shell-page-syncing', '');
    }
    this.reportActionIdIssues();
  }

  @Watch('sections')
  handleSectionsChange() {
    if (!this.hasSectionSelector) this.closeSectionMenu();
  }

  @Watch('actions')
  @Watch('primaryAction')
  @Watch('actionItems')
  handleActionsChange() {
    this.reportActionIdIssues();
    if (!this.availableActionMenuIds.has(this.openActionMenuId)) this.closeActionMenu();
  }

  private reportActionIdIssues() {
    for (const issue of barTitleActionIdIssues(this.resolvedActionItems)) {
      console.warn(`[ds-bar-title] ${issue}`);
    }
  }

  private get compact(): boolean {
    return this.effectiveVariant !== 'expanded';
  }

  private get effectiveVariant(): BarTitleVariant {
    return this.placement === 'shell-bar' ? 'compact' : this.variant;
  }

  private get dividerVisible(): boolean {
    return this.compact ? (this.showCompactDivider ?? this.showDivider) : this.showDivider;
  }

  private get expandedBreadcrumbItems(): BreadcrumbItem[] {
    if (this.breadcrumbs.length > 0) return this.breadcrumbs;
    if (!this.showBack) return [];
    return [
      {
        id: 'back',
        label: this.backLabel,
        ariaLabel: this.backAriaLabel,
      },
    ];
  }

  /** Tooltip copy is fixed and generic; backAriaLabel/actionsAriaLabel stay page-specific. */
  private get backTooltipLabel(): string {
    return 'Go back';
  }

  private get primaryCollapsed(): boolean {
    return (
      this.actionItems === undefined &&
      this.effectiveVariant === 'constrained' &&
      this.primaryAction !== null &&
      (this.primaryAction.collapse ?? 'auto') === 'auto'
    );
  }

  private get selectableSections(): BarTitleSection[] {
    return this.sections.filter((item): item is BarTitleSection => !isBarTitleDivider(item));
  }

  private get hasSectionSelector(): boolean {
    return this.selectableSections.length > 1;
  }

  private get effectiveValue(): string {
    return this.selectableSections.some(section => section.id === this.value)
      ? this.value
      : (this.selectableSections[0]?.id ?? '');
  }

  private get selectedSectionLabel(): string {
    return this.selectableSections.find(section => section.id === this.effectiveValue)?.label ?? '';
  }

  private get sectionTriggerAriaLabel(): string {
    return `${this.sectionsAriaLabel}. Current section: ${this.selectedSectionLabel}`;
  }

  private groupsFromSections(): MenuSection[] {
    const groups: MenuSection[] = [];
    let items: MenuItemData[] = [];
    const commit = () => {
      if (items.length > 0) groups.push({ items });
      items = [];
    };

    for (const item of this.sections) {
      if (isBarTitleDivider(item)) {
        commit();
      } else {
        items.push({
          label: item.label,
          value: item.id,
          isSelected: item.id === this.effectiveValue,
          isInactive: item.isInactive,
        });
      }
    }
    commit();
    return groups;
  }

  private get sectionMenuSections(): MenuSection[] {
    return this.groupsFromSections();
  }

  private get resolvedActionItems(): BarTitleActionConfigItem[] {
    return resolveBarTitleActionItems(this.actionItems, this.primaryAction, this.actions);
  }

  private get visibleActions(): BarTitleActionConfigItem[] {
    return visibleBarTitleActions(this.resolvedActionItems, this.effectiveVariant);
  }

  private get actionMenuSections(): MenuSection[] {
    return overflowBarTitleActionSections(this.resolvedActionItems, this.effectiveVariant);
  }

  private get showActionMenuTrigger(): boolean {
    return this.actionMenuSections.length > 0;
  }

  private get availableActionMenuIds(): Set<string> {
    const ids = new Set<string>();
    if (this.showActionMenuTrigger) ids.add('__overflow');
    for (const item of this.visibleActions) {
      if (!isBarTitleDivider(item) && (item.type === 'menu' || item.type === 'split')) {
        ids.add(item.id);
      }
    }
    return ids;
  }

  private actionMenuDomId(id: string): string {
    const index = this.resolvedActionItems.findIndex(
      item => !isBarTitleDivider(item) && item.id === id
    );
    return `bar-title-action-menu-${this.instanceId}-${index}`;
  }

  private actionMenuAnchor(id: string): HTMLElement | undefined {
    if (id === '__overflow') return this.actionTriggerEl ?? undefined;
    const trigger = this.actionTriggerEls.get(id);
    if (!trigger) return undefined;
    const splitMenu = trigger.querySelector<HTMLElement>('.ds-button-split__menu');
    return splitMenu ?? trigger;
  }

  private menuSectionsForAction(action: BarTitleMenuAction | BarTitleSplitAction): MenuSection[] {
    return barTitleChoiceSections(action.choices);
  }

  private toggleSectionMenu = (event: MouseEvent) => {
    this.sectionMenuInitialFocusVisible = event.detail === 0;
    this.openActionMenuId = '';
    this.sectionMenuOpen = !this.sectionMenuOpen;
  };

  private closeSectionMenu = () => {
    this.sectionMenuOpen = false;
  };

  private handleSectionSelect = (event: CustomEvent<MenuItemData>) => {
    const id = String(event.detail?.value ?? '');
    const selected = this.selectableSections.find(section => section.id === id);
    if (!selected || selected.isInactive) return;
    this.closeSectionMenu();
    this.dsSectionChange.emit(id);
    requestAnimationFrame(() => this.sectionTriggerEl?.focus());
  };

  private toggleActionMenu = (id: string, event: MouseEvent) => {
    this.actionMenuInitialFocusVisible = event.detail === 0;
    this.sectionMenuOpen = false;
    this.openActionMenuId = this.openActionMenuId === id ? '' : id;
  };

  private closeActionMenu = () => {
    this.openActionMenuId = '';
  };

  private handleActionSelect = (event: CustomEvent<MenuItemData>) => {
    const id = String(event.detail?.value ?? '');
    const action = findBarTitleAction(this.resolvedActionItems, id);
    if (!action || action.isInactive || ('isLoading' in action && action.isLoading)) return;
    const menuId = this.openActionMenuId;
    this.closeActionMenu();
    this.dsAction.emit(id);
    requestAnimationFrame(() => {
      if (menuId === '__overflow') {
        void this.actionTriggerEl?.setFocus?.();
        return;
      }
      const trigger = this.actionTriggerEls.get(menuId);
      if ('setFocus' in (trigger ?? {})) {
        const split = this.resolvedActionItems.some(
          item => !isBarTitleDivider(item) && item.id === menuId && item.type === 'split'
        );
        void trigger?.setFocus?.(split ? 'menu' : undefined);
      }
    });
  };

  private renderSectionSelector() {
    if (!this.hasSectionSelector) return null;
    return [
      <div class="bar-title__divider" aria-hidden="true" />,
      <div class="bar-title__section-selector">
        <button
          ref={el => {
            this.sectionTriggerEl = el ?? null;
          }}
          id={this.sectionMenuTriggerId}
          class={{
            'bar-title__section-trigger': true,
            'bar-title__section-trigger--expanded': this.sectionMenuOpen,
            'ds-control--md': true,
            'ds-focus-ring-inset': true,
            'ds-interaction-fill': true,
          }}
          type="button"
          aria-haspopup="menu"
          aria-controls={this.sectionMenuId}
          aria-expanded={String(this.sectionMenuOpen)}
          aria-label={this.sectionTriggerAriaLabel}
          onClick={this.toggleSectionMenu}
        >
          <ds-text
            class="bar-title__section-label ds-interaction-fill__content"
            as="span"
            variant="text-body-medium"
            emphasis
            color="primary"
            lineTruncation={1}
          >
            {this.selectedSectionLabel}
          </ds-text>
          <ds-icon
            class="bar-title__section-chevron ds-interaction-fill__content"
            name="ChevronUpDown"
            size="md"
            color="inherit"
            aria-hidden="true"
          />
        </button>
      </div>,
    ];
  }

  private renderVisibleAction(action: BarTitleActionConfigItem) {
    if (isBarTitleDivider(action) || action.type === 'overflow') return null;
    const appearance = action.appearance ?? (action.type === 'split' ? 'filled' : 'unfilled');
    const variant: 'icon' | 'icon-label' | 'label' =
      action.type === 'icon' ? 'icon' : action.icon ? 'icon-label' : 'label';
    const menu = action.type === 'menu';
    const menuId = menu ? this.actionMenuDomId(action.id) : undefined;

    if (action.type === 'split') {
      const splitMenuId = this.actionMenuDomId(action.id);
      const splitProps = {
        key: action.id,
        ref: (el: FocusableButton | undefined) => {
          if (el) this.actionTriggerEls.set(action.id, el);
          else this.actionTriggerEls.delete(action.id);
        },
        class: 'bar-title__action bar-title__split-action',
        split: true,
        variant,
        label: action.label,
        icon: action.icon ?? '',
        menuAriaLabel: action.menuAriaLabel,
        controls: splitMenuId,
        expanded: this.openActionMenuId === action.id,
        size: 'md' as const,
        type: action.buttonType ?? 'button',
        isInactive: action.isInactive,
        isLoading: action.isLoading,
        onDsClick: () => this.dsAction.emit(action.id),
        onDsMenuClick: (event: CustomEvent<MouseEvent>) =>
          this.toggleActionMenu(action.id, event.detail),
      };
      return appearance === 'filled' ? (
        <ds-button-filled
          {...splitProps}
          intent={action.intent ?? 'brand'}
          contrast={action.contrast ?? 'bold'}
        />
      ) : (
        <ds-button-unfilled {...splitProps} />
      );
    }

    const buttonProps = {
      key: action.id,
      ref: (el: FocusableButton | undefined) => {
        if (el) this.actionTriggerEls.set(action.id, el);
        else this.actionTriggerEls.delete(action.id);
      },
      class: `bar-title__action bar-title__action--${action.type}${
        this.actionItems === undefined && action.id === this.primaryAction?.id
          ? ' bar-title__primary-action'
          : ''
      }`,
      variant,
      icon: action.icon ?? '',
      label: action.label,
      ariaLabel: action.ariaLabel ?? (action.type === 'icon' ? action.label : undefined),
      size: 'md' as const,
      type: action.buttonType ?? 'button',
      isInactive: action.isInactive,
      isLoading: action.isLoading,
      controls: menuId,
      expanded: menu ? this.openActionMenuId === action.id : undefined,
      hasMenu: menu,
      onDsClick: (event: CustomEvent<MouseEvent>) => {
        if (menu) this.toggleActionMenu(action.id, event.detail);
        else this.dsAction.emit(action.id);
      },
    };

    const button =
      appearance === 'filled' ? (
        <ds-button-filled
          {...buttonProps}
          intent={action.intent ?? 'brand'}
          contrast={action.contrast ?? 'bold'}
        />
      ) : (
        <ds-button-unfilled {...buttonProps} />
      );

    return action.type === 'icon' ? (
      <ds-tooltip key={action.id} label={action.label} side="bottom" size="sm">
        {button}
      </ds-tooltip>
    ) : (
      button
    );
  }

  private renderActions() {
    if (this.visibleActions.length === 0 && !this.showActionMenuTrigger) return null;

    return (
      <div class="bar-title__actions">
        {this.visibleActions.map(action => this.renderVisibleAction(action))}
        {this.showActionMenuTrigger ? (
          <ds-tooltip label="Page options" side="bottom" size="sm">
            <ds-button-unfilled
              ref={el => {
                this.actionTriggerEl = el ?? null;
              }}
              id={this.actionMenuTriggerId}
              class="bar-title__more-actions"
              variant="icon"
              icon="Ellipses"
              aria-label={this.actionsAriaLabel}
              size="md"
              activeFill={!this.compact}
              hasBorder={this.visibleActions.length > 0}
              haspopup="menu"
              controls={this.actionMenuId}
              expanded={this.openActionMenuId === '__overflow'}
              onDsClick={(event: CustomEvent<MouseEvent>) =>
                this.toggleActionMenu('__overflow', event.detail)
              }
            />
          </ds-tooltip>
        ) : null}
      </div>
    );
  }

  private renderActionMenus() {
    return this.visibleActions.flatMap(action => {
      if (isBarTitleDivider(action) || (action.type !== 'menu' && action.type !== 'split')) {
        return [];
      }
      const menuLabel = action.menuAriaLabel ?? action.ariaLabel ?? action.label;
      return [
        <ds-menu
          key={action.id}
          id={this.actionMenuDomId(action.id)}
          class="bar-title__action-menu"
          anchor={this.actionMenuAnchor(action.id)}
          align="end"
          menuLabel={menuLabel}
          open={this.openActionMenuId === action.id}
          initialFocusVisible={this.actionMenuInitialFocusVisible}
          sections={this.menuSectionsForAction(action)}
          onDsClose={this.closeActionMenu}
          onDsSelect={this.handleActionSelect}
        />,
      ];
    });
  }

  private handleBreadcrumbSelect = (event: CustomEvent<BreadcrumbSelectDetail>) => {
    if (this.breadcrumbs.length === 0) {
      this.dsBack.emit(event.detail.originalEvent);
      return;
    }
    const forwarded = this.dsBreadcrumbSelect.emit(event.detail);
    if (forwarded.defaultPrevented) event.preventDefault();
  };

  private renderBreadcrumb() {
    const items = this.expandedBreadcrumbItems;
    if (items.length === 0) return null;
    return (
      <ds-breadcrumb
        class="bar-title__breadcrumb"
        items={items}
        ariaLabel={this.breadcrumbAriaLabel}
        onDsSelect={this.handleBreadcrumbSelect}
      />
    );
  }

  private renderBack() {
    if (!this.showBack) return null;
    return (
      <ds-tooltip label={this.backTooltipLabel} side="bottom" size="sm">
        <ds-button-unfilled
          class="bar-title__back"
          variant="icon"
          icon="ChevronLeft"
          aria-label={this.backAriaLabel}
          size="md"
          activeFill={false}
          hasBorder={false}
          onDsClick={(event: CustomEvent<MouseEvent>) => this.dsBack.emit(event.detail)}
        />
      </ds-tooltip>
    );
  }

  render() {
    const compact = this.compact;
    return (
      <Host
        class={{
          'bar-title-host--compact': compact,
          'bar-title-host--expanded': this.effectiveVariant === 'expanded',
          'bar-title-host--constrained': this.effectiveVariant === 'constrained',
          'bar-title-host--has-description': !!this.description,
          'bar-title-host--has-back': this.showBack,
          'bar-title-host--has-breadcrumb': !compact && this.expandedBreadcrumbItems.length > 0,
          'bar-title-host--shell-bar': this.placement === 'shell-bar',
        }}
      >
        <div
          class={{
            'bar-title': true,
            'bar-title--divider-hidden': !this.dividerVisible,
            'ds-chrome-header': compact,
          }}
        >
          <div class="bar-title__inner">
            {!compact ? this.renderBreadcrumb() : null}
            <div class="bar-title__row">
              <div class="bar-title__leading">
                <div class="bar-title__title-row" data-shell-page-header-anchor>
                  <div class="bar-title__identity">
                    {compact ? this.renderBack() : null}
                    <ds-text
                      class="bar-title__heading ds-control--md"
                      variant={compact ? 'text-title-small' : 'text-title-medium'}
                      emphasis
                      color="primary"
                      as="h1"
                      lineTruncation={1}
                    >
                      {this.heading}
                    </ds-text>
                  </div>
                  {this.renderSectionSelector()}
                </div>
                {this.description && !compact ? (
                  <ds-text
                    class="bar-title__description"
                    variant="text-body-small"
                    color="secondary"
                    lineTruncation={2}
                    wrap="wrap"
                    as="p"
                  >
                    {this.description}
                  </ds-text>
                ) : null}
              </div>
              {this.renderActions()}
            </div>
          </div>
        </div>

        {this.hasSectionSelector ? (
          <ds-menu
            id={this.sectionMenuId}
            class="bar-title__section-menu"
            anchorId={this.sectionMenuTriggerId}
            menuLabel={this.sectionsAriaLabel}
            open={this.sectionMenuOpen}
            initialFocusVisible={this.sectionMenuInitialFocusVisible}
            sections={this.sectionMenuSections}
            onDsClose={this.closeSectionMenu}
            onDsSelect={this.handleSectionSelect}
          />
        ) : null}

        {this.renderActionMenus()}

        {this.showActionMenuTrigger ? (
          <ds-menu
            id={this.actionMenuId}
            class="bar-title__action-menu"
            anchorId={this.actionMenuTriggerId}
            align="end"
            menuLabel={this.actionsAriaLabel}
            open={this.openActionMenuId === '__overflow'}
            initialFocusVisible={this.actionMenuInitialFocusVisible}
            sections={this.actionMenuSections}
            onDsClose={this.closeActionMenu}
            onDsSelect={this.handleActionSelect}
          />
        ) : null}
      </Host>
    );
  }
}

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
  type BarTitleAction,
  type BarTitleActionItem,
  type BarTitlePrimaryAction,
  type BarTitleSection,
  type BarTitleSectionItem,
  type BarTitleVariant,
} from './bar-title-types';

let nextBarTitleId = 0;

type FocusableButton = HTMLElement & { setFocus?: () => Promise<void> };

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

  /** Accessible name for the page-actions menu. */
  @Prop() actionsAriaLabel: string = 'More page actions';

  /** Explicit visual/capacity variant. ShellPage owns automatic selection. */
  @Prop() variant: BarTitleVariant = 'expanded';

  /** Emitted when the leading Back action is activated. */
  @Event() dsBack!: EventEmitter<MouseEvent>;

  /** Emitted when an authored expanded breadcrumb item is activated. */
  @Event({ cancelable: true }) dsBreadcrumbSelect!: EventEmitter<BreadcrumbSelectDetail>;

  /** Emitted with the newly selected page-section id. */
  @Event() dsSectionChange!: EventEmitter<string>;

  /** Emitted with the activated primary or overflow action id. */
  @Event() dsAction!: EventEmitter<string>;

  @State() private sectionMenuOpen = false;
  @State() private actionMenuOpen = false;
  @State() private sectionMenuInitialFocusVisible = false;
  @State() private actionMenuInitialFocusVisible = false;

  private readonly instanceId = nextBarTitleId++;
  private readonly sectionMenuTriggerId = `bar-title-section-trigger-${this.instanceId}`;
  private readonly sectionMenuId = `bar-title-section-menu-${this.instanceId}`;
  private readonly actionMenuTriggerId = `bar-title-action-trigger-${this.instanceId}`;
  private readonly actionMenuId = `bar-title-action-menu-${this.instanceId}`;
  private sectionTriggerEl: HTMLButtonElement | null = null;
  private actionTriggerEl: FocusableButton | null = null;

  componentWillLoad() {
    if (this.el.closest('ds-shell-page')) {
      this.el.setAttribute('data-shell-page-syncing', '');
    }
  }

  @Watch('sections')
  handleSectionsChange() {
    if (!this.hasSectionSelector) this.closeSectionMenu();
  }

  @Watch('actions')
  @Watch('primaryAction')
  handleActionsChange() {
    if (!this.showActionMenuTrigger) this.closeActionMenu();
  }

  private get compact(): boolean {
    return this.variant !== 'expanded';
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
      this.variant === 'constrained' &&
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

  private groupsFromItems<T extends BarTitleSection | BarTitleAction>(
    source: Array<T | { type: 'divider' }>,
    map: (item: T) => MenuItemData
  ): MenuSection[] {
    const groups: MenuSection[] = [];
    let items: MenuItemData[] = [];
    const commit = () => {
      if (items.length > 0) groups.push({ items });
      items = [];
    };

    for (const item of source) {
      if (isBarTitleDivider(item)) {
        commit();
      } else {
        items.push(map(item));
      }
    }
    commit();
    return groups;
  }

  private get sectionMenuSections(): MenuSection[] {
    return this.groupsFromItems(this.sections, section => ({
      label: section.label,
      value: section.id,
      isSelected: section.id === this.effectiveValue,
      isInactive: section.isInactive,
    }));
  }

  private get selectableActions(): BarTitleAction[] {
    return this.actions.filter((item): item is BarTitleAction => !isBarTitleDivider(item));
  }

  private get showActionMenuTrigger(): boolean {
    return (
      this.selectableActions.length > 0 || (this.primaryCollapsed && this.primaryAction !== null)
    );
  }

  private actionMenuItem(action: BarTitleAction | BarTitlePrimaryAction): MenuItemData {
    const primary = action as BarTitlePrimaryAction;
    return {
      label: action.label,
      value: action.id,
      isInactive: action.isInactive || primary.isLoading,
      isDestructive: action.isDestructive || primary.intent === 'negative',
    };
  }

  private get actionMenuSections(): MenuSection[] {
    const groups = this.groupsFromItems(this.actions, action => this.actionMenuItem(action));
    if (!this.primaryCollapsed || !this.primaryAction) return groups;
    return [{ items: [this.actionMenuItem(this.primaryAction)] }, ...groups];
  }

  private toggleSectionMenu = (event: MouseEvent) => {
    this.sectionMenuInitialFocusVisible = event.detail === 0;
    this.actionMenuOpen = false;
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

  private toggleActionMenu = (event: MouseEvent) => {
    this.actionMenuInitialFocusVisible = event.detail === 0;
    this.sectionMenuOpen = false;
    this.actionMenuOpen = !this.actionMenuOpen;
  };

  private closeActionMenu = () => {
    this.actionMenuOpen = false;
  };

  private handleActionSelect = (event: CustomEvent<MenuItemData>) => {
    const id = String(event.detail?.value ?? '');
    const primaryMatches = this.primaryCollapsed && this.primaryAction?.id === id;
    const action = this.selectableActions.find(candidate => candidate.id === id);
    if (!primaryMatches && !action) return;
    if (
      (primaryMatches && (this.primaryAction?.isInactive || this.primaryAction?.isLoading)) ||
      action?.isInactive
    ) {
      return;
    }
    this.closeActionMenu();
    this.dsAction.emit(id);
    requestAnimationFrame(() => void this.actionTriggerEl?.setFocus?.());
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

  private renderActions() {
    const primary = this.primaryAction;
    if (!primary && !this.showActionMenuTrigger) return null;

    return (
      <div class="bar-title__actions">
        {primary && !this.primaryCollapsed ? (
          <ds-button-filled
            class="bar-title__primary-action"
            variant={primary.icon ? 'icon-label' : 'label'}
            icon={primary.icon ?? ''}
            label={primary.label}
            intent={primary.intent ?? 'brand'}
            contrast={primary.contrast ?? 'bold'}
            size="md"
            type={primary.type ?? 'button'}
            isInactive={primary.isInactive}
            isLoading={primary.isLoading}
            onDsClick={() => this.dsAction.emit(primary.id)}
          />
        ) : null}
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
              hasBorder={primary !== null && !this.primaryCollapsed}
              haspopup="menu"
              controls={this.actionMenuId}
              expanded={this.actionMenuOpen}
              onDsClick={(event: CustomEvent<MouseEvent>) => this.toggleActionMenu(event.detail)}
            />
          </ds-tooltip>
        ) : null}
      </div>
    );
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
          'bar-title-host--expanded': this.variant === 'expanded',
          'bar-title-host--constrained': this.variant === 'constrained',
          'bar-title-host--has-description': !!this.description,
          'bar-title-host--has-back': this.showBack,
          'bar-title-host--has-breadcrumb': !compact && this.expandedBreadcrumbItems.length > 0,
        }}
      >
        <div class="bar-title">
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

        {this.showActionMenuTrigger ? (
          <ds-menu
            id={this.actionMenuId}
            class="bar-title__action-menu"
            anchorId={this.actionMenuTriggerId}
            align="end"
            menuLabel={this.actionsAriaLabel}
            open={this.actionMenuOpen}
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

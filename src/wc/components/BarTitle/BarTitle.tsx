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
  type BarTitleActionConfigItem,
  type BarTitleActionItem,
  type BarTitlePrimaryAction,
  type BarTitleSectionItem,
  type BarTitlePlacement,
  type BarTitleVariant,
} from './bar-title-types';
import {
  availableBarTitleActionMenuIds,
  barTitleActionIdIssues,
  findBarTitleAction,
  overflowBarTitleActionSections,
  resolveBarTitleActionItems,
  visibleBarTitleActions,
} from './bar-title-actions';
import {
  type FocusableBarTitleButton,
  barTitleActionMenuDomId,
  renderBarTitleActionMenus,
  renderBarTitleActions,
  renderBarTitleBack,
  renderBarTitleOverflowMenu,
  renderBarTitleSectionTrigger,
  restoreBarTitleActionFocus,
} from './bar-title-action-chrome';
import {
  barTitleSectionMenuSections,
  barTitleSectionTriggerAriaLabel,
  effectiveBarTitleSectionValue,
  selectableBarTitleSections,
  selectedBarTitleSectionLabel,
} from './bar-title-sections';

let nextBarTitleId = 0;

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
  @State() private surfaceActionMenuId = '';
  @State() private sectionSurfaceOpen = false;
  @State() private sectionMenuInitialFocusVisible = false;
  @State() private actionMenuInitialFocusVisible = false;

  private readonly instanceId = nextBarTitleId++;
  private readonly sectionMenuTriggerId = `bar-title-section-trigger-${this.instanceId}`;
  private readonly sectionMenuId = `bar-title-section-menu-${this.instanceId}`;
  private readonly actionMenuTriggerId = `bar-title-action-trigger-${this.instanceId}`;
  private readonly actionMenuId = `bar-title-action-menu-${this.instanceId}`;
  private sectionTriggerEl: HTMLButtonElement | null = null;
  private actionTriggerEl: FocusableBarTitleButton | null = null;
  private actionTriggerEls = new Map<string, FocusableBarTitleButton>();

  componentWillLoad() {
    if (this.el.closest('ds-shell-page')) {
      this.el.setAttribute('data-shell-page-syncing', '');
    }
    this.reportActionIdIssues();
  }

  @Watch('sections')
  handleSectionsChange() {
    if (!this.hasSectionSelector) {
      this.closeSectionMenu();
      this.sectionSurfaceOpen = false;
    }
  }

  @Watch('actions')
  @Watch('primaryAction')
  @Watch('actionItems')
  handleActionsChange() {
    this.reportActionIdIssues();
    if (!this.availableActionMenuIds.has(this.openActionMenuId)) this.closeActionMenu();
    if (!this.availableActionMenuIds.has(this.surfaceActionMenuId)) this.surfaceActionMenuId = '';
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

  private get primaryCollapsed(): boolean {
    return (
      this.actionItems === undefined &&
      this.effectiveVariant === 'constrained' &&
      this.primaryAction !== null &&
      (this.primaryAction.collapse ?? 'auto') === 'auto'
    );
  }

  private get selectableSections() {
    return selectableBarTitleSections(this.sections);
  }

  private get hasSectionSelector(): boolean {
    return this.selectableSections.length > 1;
  }

  private get effectiveValue(): string {
    return effectiveBarTitleSectionValue(this.sections, this.value);
  }

  private get selectedSectionLabel(): string {
    return selectedBarTitleSectionLabel(this.sections, this.value);
  }

  private get sectionTriggerAriaLabel(): string {
    return barTitleSectionTriggerAriaLabel(this.sectionsAriaLabel, this.selectedSectionLabel);
  }

  private get sectionMenuSections() {
    return barTitleSectionMenuSections(this.sections, this.effectiveValue);
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
    return availableBarTitleActionMenuIds(this.visibleActions, this.showActionMenuTrigger);
  }

  private toggleSectionMenu = (event: MouseEvent) => {
    this.sectionMenuInitialFocusVisible = event.detail === 0;
    this.openActionMenuId = '';
    this.sectionMenuOpen = !this.sectionMenuOpen;
    if (this.sectionMenuOpen) this.sectionSurfaceOpen = true;
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
    if (this.openActionMenuId) this.surfaceActionMenuId = this.openActionMenuId;
  };

  private finishActionMenuClose = (event: CustomEvent<void>) => {
    const id = this.surfaceActionMenuId;
    const domId =
      id === '__overflow'
        ? this.actionMenuId
        : barTitleActionMenuDomId('bar-title', this.instanceId, this.resolvedActionItems, id);
    if (this.openActionMenuId !== id && (event.target as HTMLElement).id === domId) {
      this.surfaceActionMenuId = '';
    }
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
      void restoreBarTitleActionFocus({
        menuId,
        overflowTrigger: this.actionTriggerEl,
        actionTriggers: this.actionTriggerEls,
        resolvedActionItems: this.resolvedActionItems,
      });
    });
  };

  private chromeActionOptions() {
    return {
      classPrefix: 'bar-title',
      compact: this.compact,
      visibleActions: this.visibleActions,
      showOverflowTrigger: this.showActionMenuTrigger,
      actionItems: this.actionItems,
      primaryAction: this.primaryAction,
      resolvedActionItems: this.resolvedActionItems,
      instanceId: this.instanceId,
      openActionMenuId: this.openActionMenuId,
      surfaceActionMenuId: this.surfaceActionMenuId,
      actionsAriaLabel: this.actionsAriaLabel,
      actionMenuTriggerId: this.actionMenuTriggerId,
      actionMenuId: this.actionMenuId,
      actionTriggers: this.actionTriggerEls,
      setOverflowTriggerEl: (el: FocusableBarTitleButton | null) => {
        this.actionTriggerEl = el;
      },
      toggleActionMenu: this.toggleActionMenu,
      emitAction: (id: string) => this.dsAction.emit(id),
    };
  }

  private renderSectionSelector() {
    if (!this.hasSectionSelector) return null;
    return [
      <div class="bar-title__divider" aria-hidden="true" />,
      renderBarTitleSectionTrigger({
        classPrefix: 'bar-title',
        triggerId: this.sectionMenuTriggerId,
        menuId: this.sectionMenuId,
        open: this.sectionMenuOpen,
        surfaceOpen: this.sectionSurfaceOpen,
        ariaLabel: this.sectionTriggerAriaLabel,
        selectedLabel: this.selectedSectionLabel,
        setTriggerEl: el => {
          this.sectionTriggerEl = el;
        },
        onToggle: this.toggleSectionMenu,
      }),
    ];
  }

  private renderActions() {
    return renderBarTitleActions(this.chromeActionOptions());
  }

  private renderActionMenus() {
    return renderBarTitleActionMenus({
      classPrefix: 'bar-title',
      visibleActions: this.visibleActions,
      instanceId: this.instanceId,
      resolvedActionItems: this.resolvedActionItems,
      openActionMenuId: this.openActionMenuId,
      actionMenuInitialFocusVisible: this.actionMenuInitialFocusVisible,
      overflowTrigger: this.actionTriggerEl,
      actionTriggers: this.actionTriggerEls,
      closeActionMenu: this.closeActionMenu,
      finishActionMenuClose: this.finishActionMenuClose,
      handleActionSelect: this.handleActionSelect,
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
    return renderBarTitleBack({
      classPrefix: 'bar-title',
      showBack: this.showBack,
      backAriaLabel: this.backAriaLabel,
      onBack: event => this.dsBack.emit(event),
    });
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
            onDsAfterClose={() => {
              if (!this.sectionMenuOpen) this.sectionSurfaceOpen = false;
            }}
            onDsSelect={this.handleSectionSelect}
          />
        ) : null}

        {this.renderActionMenus()}

        {renderBarTitleOverflowMenu({
          classPrefix: 'bar-title',
          showOverflowTrigger: this.showActionMenuTrigger,
          actionMenuId: this.actionMenuId,
          actionMenuTriggerId: this.actionMenuTriggerId,
          actionsAriaLabel: this.actionsAriaLabel,
          open: this.openActionMenuId === '__overflow',
          actionMenuInitialFocusVisible: this.actionMenuInitialFocusVisible,
          actionMenuSections: this.actionMenuSections,
          closeActionMenu: this.closeActionMenu,
          finishActionMenuClose: this.finishActionMenuClose,
          handleActionSelect: this.handleActionSelect,
        })}
      </Host>
    );
  }
}

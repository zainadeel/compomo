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
import {
  CHROME_TRANSITION_END,
  CHROME_TRANSITION_START,
  ChromeTransitionGate,
  createRafCoalescer,
  readChromeTransitionPhase,
  readChromeTransitionSource,
} from '../../shell/chrome-transition';
import type { MenuItemData } from '../Menu/menu-types';
import { tabsOverflowContainer } from '../BarNav/bar-nav-tabs-menu-utils';
import { getSelectableTabs, isTabDivider, type TabItemTab } from '../TabGroup/tab-item-utils';
import {
  availableBarTitleActionMenuIds,
  barTitleActionIdIssues,
  findBarTitleAction,
  overflowBarTitleActionSections,
  resolveBarTitleActionItems,
  visibleBarTitleActions,
} from '../BarTitle/bar-title-actions';
import {
  type FocusableBarTitleButton,
  barTitleActionMenuDomId,
  renderBarTitleActionMenus,
  renderBarTitleActions,
  renderBarTitleBack,
  renderBarTitleOverflowMenu,
  renderBarTitleSectionTrigger,
  restoreBarTitleActionFocus,
} from '../BarTitle/bar-title-action-chrome';
import {
  barTitleSectionMenuSections,
  barTitleSectionTriggerAriaLabel,
  barTitleSectionsDigest,
  barTitleSectionsToTabs,
  effectiveBarTitleSectionValue,
  selectableBarTitleSections,
  selectedBarTitleSectionLabel,
} from '../BarTitle/bar-title-sections';
import type {
  BarTitleActionConfigItem,
  BarTitleActionItem,
  BarTitlePrimaryAction,
  BarTitleSectionItem,
} from '../BarTitle/bar-title-types';

let nextBarPageTitleId = 0;

@Component({
  tag: 'ds-bar-page-title',
  styleUrl: 'BarPageTitle.css',
  scoped: true,
})
export class BarPageTitle {
  private static readonly INTRINSIC_WIDTH_RETRY_MAX = 3;
  private static readonly TAB_LAYOUT_COMMIT_MAX_FRAMES = 16;
  private static readonly OVERFLOW_HYSTERESIS_PX = 8;

  @Element() el!: HTMLElement;

  /** The page's single visible h1. */
  @Prop() heading!: string;

  /** Show the leading page-level Back action. */
  @Prop({ attribute: 'show-back' }) showBack: boolean = false;

  /** Accessible name for the leading Back action. */
  @Prop() backAriaLabel: string = 'Back';

  /** Optional page sections shown as an all-or-nothing tab row, or the compact section button. */
  @Prop() sections: BarTitleSectionItem[] = [];

  /** Id of the active page section. */
  @Prop() value: string = '';

  /** Accessible name for the page-section tablist and menu. */
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

  /** Draw the compact bottom divider beneath the header. */
  @Prop() showDivider: boolean = true;

  /** Override divider visibility for the compact shell-bar presentation. */
  @Prop() showCompactDivider?: boolean;

  /** Emitted when the leading Back action is activated. */
  @Event() dsBack!: EventEmitter<MouseEvent>;

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
  @State() private sectionsCollapsed = false;
  @State() private layoutCommitted = false;
  @State() private focusedTabId = '';

  private readonly instanceId = nextBarPageTitleId++;
  private readonly sectionMenuTriggerId = `bar-page-title-section-trigger-${this.instanceId}`;
  private readonly sectionMenuId = `bar-page-title-section-menu-${this.instanceId}`;
  private readonly actionMenuTriggerId = `bar-page-title-action-trigger-${this.instanceId}`;
  private readonly actionMenuId = `bar-page-title-action-menu-${this.instanceId}`;
  private sectionTriggerEl: HTMLButtonElement | null = null;
  private actionTriggerEl: FocusableBarTitleButton | null = null;
  private actionTriggerEls = new Map<string, FocusableBarTitleButton>();
  private chromeEl: HTMLElement | null = null;
  private rowEl: HTMLElement | null = null;
  private probeRowEl: HTMLElement | null = null;
  private visibleTabListEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intrinsicWidthRetryCount = 0;
  private tabLayoutPendingFrames = 0;
  private readonly panelNavTransition = new ChromeTransitionGate();
  private readonly panelToolsTransition = new ChromeTransitionGate();
  private readonly overflowCoalescer = createRafCoalescer(() => {
    this.updateSectionsCollapsed();
  });
  private chromeTransitionShell: HTMLElement | null = null;

  componentWillLoad() {
    this.reportActionIdIssues();
    this.syncFocusedTabId(this.effectiveValue, this.selectableTabs);
  }

  componentDidLoad() {
    this.setupOverflowObserver();
    this.bindChromeTransitionListeners();
    this.scheduleOverflowCheck();
  }

  componentDidRender() {
    if (this.chromeOverflowPaused()) return;
    this.scheduleOverflowCheck();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.overflowCoalescer.cancel();
    this.unbindChromeTransitionListeners();
  }

  @Watch('sections')
  handleSectionsChange(next: BarTitleSectionItem[], prev: BarTitleSectionItem[]) {
    if (!this.hasSectionSelector) {
      this.closeSectionMenu();
      this.sectionSurfaceOpen = false;
      this.sectionsCollapsed = false;
      this.layoutCommitted = true;
      this.intrinsicWidthRetryCount = 0;
      this.tabLayoutPendingFrames = 0;
      return;
    }
    if (barTitleSectionsDigest(next) === barTitleSectionsDigest(prev)) {
      this.syncFocusedTabId(this.effectiveValue, this.selectableTabs);
      return;
    }
    this.resetSectionLayout();
    this.syncFocusedTabId(this.effectiveValue, this.selectableTabs);
    this.scheduleOverflowCheck();
  }

  @Watch('value')
  handleValueChange() {
    this.syncFocusedTabId(this.effectiveValue, this.selectableTabs);
    this.scheduleOverflowCheck();
  }

  @Watch('heading')
  @Watch('showBack')
  @Watch('primaryAction')
  @Watch('actions')
  @Watch('actionItems')
  handleLayoutInputsChange() {
    this.reportActionIdIssues();
    if (!this.availableActionMenuIds.has(this.openActionMenuId)) this.closeActionMenu();
    if (!this.availableActionMenuIds.has(this.surfaceActionMenuId)) this.surfaceActionMenuId = '';
    this.scheduleOverflowCheck();
  }

  private reportActionIdIssues() {
    for (const issue of barTitleActionIdIssues(this.resolvedActionItems)) {
      console.warn(`[ds-bar-page-title] ${issue}`);
    }
  }

  private get dividerVisible(): boolean {
    return this.showCompactDivider ?? this.showDivider;
  }

  private get selectableSections() {
    return selectableBarTitleSections(this.sections);
  }

  private get hasSectionSelector(): boolean {
    return this.selectableSections.length > 1;
  }

  private get sectionTabs() {
    return barTitleSectionsToTabs(this.sections);
  }

  private get selectableTabs(): TabItemTab[] {
    return getSelectableTabs(this.sectionTabs);
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
    return visibleBarTitleActions(this.resolvedActionItems, 'compact');
  }

  private get actionMenuSections() {
    return overflowBarTitleActionSections(this.resolvedActionItems, 'compact');
  }

  private get showActionMenuTrigger(): boolean {
    return this.actionMenuSections.length > 0;
  }

  private get availableActionMenuIds(): Set<string> {
    return availableBarTitleActionMenuIds(this.visibleActions, this.showActionMenuTrigger);
  }

  private get showSectionTabs(): boolean {
    return this.hasSectionSelector && this.layoutCommitted && !this.sectionsCollapsed;
  }

  private get showSectionButton(): boolean {
    return this.hasSectionSelector && this.layoutCommitted && this.sectionsCollapsed;
  }

  private resetSectionLayout() {
    this.layoutCommitted = false;
    this.sectionsCollapsed = false;
    this.sectionMenuOpen = false;
    this.sectionMenuInitialFocusVisible = false;
    this.intrinsicWidthRetryCount = 0;
    this.tabLayoutPendingFrames = 0;
  }

  private bindChromeTransitionListeners() {
    const shell = this.el.closest<HTMLElement>('ds-shell-app');
    if (!shell) return;
    this.chromeTransitionShell = shell;
    shell.addEventListener(CHROME_TRANSITION_START, this.onChromeTransitionStart);
    shell.addEventListener(CHROME_TRANSITION_END, this.onChromeTransitionEnd);
  }

  private unbindChromeTransitionListeners() {
    if (!this.chromeTransitionShell) return;
    this.chromeTransitionShell.removeEventListener(
      CHROME_TRANSITION_START,
      this.onChromeTransitionStart
    );
    this.chromeTransitionShell.removeEventListener(
      CHROME_TRANSITION_END,
      this.onChromeTransitionEnd
    );
    this.chromeTransitionShell = null;
  }

  private onChromeTransitionStart = (event: Event) => {
    const source = readChromeTransitionSource(event);
    if (source === 'panel-nav') {
      this.panelNavTransition.enter();
      return;
    }
    if (source === 'panel-tools') {
      const phase = readChromeTransitionPhase(event) ?? 'opening';
      if (phase === 'closing') {
        this.panelToolsTransition.enter();
      }
    }
  };

  private chromeOverflowPaused(): boolean {
    return this.panelNavTransition.isActive || this.panelToolsTransition.isActive;
  }

  private onChromeTransitionEnd = (event: Event) => {
    const source = readChromeTransitionSource(event);
    if (source === 'panel-nav') {
      this.panelNavTransition.exit();
      if (!this.panelNavTransition.isActive) {
        this.scheduleOverflowCheck();
      }
      return;
    }
    if (source === 'panel-tools') {
      this.panelToolsTransition.exit();
      this.scheduleOverflowCheck();
    }
  };

  private setupOverflowObserver() {
    if (typeof ResizeObserver === 'undefined' || !this.chromeEl) return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      if (this.chromeOverflowPaused()) return;
      this.scheduleOverflowCheck();
    });
    this.resizeObserver.observe(this.chromeEl);
  }

  private scheduleOverflowCheck() {
    if (this.chromeOverflowPaused()) return;
    this.overflowCoalescer.schedule();
  }

  private scheduleIntrinsicWidthRetry() {
    if (this.intrinsicWidthRetryCount >= BarPageTitle.INTRINSIC_WIDTH_RETRY_MAX) return;
    this.intrinsicWidthRetryCount++;
    requestAnimationFrame(() => this.scheduleOverflowCheck());
  }

  private forceTabLayoutCommit(collapsed: boolean) {
    this.intrinsicWidthRetryCount = 0;
    this.tabLayoutPendingFrames = 0;
    const collapsedChanged = this.sectionsCollapsed !== collapsed;
    if (collapsedChanged) this.sectionsCollapsed = collapsed;
    if (!collapsed && collapsedChanged) {
      this.closeSectionMenu();
      this.sectionSurfaceOpen = false;
    }
    this.layoutCommitted = true;
  }

  private getAvailableWidth(): number {
    if (!this.rowEl) return 0;
    const rowWidth = this.rowEl.clientWidth;
    const actions = this.rowEl.querySelector<HTMLElement>('.bar-page-title__actions');
    const actionsWidth = actions?.getBoundingClientRect().width ?? 0;
    const style = getComputedStyle(this.rowEl);
    const gap = parseFloat(style.columnGap || style.gap) || 0;
    return Math.max(0, rowWidth - actionsWidth - (actionsWidth > 0 ? gap : 0));
  }

  private updateSectionsCollapsed() {
    if (!this.hasSectionSelector) {
      if (this.sectionsCollapsed) this.sectionsCollapsed = false;
      this.intrinsicWidthRetryCount = 0;
      this.tabLayoutPendingFrames = 0;
      this.layoutCommitted = true;
      return;
    }

    const probeWidth = this.probeRowEl?.scrollWidth ?? 0;
    const available = this.getAvailableWidth();
    if (!this.probeRowEl || !this.rowEl || probeWidth === 0) {
      if (this.layoutCommitted) {
        this.scheduleIntrinsicWidthRetry();
        return;
      }
      this.tabLayoutPendingFrames += 1;
      if (
        this.intrinsicWidthRetryCount >= BarPageTitle.INTRINSIC_WIDTH_RETRY_MAX ||
        this.tabLayoutPendingFrames >= BarPageTitle.TAB_LAYOUT_COMMIT_MAX_FRAMES
      ) {
        this.forceTabLayoutCommit(false);
      } else {
        this.scheduleIntrinsicWidthRetry();
      }
      return;
    }

    this.intrinsicWidthRetryCount = 0;
    this.tabLayoutPendingFrames = 0;
    const shouldCollapse = tabsOverflowContainer(
      probeWidth,
      available,
      this.sectionsCollapsed,
      BarPageTitle.OVERFLOW_HYSTERESIS_PX
    );
    this.forceTabLayoutCommit(shouldCollapse);
  }

  private syncFocusedTabId(preferred: string, tabs: TabItemTab[]) {
    if (tabs.some(tab => tab.id === preferred && !tab.isInactive)) {
      this.focusedTabId = preferred;
      return;
    }
    const first = tabs.find(tab => !tab.isInactive);
    this.focusedTabId = first?.id ?? '';
  }

  private selectSection(id: string) {
    const selected = this.selectableSections.find(section => section.id === id);
    if (!selected || selected.isInactive) return;
    this.dsSectionChange.emit(id);
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
    this.closeSectionMenu();
    this.selectSection(id);
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
        : barTitleActionMenuDomId(this.instanceId, this.resolvedActionItems, id);
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

  private focusVisibleTab(id: string) {
    this.focusedTabId = id;
    const tab = this.visibleTabListEl?.querySelector(`[data-tab-id="${id}"]`) as HTMLElement | null;
    tab?.focus({ preventScroll: true });
  }

  private findEnabledTab(from: number, step: 1 | -1): number | null {
    const tabs = this.selectableTabs;
    for (let index = from + step; index >= 0 && index < tabs.length; index += step) {
      if (!tabs[index]?.isInactive) return index;
    }
    return null;
  }

  private handleTabKeyDown(event: KeyboardEvent) {
    const tabs = this.selectableTabs;
    if (!tabs.length) return;
    const targetId = (event.target as HTMLElement | null)?.getAttribute('data-tab-id');
    const focusedId = targetId ?? this.focusedTabId;

    if (event.key === 'Enter' || event.key === ' ') {
      const focused = tabs.find(tab => tab.id === focusedId);
      if (!focused || focused.isInactive) return;
      event.preventDefault();
      this.selectSection(focused.id);
      return;
    }

    const currentIndex = tabs.findIndex(tab => tab.id === focusedId);
    if (currentIndex < 0) return;

    let nextIndex: number | null;
    if (event.key === 'ArrowRight') {
      nextIndex = this.findEnabledTab(currentIndex, 1);
    } else if (event.key === 'ArrowLeft') {
      nextIndex = this.findEnabledTab(currentIndex, -1);
    } else if (event.key === 'Home') {
      nextIndex = tabs.findIndex(tab => !tab.isInactive);
    } else if (event.key === 'End') {
      const reversedIndex = [...tabs].reverse().findIndex(tab => !tab.isInactive);
      nextIndex = reversedIndex < 0 ? null : tabs.length - 1 - reversedIndex;
    } else {
      return;
    }

    if (nextIndex === null || nextIndex < 0 || nextIndex === currentIndex) return;
    event.preventDefault();
    this.focusVisibleTab(tabs[nextIndex].id);
  }

  private chromeActionOptions() {
    return {
      classPrefix: 'bar-page-title',
      compact: true,
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

  private renderHeading(probe: boolean) {
    return (
      <ds-text
        class="bar-page-title__heading ds-control--md"
        variant="text-title-small"
        emphasis
        color="primary"
        as={probe ? 'span' : 'h1'}
        wrap={probe ? 'nowrap' : undefined}
        lineTruncation={probe ? 'none' : 1}
      >
        {this.heading}
      </ds-text>
    );
  }

  private renderTabList(probe: boolean) {
    return (
      <div
        role={probe ? undefined : 'tablist'}
        class="bar-page-title__tab-list"
        aria-label={probe ? undefined : this.sectionsAriaLabel}
        ref={el => {
          if (!probe) this.visibleTabListEl = (el as HTMLElement) ?? null;
        }}
        onKeyDown={probe ? undefined : (event: KeyboardEvent) => this.handleTabKeyDown(event)}
      >
        {this.sectionTabs.map((tab, index) => {
          if (isTabDivider(tab)) {
            return (
              <div class="bar-page-title__tab-divider" key={`divider-${index}`} aria-hidden="true">
                <div class="bar-page-title__tab-divider-line" />
              </div>
            );
          }

          const isSelected = tab.id === this.effectiveValue;
          return (
            <button
              key={tab.id}
              type="button"
              role={probe ? undefined : 'tab'}
              data-tab-id={tab.id}
              class={{
                'bar-page-title__tab': true,
                'bar-page-title__tab--selected': isSelected,
                'ds-control--md': true,
                'ds-focus-ring-inset': true,
                'ds-control-inactive': !!tab.isInactive,
              }}
              aria-selected={isSelected ? 'true' : 'false'}
              aria-disabled={tab.isInactive ? 'true' : undefined}
              disabled={tab.isInactive}
              tabIndex={!probe && tab.id === this.focusedTabId ? 0 : -1}
              onClick={() => !probe && this.selectSection(tab.id)}
              onFocus={() => {
                if (!probe) this.focusedTabId = tab.id;
              }}
            >
              <ds-text
                class="bar-page-title__tab-label ds-control-label-box"
                as="span"
                variant="text-body-medium"
                emphasis={isSelected}
                color="inherit"
              >
                {tab.label}
              </ds-text>
            </button>
          );
        })}
      </div>
    );
  }

  private renderIdentity(probe: boolean) {
    return (
      <div class="bar-page-title__identity">
        {renderBarTitleBack({
          classPrefix: 'bar-page-title',
          showBack: this.showBack,
          backAriaLabel: this.backAriaLabel,
          onBack: event => this.dsBack.emit(event),
        })}
        {this.renderHeading(probe)}
      </div>
    );
  }

  private renderSectionRegion() {
    if (!this.hasSectionSelector) return null;
    if (!this.layoutCommitted) {
      return [
        <div class="bar-page-title__divider" aria-hidden="true" />,
        <div class="bar-page-title__tabs-pending" aria-hidden="true" />,
      ];
    }
    if (this.showSectionTabs) {
      return [
        <div class="bar-page-title__divider" aria-hidden="true" />,
        this.renderTabList(false),
      ];
    }
    return [
      <div class="bar-page-title__divider" aria-hidden="true" />,
      renderBarTitleSectionTrigger({
        classPrefix: 'bar-page-title',
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

  render() {
    return (
      <Host>
        <div
          class={{
            'bar-page-title': true,
            'bar-page-title--divider-hidden': !this.dividerVisible,
            'ds-chrome-header': true,
          }}
          ref={el => {
            this.chromeEl = (el as HTMLElement) ?? null;
            if (el && !this.resizeObserver) this.setupOverflowObserver();
          }}
        >
          {this.hasSectionSelector ? (
            <div class="bar-page-title__probe" aria-hidden="true" inert>
              <div
                class="bar-page-title__probe-row"
                ref={el => {
                  const next = (el as HTMLElement) ?? null;
                  if (next === this.probeRowEl) return;
                  this.probeRowEl = next;
                  if (next) {
                    this.intrinsicWidthRetryCount = 0;
                    this.tabLayoutPendingFrames = 0;
                    this.scheduleOverflowCheck();
                  }
                }}
              >
                {this.renderIdentity(true)}
                <div class="bar-page-title__divider" />
                {this.renderTabList(true)}
              </div>
            </div>
          ) : null}

          <div class="bar-page-title__inner">
            <div
              class="bar-page-title__row"
              ref={el => {
                this.rowEl = (el as HTMLElement) ?? null;
              }}
            >
              <div class="bar-page-title__title-row">
                {this.renderIdentity(false)}
                {this.renderSectionRegion()}
              </div>
              {renderBarTitleActions(this.chromeActionOptions())}
            </div>
          </div>
        </div>

        {this.showSectionButton ? (
          <ds-menu
            id={this.sectionMenuId}
            class="bar-page-title__section-menu"
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

        {renderBarTitleActionMenus({
          classPrefix: 'bar-page-title',
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
        })}

        {renderBarTitleOverflowMenu({
          classPrefix: 'bar-page-title',
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

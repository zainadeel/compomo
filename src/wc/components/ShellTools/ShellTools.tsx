import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  Watch,
} from '@stencil/core';
import {
  PANEL_TOOLS_LABELS,
  type PanelToolsHeaderConfig,
  type PanelToolsHeaders,
  type PanelToolsItem,
  type PanelToolsToolId,
} from '../PanelTools/panel-tools-types';
import {
  orderPanelToolsItems,
  reconcilePanelToolsAvailability,
  resolvePanelToolActivation,
} from '../PanelTools/panel-tools-utils';
import {
  itemUsesShellInbox,
  isShellInboxTool,
  resolveAvailableInboxTool,
  type ShellInboxToolId,
  type ShellResponsiveMode,
} from '../../shell/shell-responsive';

@Component({
  tag: 'ds-shell-tools',
  styleUrl: 'ShellTools.css',
  shadow: true,
})
export class ShellTools {
  @Element() el!: HTMLElement;

  /** Resolved by ShellApp; mobile uses a full-stage tool presentation. */
  @Prop({ attribute: 'responsive-mode', reflect: true })
  responsiveMode: ShellResponsiveMode = 'desktop';
  @Prop({ mutable: true, reflect: true }) open: boolean = false;
  @Prop({ mutable: true, attribute: 'active-tool', reflect: true })
  activeTool: PanelToolsToolId | '' = '';
  @Prop({ mutable: true, reflect: true }) presentation: 'drawer' | 'fullscreen' = 'drawer';
  @Prop({ attribute: 'fullscreen-header-mode', reflect: true })
  fullscreenHeaderMode: 'shared' | 'split' = 'shared';
  @Prop() items: PanelToolsItem[] = [];
  @Prop() headers: PanelToolsHeaders = {};
  @Prop({ attribute: 'storage-key' }) storageKey: string = '';
  @Prop() toolsLabel: string = 'Tools';
  @Prop() toolShortcutsLabel: string = 'Tool shortcuts';
  @Prop() inboxLabel: string = 'Inbox';
  @Prop() inboxNavigationLabel: string = 'Inbox sections';

  @Watch('presentation')
  presentationChanged(next: 'drawer' | 'fullscreen', previous: 'drawer' | 'fullscreen') {
    if (next === previous) return;

    /*
     * Consumers update ShellTools and their slotted master/detail layout in the
     * same render. Forward the request immediately so PanelTools can conceal
     * its surface until its matching render class commits on the next frame.
     */
    if (this.panelToolsEl && this.panelToolsEl.getAttribute('presentation') !== next) {
      this.panelToolsEl.setAttribute('presentation', next);
    }
  }

  @Event({ bubbles: true, composed: true }) dsToolChange!: EventEmitter<{
    id: PanelToolsToolId;
    selected: boolean;
  }>;
  @Event({ bubbles: true, composed: true }) dsPresentationChange!: EventEmitter<{
    presentation: 'drawer' | 'fullscreen';
  }>;
  @Event({ bubbles: true, composed: true }) dsHeaderBack!: EventEmitter<{
    tool: PanelToolsToolId;
  }>;
  @Event({ bubbles: true, composed: true }) dsHeaderAction!: EventEmitter<{
    tool: PanelToolsToolId;
    id: string;
  }>;

  private panelToolsEl: HTMLDsPanelToolsElement | null = null;

  private get resolvedItems(): PanelToolsItem[] {
    return this.items ?? [];
  }

  private get availableInboxTools(): ShellInboxToolId[] {
    return this.resolvedItems
      .filter(
        item =>
          !item.isInactive &&
          itemUsesShellInbox(item)
      )
      .map(item => item.id as ShellInboxToolId);
  }

  private get mobileViewOrder(): PanelToolsToolId[] {
    return orderPanelToolsItems(this.resolvedItems).map(item => item.id);
  }

  private toolLabel(id: PanelToolsToolId): string {
    const item = this.resolvedItems.find(candidate => candidate.id === id);
    return (
      item?.label ??
      item?.ariaLabel ??
      PANEL_TOOLS_LABELS[id as keyof typeof PANEL_TOOLS_LABELS] ??
      id
    );
  }

  private get mobileActiveTool(): PanelToolsToolId | '' {
    const item = this.resolvedItems.find(candidate => candidate.id === this.activeTool);
    const inbox = item ? itemUsesShellInbox(item) : isShellInboxTool(this.activeTool);
    if (!inbox) return this.activeTool;
    return resolveAvailableInboxTool(this.activeTool, this.availableInboxTools);
  }

  componentWillLoad() {
    this.reconcileAvailability();
  }

  @Watch('items')
  handleItemsChange() {
    this.reconcileAvailability();
  }

  private reconcileAvailability() {
    const next = reconcilePanelToolsAvailability(this.resolvedItems, this.open, this.activeTool);
    this.open = next.open;
    this.activeTool = next.activeTool;
  }

  private resolvedHeaders(): PanelToolsHeaders {
    return this.headers ?? {};
  }

  private activeHeader(tool: PanelToolsToolId): PanelToolsHeaderConfig {
    return this.resolvedHeaders()[tool] ?? {};
  }

  private activateMobileTool(id: PanelToolsToolId) {
    const item = this.resolvedItems.find(entry => entry.id === id);
    if (!item || item.isInactive) return;
    const next = resolvePanelToolActivation(this.open, this.activeTool, id);
    this.open = next.open;
    this.activeTool = next.activeTool;
    this.dsToolChange.emit({ id, selected: next.selected });
  }

  private selectInboxTool = (event: CustomEvent<string>) => {
    const id = event.detail;
    if (!this.availableInboxTools.includes(id) || id === this.mobileActiveTool) return;
    this.open = true;
    this.activeTool = id;
    this.dsToolChange.emit({ id, selected: true });
  };

  private handlePanelToolChange = (
    event: CustomEvent<{ id: PanelToolsToolId; selected: boolean }>
  ) => {
    this.activeTool = event.detail.id;
    this.open = event.detail.selected;
  };

  private handlePanelPresentationChange = (
    event: CustomEvent<{ presentation: 'drawer' | 'fullscreen' }>
  ) => {
    this.presentation = event.detail.presentation;
  };

  private handleMobileHeaderAction = (
    tool: PanelToolsToolId,
    id: string,
    event: CustomEvent<MouseEvent>
  ) => {
    event.stopPropagation();
    this.dsHeaderAction.emit({ tool, id });
  };

  /** Match PanelTools' imperative activation contract in every responsive mode. */
  @Method()
  async activateTool(id: PanelToolsToolId) {
    if (this.responsiveMode !== 'mobile') {
      await this.panelToolsEl?.activateTool(id);
      return;
    }
    this.activateMobileTool(id);
  }

  /** Close the active global tool surface. */
  @Method()
  async closeDrawer() {
    if (this.responsiveMode !== 'mobile') {
      await this.panelToolsEl?.closeDrawer();
      return;
    }
    if (!this.open) return;
    const id = this.activeTool;
    this.open = false;
    if (id) this.dsToolChange.emit({ id, selected: false });
  }

  /** Focus an application-owned action in the visible shared tool header. */
  @Method()
  async focusHeaderAction(id: string) {
    if (this.responsiveMode !== 'mobile') {
      await this.panelToolsEl?.focusHeaderAction(id);
      return;
    }
    const action = (this.el.shadowRoot ?? this.el).querySelector(
      `[data-header-action-id="${CSS.escape(id)}"]`
    ) as
      | (HTMLElement & { setFocus?: () => Promise<void> })
      | null;
    await action?.setFocus?.();
  }

  private renderForwardedSlots() {
    return this.mobileViewOrder.flatMap(id => [
      <div key={`tool:${id}`} class="shell-tools__slot-proxy" slot={id}>
        <slot name={id} />
      </div>,
      <div
        key={`tool-view:${id}`}
        class="shell-tools__slot-proxy"
        slot={`${id}-view`}
      >
        <slot name={`${id}-view`} />
      </div>,
    ]);
  }

  private renderDesktop() {
    return (
      <div class="shell-tools__desktop">
        <ds-panel-tools
          open={this.open}
          activeTool={this.activeTool}
          presentation={this.presentation}
          fullscreenHeaderMode={this.fullscreenHeaderMode}
          items={this.resolvedItems}
          headers={this.resolvedHeaders()}
          storageKey={this.storageKey}
          toolsLabel={this.toolsLabel}
          toolShortcutsLabel={this.toolShortcutsLabel}
          ref={element => {
            this.panelToolsEl = element as HTMLDsPanelToolsElement | null;
          }}
          onDsToolChange={this.handlePanelToolChange}
          onDsPresentationChange={this.handlePanelPresentationChange}
        >
          {this.renderForwardedSlots()}
        </ds-panel-tools>
      </div>
    );
  }

  private renderMobileHeader(tool: PanelToolsToolId) {
    const header = this.activeHeader(tool);
    const configuredTitle = header.title?.trim();
    const title = configuredTitle || this.toolLabel(tool);
    const actions = (header.actions ?? []).filter(action => action.id !== 'fullscreen');
    const item = this.resolvedItems.find(candidate => candidate.id === tool);
    const inboxRoot = Boolean(item && itemUsesShellInbox(item) && !header.showBack);
    const sections =
      inboxRoot
        ? this.availableInboxTools.map(id => {
            const item = this.resolvedItems.find(candidate => candidate.id === id);
            return {
              id,
              label: this.toolLabel(id),
              variant: 'label' as const,
              dot: item?.dot,
            };
          })
        : [];

    return (
      <ds-mobile-header
        class="shell-tools__mobile-header"
        heading={title}
        headingLevel="h2"
        sections={sections}
        value={tool}
        sectionsAriaLabel={this.inboxNavigationLabel}
        sectionsPresentation={inboxRoot ? 'segmented' : 'switcher'}
        sectionsSize="lg"
        onDsSectionChange={this.selectInboxTool}
      >
        {header.showBack ? (
          <ds-tooltip
            slot="leading"
            label={header.backAriaLabel || 'Back'}
            side="bottom"
            size="sm"
          >
            <ds-button-unfilled
              variant="icon"
              icon={header.backIcon || 'ChevronLeft'}
              size="md"
              aria-label={header.backAriaLabel || 'Back'}
              activeFill={false}
              hasBorder={false}
              onDsClick={() => this.dsHeaderBack.emit({ tool })}
            />
          </ds-tooltip>
        ) : null}
        {actions.map(action => (
          <ds-tooltip
            slot="trailing"
            key={action.id}
            label={action.ariaLabel}
            side="bottom"
            size="sm"
          >
            <ds-button-unfilled
              id={action.triggerId || undefined}
              data-header-action-id={action.id}
              variant="icon"
              icon={action.icon}
              size="md"
              aria-label={action.ariaLabel}
              haspopup={action.haspopup}
              controls={action.controls}
              expanded={action.expanded}
              pressed={action.pressed}
              isInactive={action.isInactive}
              activeFill={false}
              hasBorder={false}
              onDsClick={(event: CustomEvent<MouseEvent>) =>
                this.handleMobileHeaderAction(tool, action.id, event)}
            />
          </ds-tooltip>
        ))}
      </ds-mobile-header>
    );
  }

  private renderMobile() {
    const tool = this.mobileActiveTool;
    return (
      <div
        class="shell-tools__mobile"
        aria-hidden={this.open && tool ? undefined : 'true'}
        inert={this.open && tool ? undefined : true}
      >
        {tool ? this.renderMobileHeader(tool) : null}
        <div class="shell-tools__mobile-body">
          {this.mobileViewOrder.map(id => {
            const active = this.open && id === tool;
            return (
              <div
                key={`mobile-tool-view:${id}`}
                class={{
                  'shell-tools__view': true,
                  'shell-tools__view--active': active,
                }}
                hidden={!active}
                aria-hidden={active ? undefined : 'true'}
                inert={active ? undefined : true}
              >
                <slot name={`${id}-view`}>
                  <slot name={id} />
                </slot>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  render() {
    const mobile = this.responsiveMode === 'mobile';
    return (
      <Host
        role={
          mobile
            ? this.presentation === 'fullscreen'
              ? 'dialog'
              : 'complementary'
            : undefined
        }
        aria-modal={mobile && this.presentation === 'fullscreen' ? 'true' : undefined}
        aria-label={mobile ? this.toolsLabel : undefined}
      >
        {mobile ? this.renderMobile() : this.renderDesktop()}
      </Host>
    );
  }
}

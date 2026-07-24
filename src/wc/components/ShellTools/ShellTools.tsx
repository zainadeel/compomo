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
  PANEL_TOOLS_TOOL_IDS,
  type PanelToolsHeaderAction,
  type PanelToolsHeaderConfig,
  type PanelToolsHeaders,
  type PanelToolsItem,
  type PanelToolsToolId,
} from '../PanelTools/panel-tools-types';
import {
  parsePanelToolsItems,
  reconcilePanelToolsAvailability,
  resolvePanelToolActivation,
} from '../PanelTools/panel-tools-utils';
import {
  isShellInboxTool,
  resolveAvailableInboxTool,
  type ShellInboxToolId,
  type ShellResponsiveMode,
} from '../../shell/shell-responsive';

const MOBILE_VIEW_ORDER: PanelToolsToolId[] = [
  'search',
  'agents',
  'messages',
  'stacks',
  'activity',
  'help',
];

@Component({
  tag: 'ds-shell-tools',
  styleUrl: 'ShellTools.css',
  scoped: true,
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
  @Prop({ attribute: 'items-json' }) itemsJson: string = '';
  @Prop() headers: PanelToolsHeaders = {};
  @Prop({ attribute: 'headers-json' }) headersJson: string = '';
  @Prop({ attribute: 'storage-key' }) storageKey: string = '';
  @Prop() toolsLabel: string = 'Tools';
  @Prop() toolShortcutsLabel: string = 'Tool shortcuts';
  @Prop() inboxLabel: string = 'Inbox';
  @Prop() inboxNavigationLabel: string = 'Inbox sections';

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
    return parsePanelToolsItems(this.items, this.itemsJson);
  }

  private get availableInboxTools(): ShellInboxToolId[] {
    return this.resolvedItems
      .filter(item => !item.isInactive && isShellInboxTool(item.id))
      .map(item => item.id as ShellInboxToolId);
  }

  private get mobileActiveTool(): PanelToolsToolId | '' {
    if (!isShellInboxTool(this.activeTool)) return this.activeTool;
    return resolveAvailableInboxTool(this.activeTool, this.availableInboxTools);
  }

  componentWillLoad() {
    this.reconcileAvailability();
  }

  @Watch('items')
  @Watch('itemsJson')
  handleItemsChange() {
    this.reconcileAvailability();
  }

  private reconcileAvailability() {
    const next = reconcilePanelToolsAvailability(this.resolvedItems, this.open, this.activeTool);
    this.open = next.open;
    this.activeTool = next.activeTool;
  }

  private resolvedHeaders(): PanelToolsHeaders {
    if (Object.keys(this.headers).length) return this.headers;
    if (!this.headersJson.trim()) return {};
    try {
      const parsed = JSON.parse(this.headersJson);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as PanelToolsHeaders)
        : {};
    } catch {
      return {};
    }
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
    if (!isShellInboxTool(id) || id === this.mobileActiveTool) return;
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
    event: CustomEvent<{ id: string }>
  ) => {
    event.stopPropagation();
    this.dsHeaderAction.emit({ tool, id: event.detail.id });
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
    const action = this.el.querySelector(`[data-header-action-id="${CSS.escape(id)}"]`) as
      | (HTMLElement & { setFocus?: () => Promise<void> })
      | null;
    await action?.setFocus?.();
  }

  private renderForwardedSlots() {
    return PANEL_TOOLS_TOOL_IDS.flatMap(id => [
      <slot name={id} slot={id} />,
      <slot name={`${id}-view`} slot={`${id}-view`} />,
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
    const title = isShellInboxTool(tool)
      ? header.showBack && configuredTitle
        ? configuredTitle
        : this.inboxLabel
      : configuredTitle || PANEL_TOOLS_LABELS[tool];
    const actions = header.actions ?? [];

    return (
      <ds-panel-tool-header
        class="shell-tools__mobile-header"
        heading={title}
        showBack={header.showBack ?? false}
        backIcon={header.backIcon || 'ChevronLeft'}
        backAriaLabel={header.backAriaLabel || 'Back'}
        showMenu={false}
        ref={element => {
          const toolHeader = element as
            | (HTMLDsPanelToolHeaderElement & { actions: PanelToolsHeaderAction[] })
            | undefined;
          if (toolHeader) toolHeader.actions = actions;
        }}
        onDsBack={() => this.dsHeaderBack.emit({ tool })}
        onDsAction={(event: CustomEvent<{ id: string }>) =>
          this.handleMobileHeaderAction(tool, event)}
      />
    );
  }

  private renderMobile() {
    const tool = this.mobileActiveTool;
    const inboxTabs = this.availableInboxTools.map(id => ({
      id,
      label: PANEL_TOOLS_LABELS[id],
    }));

    return (
      <div
        class="shell-tools__mobile"
        aria-hidden={this.open && tool ? undefined : 'true'}
        inert={this.open && tool ? undefined : true}
      >
        {tool ? this.renderMobileHeader(tool) : null}
        {tool && isShellInboxTool(tool) && inboxTabs.length ? (
          <div class="shell-tools__inbox-nav">
            <ds-tab-group
              tabs={inboxTabs}
              value={tool}
              aria-label={this.inboxNavigationLabel}
              onDsChange={this.selectInboxTool}
            />
          </div>
        ) : null}
        <div class="shell-tools__mobile-body">
          {MOBILE_VIEW_ORDER.map(id => {
            const active = this.open && id === tool;
            return (
              <div
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
    return (
      <Host
        role={this.presentation === 'fullscreen' ? 'dialog' : 'complementary'}
        aria-modal={this.presentation === 'fullscreen' ? 'true' : undefined}
        aria-label={this.toolsLabel}
      >
        {this.responsiveMode === 'mobile' ? this.renderMobile() : this.renderDesktop()}
      </Host>
    );
  }
}

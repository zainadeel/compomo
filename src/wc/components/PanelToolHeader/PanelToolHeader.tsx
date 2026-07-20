import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';
import type { PanelToolsHeaderAction } from '../PanelTools/panel-tools-types';

@Component({
  tag: 'ds-panel-tool-header',
  styleUrl: 'PanelToolHeader.css',
  scoped: true,
})
export class PanelToolHeader {
  @Element() el!: HTMLElement;

  /** Visible heading for the active tool view. */
  @Prop() heading: string = '';
  /** Show the leading Back action. */
  @Prop() showBack: boolean = false;
  /** Canonical icon for the leading navigation or dismiss action. */
  @Prop() backIcon: string = 'ChevronLeft';
  /** Accessible name for the leading navigation or dismiss action. */
  @Prop() backAriaLabel: string = 'Back';
  /** Show the trailing options-menu trigger. */
  @Prop() showMenu: boolean = true;
  /** Accessible name for the options-menu trigger. */
  @Prop() menuAriaLabel: string = 'More options';
  /** Stable id placed on the menu trigger host for ds-menu anchoring. */
  @Prop() menuTriggerId: string = '';
  /** Id of the menu controlled by the trigger. */
  @Prop() menuControls: string | undefined;
  /** Whether the controlled menu is open. */
  @Prop() menuExpanded: boolean = false;
  /** Trailing application-owned icon actions. When present, these replace the legacy menu action. */
  @Prop() actions: PanelToolsHeaderAction[] = [];

  @Event() dsBack!: EventEmitter<MouseEvent>;
  @Event() dsMenuToggle!: EventEmitter<MouseEvent>;
  @Event() dsAction!: EventEmitter<{ id: string; originalEvent: MouseEvent }>;

  @Method()
  async focusMenuTrigger() {
    const trigger = this.el.querySelector(
      'ds-button-unfilled.panel-tool-header__menu, ds-button-unfilled[data-header-action-id="menu"]'
    ) as (HTMLElement & { setFocus?: () => Promise<void> }) | null;
    await trigger?.setFocus?.();
  }

  render() {
    const authoredActions = this.actions.length > 0;
    const actions: PanelToolsHeaderAction[] = authoredActions
      ? this.actions
      : this.showMenu
      ? [
          {
            id: 'menu',
            icon: 'Ellipses',
            ariaLabel: this.menuAriaLabel,
            triggerId: this.menuTriggerId,
            controls: this.menuControls,
            expanded: this.menuExpanded,
            haspopup: 'menu',
          },
        ]
      : [];

    return (
      <Host>
        <header class="panel-tool-header">
          <div class="panel-tool-header__leading">
            {this.showBack ? (
              <ds-button-unfilled
                class="panel-tool-header__back"
                variant="icon"
                icon={this.backIcon}
                size="md"
                aria-label={this.backAriaLabel}
                activeFill={false}
                hasBorder={false}
                onDsClick={(event: CustomEvent<MouseEvent>) => this.dsBack.emit(event.detail)}
              />
            ) : null}
          </div>
          <ds-text
            class="panel-tool-header__heading ds-control--md"
            as="h2"
            variant="text-body-medium"
            emphasis
            color="primary"
            lineTruncation={1}
          >
            {this.heading}
          </ds-text>
          <div class="panel-tool-header__trailing">
            {actions.map(action => (
              <ds-button-unfilled
                key={action.id}
                id={action.triggerId || undefined}
                data-header-action-id={action.id}
                class={{
                  'panel-tool-header__action': true,
                  'panel-tool-header__menu': action.id === 'menu',
                }}
                variant="icon"
                icon={action.icon}
                size="md"
                aria-label={action.ariaLabel}
                haspopup={action.haspopup}
                controls={action.controls}
                expanded={action.expanded}
                pressed={action.pressed}
                isActive={!!action.expanded}
                isInactive={action.isInactive}
                activeFill={false}
                hasBorder={false}
                onDsClick={(event: CustomEvent<MouseEvent>) => {
                  if (!authoredActions && action.id === 'menu')
                    this.dsMenuToggle.emit(event.detail);
                  this.dsAction.emit({ id: action.id, originalEvent: event.detail });
                }}
              />
            ))}
          </div>
        </header>
      </Host>
    );
  }
}

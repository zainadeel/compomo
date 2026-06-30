import { Component, Prop, Element, State, Watch, h, Host } from '@stencil/core';
import {
  PANEL_TOOLS_LABELS,
  type PanelToolsToolId,
} from './panel-tools-types';

@Component({
  tag: 'ds-panel-tools',
  styleUrl: 'PanelTools.css',
  scoped: true,
})
export class PanelTools {
  @Element() el!: HTMLElement;

  /** When false, width animates to 0. */
  @Prop({ reflect: true }) open: boolean = false;

  /** Active tool view — `search`, `inbox`, or `agents`. */
  @Prop({ attribute: 'active-tool', reflect: true }) activeTool: PanelToolsToolId | '' = '';

  /** Stays true until the close width transition finishes. */
  @State() private expanded = false;

  componentWillLoad() {
    if (this.open) this.expanded = true;
  }

  connectedCallback() {
    this.el.addEventListener('transitionend', this.handleTransitionEnd);
  }

  disconnectedCallback() {
    this.el.removeEventListener('transitionend', this.handleTransitionEnd);
  }

  @Watch('open')
  openChanged(isOpen: boolean) {
    if (isOpen) this.expanded = true;
  }

  private handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== this.el) return;
    if (event.propertyName !== 'max-width') return;
    if (!this.open) this.expanded = false;
  };

  private isShowingContent(): boolean {
    return this.open || this.expanded;
  }

  private isActiveTool(id: PanelToolsToolId): boolean {
    return this.isShowingContent() && this.activeTool === id;
  }

  private headerLabel(): string {
    if (!this.activeTool) return '';
    return PANEL_TOOLS_LABELS[this.activeTool as PanelToolsToolId] ?? '';
  }

  render() {
    const showingContent = this.isShowingContent();

    return (
      <Host
        class={{ 'panel-tools': true, 'panel-tools--open': this.open }}
        role="complementary"
        aria-label={this.headerLabel() || 'Tools'}
        aria-hidden={showingContent ? null : 'true'}
      >
        <div class="panel-tools__inner">
          <header class="panel-tools__header">
            <span class="text-body-medium-emphasis">{this.headerLabel()}</span>
          </header>
          <div class="panel-tools__body">
            <div
              class={{
                'panel-tools__view': true,
                'panel-tools__view--active': this.isActiveTool('search'),
              }}
              hidden={!this.isActiveTool('search')}
            >
              <slot name="search" />
            </div>
            <div
              class={{
                'panel-tools__view': true,
                'panel-tools__view--active': this.isActiveTool('inbox'),
              }}
              hidden={!this.isActiveTool('inbox')}
            >
              <slot name="inbox" />
            </div>
            <div
              class={{
                'panel-tools__view': true,
                'panel-tools__view--active': this.isActiveTool('agents'),
              }}
              hidden={!this.isActiveTool('agents')}
            >
              <slot name="agents" />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}

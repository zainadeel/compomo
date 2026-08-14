import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ds-bar-action',
  styleUrl: 'BarAction.css',
  scoped: true,
})
export class BarAction {
  /** Number of selected items. The bar is hidden while this is below one. */
  @Prop() count: number = 0;

  /** Localized noun shown after the count. */
  @Prop() selectedLabel: string = 'selected';

  /** Visible Clear control label. */
  @Prop() clearLabel: string = 'Clear';

  /** Accessible name for the toolbar. */
  @Prop() label: string = 'Selected item actions';

  /** Emitted when Clear is activated. The application owns the selected identities. */
  @Event() dsClear!: EventEmitter<MouseEvent>;

  private get isVisible(): boolean {
    return this.count >= 1;
  }

  private handleClear = (event: MouseEvent) => {
    this.dsClear.emit(event);
  };

  render() {
    return (
      <Host
        class="ds-chrome-row ds-chrome-space--md ds-control-elevation ds-control-elevation--md"
        hidden={!this.isVisible || undefined}
        role="toolbar"
        aria-label={this.label}
      >
        <div class="bar-action__copy">
          <ds-text
            class="bar-action__count"
            as="span"
            variant="text-body-medium"
            color="inherit"
            fontFeature="tabular-nums"
            lineTruncation={1}
            aria-live="polite"
          >
            {this.count} {this.selectedLabel}
          </ds-text>
          <ds-text
            class="bar-action__separator"
            as="span"
            variant="text-body-medium"
            color="inherit"
            aria-hidden="true"
          >
            ·
          </ds-text>
          <button
            class="bar-action__clear ds-text-action ds-text-action--on-bold ds-focus-ring"
            type="button"
            onClick={this.handleClear}
          >
            <ds-text as="span" variant="text-body-medium" color="inherit">
              {this.clearLabel}
            </ds-text>
          </button>
        </div>
        <div class="bar-action__actions">
          <slot name="actions" />
        </div>
      </Host>
    );
  }
}

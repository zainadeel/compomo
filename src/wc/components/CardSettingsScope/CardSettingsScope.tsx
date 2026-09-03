import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

export interface SettingsScopeRequest {
  scope: 'area' | 'profile';
  anchor: HTMLButtonElement;
  originalEvent: MouseEvent;
}

@Component({
  tag: 'ds-card-settings-scope',
  styleUrl: 'CardSettingsScope.css',
  scoped: true,
})
export class CardSettingsScope {
  /** Current product area or the label for the combined settings view. */
  @Prop() areaLabel: string = 'All settings';
  /** Current organization or settings profile. */
  @Prop() profileLabel: string = 'Organization';
  /** Sentence prefix, supplied separately for localization. */
  @Prop() managingLabel: string = 'Managing';
  /** Sentence connector, supplied separately for localization. */
  @Prop() forLabel: string = 'for';
  /** Accessible name for this context region. */
  @Prop() scopeLabel: string = 'Settings scope';
  /** ID of the application-owned product-area menu. */
  @Prop() areaControls: string | undefined;
  /** ID of the application-owned profiles popup. */
  @Prop() profileControls: string | undefined;
  /** Whether the product-area menu is open. */
  @Prop() areaExpanded: boolean = false;
  /** Whether the profiles popup is open. */
  @Prop() profileExpanded: boolean = false;
  /** Empty informational profile popups use dialog semantics instead of a menu. */
  @Prop() profilePopup: 'menu' | 'dialog' = 'menu';

  /** Requests a popup; the owner supplies choices, open state, and selection. */
  @Event() dsScopeRequest!: EventEmitter<SettingsScopeRequest>;

  private request(scope: SettingsScopeRequest['scope'], event: MouseEvent) {
    this.dsScopeRequest.emit({
      scope,
      anchor: event.currentTarget as HTMLButtonElement,
      originalEvent: event,
    });
  }

  render() {
    return (
      <Host>
        <div
          class="card-settings-scope ds-control-elevation ds-control-elevation--sm"
          role="region"
          aria-label={this.scopeLabel}
        >
          <ds-text as="span" variant="text-body-medium" color="primary">
            {this.managingLabel}
          </ds-text>
          <button
            type="button"
            class="card-settings-scope__action ds-text-action ds-focus-ring"
            aria-haspopup="menu"
            aria-controls={this.areaControls}
            aria-expanded={String(this.areaExpanded)}
            onClick={event => this.request('area', event)}
          >
            <ds-text as="span" variant="text-body-medium" color="inherit">
              {this.areaLabel}
            </ds-text>
          </button>
          <ds-text as="span" variant="text-body-medium" color="primary">
            {this.forLabel}
          </ds-text>
          <button
            type="button"
            class="card-settings-scope__action ds-text-action ds-focus-ring"
            aria-haspopup={this.profilePopup}
            aria-controls={this.profileControls}
            aria-expanded={String(this.profileExpanded)}
            onClick={event => this.request('profile', event)}
          >
            <ds-text as="span" variant="text-body-medium" color="inherit">
              {this.profileLabel}
            </ds-text>
          </button>
        </div>
      </Host>
    );
  }
}

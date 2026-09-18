import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

let settingRowToggleSequence = 0;

export type SettingRowToggleVariant = 'emphasis' | 'non-emphasis';

/** A labeled binary setting that applies immediately through its application owner. */
@Component({
  tag: 'ds-setting-row-toggle',
  styleUrl: 'SettingRowToggle.css',
  scoped: true,
})
export class SettingRowToggle {
  /** Name of the enabled setting. */
  @Prop() label!: string;
  /** Supporting copy explaining the setting and its alternative. */
  @Prop() description?: string;
  /** Controlled enabled state. */
  @Prop() checked = false;
  /** Prevent changes while the setting is unavailable. */
  @Prop() disabled = false;
  /** Typography recipe for the setting copy. */
  @Prop() variant: SettingRowToggleVariant = 'emphasis';

  /** Requests the next value; the application owns acceptance and persistence. */
  @Event() dsChange!: EventEmitter<boolean>;

  private readonly rowId = `ds-setting-row-toggle-${++settingRowToggleSequence}`;

  private handleChange = (event: CustomEvent<boolean>) => {
    event.stopPropagation();
    // Keep the composed switch controlled until the owner accepts this request.
    (event.target as HTMLDsSwitchElement).checked = this.checked;
    this.dsChange.emit(event.detail);
  };

  render() {
    return (
      <Host>
        <div class="setting-row-toggle__copy">
          <ds-text
            textId={`${this.rowId}-label`}
            variant="text-body-medium"
            color="primary"
            emphasis={this.variant === 'emphasis'}
          >
            {this.label}
          </ds-text>
          {this.description && (
            <ds-text
              textId={`${this.rowId}-description`}
              variant={this.variant === 'emphasis' ? 'text-body-medium' : 'text-body-small'}
              color="secondary"
            >
              {this.description}
            </ds-text>
          )}
        </div>
        <ds-switch
          checked={this.checked}
          disabled={this.disabled}
          aria-labelledby={`${this.rowId}-label`}
          aria-describedby={this.description ? `${this.rowId}-description` : undefined}
          onDsChange={this.handleChange}
        />
      </Host>
    );
  }
}

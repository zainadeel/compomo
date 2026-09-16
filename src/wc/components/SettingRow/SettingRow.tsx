import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

let settingRowSequence = 0;

/** A labeled binary setting that applies immediately through its application owner. */
@Component({
  tag: 'ds-setting-row',
  styleUrl: 'SettingRow.css',
  scoped: true,
})
export class SettingRow {
  /** Name of the enabled setting. */
  @Prop() label!: string;
  /** Supporting copy explaining the setting and its alternative. */
  @Prop() description?: string;
  /** Controlled enabled state. */
  @Prop() checked = false;
  /** Prevent changes while the setting is unavailable. */
  @Prop() disabled = false;

  /** Requests the next value; the application owns acceptance and persistence. */
  @Event() dsChange!: EventEmitter<boolean>;

  private readonly rowId = `ds-setting-row-${++settingRowSequence}`;

  private handleChange = (event: CustomEvent<boolean>) => {
    event.stopPropagation();
    // Keep the composed switch controlled until the owner accepts this request.
    (event.target as HTMLDsSwitchElement).checked = this.checked;
    this.dsChange.emit(event.detail);
  };

  render() {
    return (
      <Host>
        <div class="setting-row__copy">
          <ds-text
            textId={`${this.rowId}-label`}
            variant="text-body-medium"
            color="primary"
            emphasis
          >
            {this.label}
          </ds-text>
          {this.description && (
            <ds-text
              textId={`${this.rowId}-description`}
              variant="text-body-medium"
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

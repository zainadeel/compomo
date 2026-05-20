import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

let idCounter = 0;

@Component({
  tag: 'ds-checkbox',
  styleUrl: 'Checkbox.css',
  scoped: true,
})
export class Checkbox {
  private labelId = `ds-checkbox-label-${++idCounter}`;

  @Prop() label!: string;
  @Prop({ mutable: true }) checked: boolean = false;
  @Prop() indeterminate: boolean = false;
  @Prop() inactive: boolean = false;

  @Event() dsChange!: EventEmitter<boolean>;

  private handleActivate = () => {
    if (this.inactive) return;
    this.checked = !this.checked;
    this.dsChange.emit(this.checked);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.handleActivate();
    }
  };

  render() {
    const isMarked = this.checked || this.indeterminate;

    return (
      <Host
        role="checkbox"
        aria-checked={this.indeterminate ? 'mixed' : String(this.checked)}
        aria-disabled={this.inactive || undefined}
        aria-labelledby={this.labelId}
        tabIndex={this.inactive ? -1 : 0}
        class={{ checkbox: true, inactive: this.inactive }}
        onClick={this.handleActivate}
        onKeyDown={this.handleKeyDown}
      >
        <span class={{ box: true, 'box--marked': isMarked }}>
          {isMarked && (
            <span class="checkmark" aria-hidden="true">
              {this.indeterminate ? '−' : '✓'}
            </span>
          )}
        </span>
        <span id={this.labelId} class="text-body-medium checkbox__label">
          {this.label}
        </span>
      </Host>
    );
  }
}

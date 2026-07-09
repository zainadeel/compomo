import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

@Component({
  tag: 'ds-toggle',
  styleUrl: 'Toggle.css',
  shadow: true,
})
export class Toggle {
  @Prop({ mutable: true }) checked: boolean = false;
  @Prop() isInactive: boolean = false;

  @Event() dsChange!: EventEmitter<boolean>;

  private handleClick = () => {
    if (this.isInactive) return;
    this.checked = !this.checked;
    this.dsChange.emit(this.checked);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.isInactive) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.handleClick();
    }
  };

  render() {
    return (
      <Host
        role="switch"
        aria-checked={String(this.checked)}
        aria-disabled={this.isInactive || undefined}
        tabIndex={this.isInactive ? -1 : 0}
        class={{ toggle: true, checked: this.checked, 'ds-control-inactive': this.isInactive }}
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
      >
        <span class="thumb" />
      </Host>
    );
  }
}

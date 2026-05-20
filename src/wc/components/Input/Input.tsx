import { Component, Prop, Event, EventEmitter, Element, Method, h, Host } from '@stencil/core';

export type InputType = 'text' | 'email' | 'tel' | 'url' | 'search' | 'password';

let idCounter = 0;

@Component({
  tag: 'ds-input',
  styleUrl: 'Input.css',
  scoped: true,
})
export class Input {
  @Element() el!: HTMLElement;

  private generatedId = `ds-input-${++idCounter}`;
  private errorId = `${this.generatedId}-error`;

  @Prop() value: string = '';
  @Prop() placeholder: string | undefined;
  @Prop() type: InputType = 'text';
  @Prop() inactive: boolean = false;
  @Prop() autoFocus: boolean = false;
  @Prop() error: boolean = false;
  @Prop() errorMessage: string | undefined;
  /** Associates the internal input with an external <label>. */
  @Prop() inputId: string | undefined;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | undefined;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  @Event() dsChange!: EventEmitter<string>;
  @Event() dsClear!: EventEmitter<void>;

  @Method()
  async setFocus() {
    this.el.querySelector('input')?.focus();
  }

  private handleInput = (e: Event) => {
    this.dsChange.emit((e.target as HTMLInputElement).value);
  };

  private handleClear = () => {
    this.dsChange.emit('');
    this.dsClear.emit();
    this.el.querySelector('input')?.focus();
  };

  render() {
    const inputId = this.inputId ?? this.generatedId;
    const showClear = this.type === 'search' && this.value.length > 0 && !this.inactive;
    const showError = this.error && Boolean(this.errorMessage);

    const describedBy = [
      this.ariaDescribedby,
      showError ? this.errorId : undefined,
    ].filter(Boolean).join(' ') || undefined;

    return (
      <Host class="input-container">
        <div class={{ wrapper: true, 'wrapper--error': this.error }}>
          <div class="row">
            <input
              type={this.type}
              id={inputId}
              value={this.value}
              placeholder={this.placeholder}
              disabled={this.inactive}
              autoFocus={this.autoFocus}
              class="native-input"
              aria-label={this.ariaLabel}
              aria-labelledby={this.ariaLabelledby}
              aria-describedby={describedBy}
              aria-invalid={this.error || undefined}
              onInput={this.handleInput}
            />
            {showClear && (
              <button
                type="button"
                class="clear-btn"
                onClick={this.handleClear}
                aria-label="Clear"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            )}
            <span class="suffix">
              <slot name="suffix" />
            </span>
          </div>
        </div>
        {showError && (
          <div id={this.errorId} role="alert" class="error-text">
            {this.errorMessage}
          </div>
        )}
      </Host>
    );
  }
}

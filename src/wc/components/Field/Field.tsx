import { Component, Prop, h, Host } from '@stencil/core';

let fieldCounter = 0;

@Component({
  tag: 'ds-field',
  styleUrl: 'Field.css',
  scoped: true,
})
export class Field {
  @Prop() label!: string;
  /** ID forwarded to the slotted control via the label's `for` attribute. Auto-generated if omitted. */
  @Prop() fieldId: string | undefined;

  private resolvedId = `ds-field-${++fieldCounter}`;

  render() {
    const id = this.fieldId || this.resolvedId;
    return (
      <Host>
        <div class="field">
          <ds-text as="label" variant="text-body-small" emphasis for={id}>
            {this.label}
          </ds-text>
          <slot />
        </div>
      </Host>
    );
  }
}

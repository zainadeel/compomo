import { Component, h, Host, Prop } from '@stencil/core';

export type CheckboxGroupSize = 'lg' | 'md' | 'sm' | 'xs';

let checkboxGroupId = 0;

@Component({
  tag: 'ds-checkbox-group',
  styleUrl: 'CheckboxGroup.css',
  scoped: true,
})
export class CheckboxGroup {
  private readonly labelId = `ds-checkbox-group-label-${++checkboxGroupId}`;

  /** Visible label and accessible name for the checkbox list. */
  @Prop() label!: string;
  /** Density of the label row; use the same size on every slotted Checkbox. */
  @Prop() size: CheckboxGroupSize = 'md';
  /** Id reference for supporting guidance or an error message. */
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  render() {
    return (
      <Host
        role="group"
        aria-labelledby={this.labelId}
        aria-describedby={this.ariaDescribedby}
        class={`checkbox-group checkbox-group--${this.size}`}
      >
        <ds-text
          class={`checkbox-group__label ds-control-section-heading ds-control--${this.size}`}
          as="span"
          variant="text-body-small"
          emphasis
          textId={this.labelId}
        >
          {this.label}
        </ds-text>
        <div class="checkbox-group__options">
          <slot />
        </div>
      </Host>
    );
  }
}

import { Component, Element, h, Host, Prop } from '@stencil/core';

export type CheckboxGroupSize = 'lg' | 'md' | 'sm' | 'xs';

let checkboxGroupId = 0;

@Component({
  tag: 'ds-checkbox-group',
  styleUrl: 'CheckboxGroup.css',
  scoped: true,
})
export class CheckboxGroup {
  @Element() el!: HTMLElement;
  private readonly labelId = `ds-checkbox-group-label-${++checkboxGroupId}`;

  /** Visible label and accessible name for the checkbox list. */
  @Prop() label?: string;
  /** Density of the label row; use the same size on every slotted Checkbox. */
  @Prop() size: CheckboxGroupSize = 'md';
  /** Accessible name when visible group labeling is unavailable. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Id reference for a visible group label. */
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  /** Id reference for supporting guidance or an error message. */
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  private get hasGroupLabel(): boolean {
    return Boolean(this.label?.trim());
  }

  /** Settings rows own a separate heading; never mount the form group label there. */
  private get showGroupLabel(): boolean {
    return this.hasGroupLabel && !this.el.closest('ds-setting-row-checkbox');
  }

  render() {
    return (
      <Host
        role="group"
        aria-label={this.showGroupLabel ? undefined : this.ariaLabel}
        aria-labelledby={this.showGroupLabel ? this.labelId : this.ariaLabelledby}
        aria-describedby={this.ariaDescribedby}
        class={{
          'checkbox-group': true,
          [`checkbox-group--${this.size}`]: true,
          'checkbox-group--labeled': this.showGroupLabel,
        }}
      >
        {this.showGroupLabel ? (
          <ds-text
            key="checkbox-group-label"
            class={`checkbox-group__label ds-control-section-heading ds-control--${this.size}`}
            as="span"
            variant="text-body-small"
            emphasis
            textId={this.labelId}
          >
            {this.label}
          </ds-text>
        ) : null}
        <div key="checkbox-group-options" class="checkbox-group__options">
          <slot />
        </div>
      </Host>
    );
  }
}

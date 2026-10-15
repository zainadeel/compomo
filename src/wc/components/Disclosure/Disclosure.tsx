import { Component, Prop, Event, EventEmitter, Element, h, Host } from '@stencil/core';
import type { ButtonSize } from '../../utils/button-types';

export type DisclosureHeadingLevel = 2 | 3 | 4 | 5 | 6;
export type DisclosureSize = Extract<ButtonSize, 'sm' | 'md'>;

let disclosureIdCounter = 0;

@Component({
  tag: 'ds-disclosure',
  styleUrl: 'Disclosure.css',
  scoped: true,
})
export class Disclosure {
  @Element() el!: HTMLElement;

  /** Whether the content is shown. The component mutates this when the trigger is activated. */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;
  /** Visible trigger label. */
  @Prop() label!: string;
  /** Trigger density, matching ButtonUnfilled. */
  @Prop() size: DisclosureSize = 'md';
  /** Wraps the trigger in a heading when the label titles a document section. */
  @Prop() headingLevel: DisclosureHeadingLevel | undefined;
  @Prop() isInactive: boolean = false;

  /** Emitted after the user toggles the content; detail is the new open state. */
  @Event() dsToggle!: EventEmitter<boolean>;

  private readonly panelId = `ds-disclosure-${++disclosureIdCounter}-panel`;

  private handleTriggerClick = (event: CustomEvent<MouseEvent>) => {
    // The trigger's own dsClick is an implementation detail; owners listen for dsToggle.
    event.stopPropagation();
    if (this.isInactive) return;
    this.open = !this.open;
    this.dsToggle.emit(this.open);
  };

  render() {
    const trigger = (
      <ds-button-unfilled
        class="disclosure-trigger"
        variant="icon-label"
        size={this.size}
        icon={this.open ? 'ChevronDown' : 'ChevronRight'}
        label={this.label}
        hasBorder={false}
        pressScale={false}
        expanded={this.open}
        surfaceOpen={false}
        controls={this.panelId}
        isInactive={this.isInactive}
        onDsClick={this.handleTriggerClick}
      />
    );
    const HeadingTag = this.headingLevel ? (`h${this.headingLevel}` as 'h3') : null;

    return (
      <Host class={{ 'disclosure--open': this.open }}>
        {HeadingTag ? <HeadingTag class="disclosure-heading">{trigger}</HeadingTag> : trigger}
        <div
          id={this.panelId}
          class={{ 'disclosure-panel': true, 'disclosure-panel--open': this.open }}
          role="region"
          aria-label={this.label}
          inert={!this.open}
        >
          <div class="disclosure-panel__clip">
            <div class="disclosure-content">
              <slot />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}

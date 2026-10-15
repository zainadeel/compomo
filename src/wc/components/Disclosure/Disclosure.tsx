import { Component, Prop, State, Event, EventEmitter, Element, h, Host } from '@stencil/core';

export type DisclosureVariant = 'flush' | 'contained';
export type DisclosureHeadingLevel = 2 | 3 | 4 | 5 | 6;

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
  @Prop() heading!: string;
  /** Optional supporting copy shown below the heading inside the trigger. */
  @Prop() description: string = '';
  /** Heading level that wraps the trigger, matching the surrounding document outline. */
  @Prop() headingLevel: DisclosureHeadingLevel = 3;
  /** `flush` separates stacked sections with a divider; `contained` sits on its own card surface. */
  @Prop() variant: DisclosureVariant = 'flush';
  @Prop() isInactive: boolean = false;

  @State() private hasTrailing: boolean = false;

  /** Emitted after the user toggles the section; detail is the new open state. */
  @Event() dsToggle!: EventEmitter<boolean>;

  private readonly baseId = `ds-disclosure-${++disclosureIdCounter}`;
  private readonly panelId = `${this.baseId}-panel`;
  private readonly triggerId = `${this.baseId}-trigger`;

  componentWillLoad() {
    this.hasTrailing = this.el.querySelector('[slot="trailing"]') !== null;
  }

  private toggle = () => {
    if (this.isInactive) return;
    this.open = !this.open;
    this.dsToggle.emit(this.open);
  };

  private updateTrailing(slot: HTMLSlotElement) {
    this.hasTrailing =
      slot
        .assignedNodes()
        .some(node => node.nodeType !== Node.TEXT_NODE || !!node.textContent?.trim()) ||
      this.el.querySelector('[slot="trailing"]') !== null;
  }

  render() {
    const HeadingTag = `h${this.headingLevel}` as 'h3';
    return (
      <Host
        class={{
          'disclosure--contained': this.variant === 'contained',
          'disclosure--open': this.open,
        }}
      >
        <div class="disclosure-header ds-interaction-fill">
          <HeadingTag class="disclosure-heading-level">
            <button
              id={this.triggerId}
              type="button"
              class={{
                'disclosure-trigger': true,
                'ds-control-inactive': this.isInactive,
              }}
              aria-expanded={this.open ? 'true' : 'false'}
              aria-controls={this.panelId}
              aria-disabled={this.isInactive ? 'true' : undefined}
              onClick={this.toggle}
            >
              <ds-icon
                class="disclosure-chevron ds-interaction-fill__content"
                name="ChevronDown"
                size="md"
                color="inherit"
              />
              <span class="disclosure-copy ds-interaction-fill__content">
                <ds-text
                  class="disclosure-title"
                  as="span"
                  variant="text-body-medium"
                  emphasis
                  color="primary"
                  wrap="wrap"
                >
                  {this.heading}
                </ds-text>
                {this.description ? (
                  <ds-text
                    class="disclosure-description"
                    as="span"
                    variant="text-body-small"
                    color="secondary"
                    wrap="wrap"
                  >
                    {this.description}
                  </ds-text>
                ) : null}
              </span>
            </button>
          </HeadingTag>
          <div
            class={{ 'disclosure-trailing': true, 'disclosure-trailing--empty': !this.hasTrailing }}
          >
            <slot
              name="trailing"
              onSlotchange={(event: Event) =>
                this.updateTrailing(event.currentTarget as HTMLSlotElement)
              }
            />
          </div>
        </div>
        <div
          id={this.panelId}
          class={{ 'disclosure-panel': true, 'disclosure-panel--open': this.open }}
          role="region"
          aria-labelledby={this.triggerId}
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

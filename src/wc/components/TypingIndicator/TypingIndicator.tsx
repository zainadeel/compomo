import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ds-typing-indicator',
  styleUrl: 'TypingIndicator.css',
  scoped: true,
})
export class TypingIndicator {
  /** Concise localized typing status. */
  @Prop() label: string = 'Typing...';

  render() {
    return (
      <Host role="status" aria-live="polite" aria-atomic="true">
        <ds-text as="span" variant="text-body-medium" color="secondary" shimmer>
          {this.label}
        </ds-text>
      </Host>
    );
  }
}

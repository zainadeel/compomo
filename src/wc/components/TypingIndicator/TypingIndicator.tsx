import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ds-typing-indicator',
  styleUrl: 'TypingIndicator.css',
  scoped: true,
})
export class TypingIndicator {
  /** Concise localized status text, ideally naming the participant who is typing. */
  @Prop() label: string = 'Typing…';

  render() {
    return (
      <Host role="status" aria-live="polite" aria-atomic="true">
        <ds-text as="span" variant="text-body-small" color="secondary" shimmer>
          {this.label}
        </ds-text>
      </Host>
    );
  }
}

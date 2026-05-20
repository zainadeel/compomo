import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'ds-loader',
  styleUrl: 'Loader.css',
  shadow: true,
})
export class Loader {
  /** Render size in px. Designed on a 16×16 viewBox; stroke scales proportionally. */
  @Prop() size: number = 20;
  /**
   * Accessible label for standalone usage. Wraps the spinner in a live region
   * and renders the label visually-hidden. Omit when the host element already
   * conveys busy state via aria-busy.
   */
  @Prop() label: string | undefined;

  render() {
    const px = `${this.size}px`;
    const svg = (
      <svg
        style={{ width: px, height: px }}
        viewBox="0 0 16 16"
        fill="none"
        class="spinner"
        aria-hidden="true"
      >
        <circle
          cx="8" cy="8" r="5"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-dasharray="23.6 7.9"
        />
      </svg>
    );

    if (!this.label) return svg;

    return (
      <span role="status" aria-live="polite" class="status">
        {svg}
        <span class="visually-hidden">{this.label}</span>
      </span>
    );
  }
}

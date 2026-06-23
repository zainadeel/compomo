import { Component, Prop, h } from '@stencil/core';
import { resolveCssLengthPx, TOKEN_DEFAULTS } from '../../utils';

@Component({
  tag: 'ds-loader',
  styleUrl: 'Loader.css',
  shadow: true,
})
export class Loader {
  /** Render size — number (px) or TokoMo length (`var(--dimension-iconography-md)`, etc.). */
  @Prop() size: number | string = TOKEN_DEFAULTS.iconographyMd;
  /**
   * Accessible label for standalone usage. Wraps the spinner in a live region
   * and renders the label visually-hidden. Omit when the host element already
   * conveys busy state via aria-busy.
   */
  @Prop() label: string | undefined;

  private get sizePx(): number {
    return resolveCssLengthPx(this.size, TOKEN_DEFAULTS.iconographyMd);
  }

  render() {
    const px = `${this.sizePx}px`;
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

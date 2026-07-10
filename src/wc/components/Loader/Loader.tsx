import { Component, Prop, h, Host } from '@stencil/core';
import type { IconColor, IconSize } from '../Icon/Icon';

export type LoaderSize = IconSize;
export type LoaderColor = IconColor;

@Component({
  tag: 'ds-loader',
  styleUrl: 'Loader.css',
  shadow: true,
})
export class Loader {
  /** Iconography size token. Maps to `--dimension-iconography-{size}`. Default `md` = 20 px. */
  @Prop() size: LoaderSize = 'md';
  /** Semantic foreground color token, or a raw CSS var reference. Same tokens as `ds-icon`. */
  @Prop() color: LoaderColor | undefined;
  /**
   * Accessible label for standalone usage. Wraps the spinner in a live region
   * and renders the label visually-hidden. Omit when the host element already
   * conveys busy state via aria-busy.
   */
  @Prop() label: string | undefined;

  render() {
    const isCustomColor = typeof this.color === 'string' && this.color.startsWith('var(--');

    const cls: Record<string, boolean> = {
      loader: true,
      [`loader--size-${this.size}`]: true,
      [`loader--color-${this.color}`]: !!this.color && !isCustomColor && this.color !== 'inherit',
      'loader--color-inherit': this.color === 'inherit',
    };

    const style = isCustomColor ? { color: this.color as string } : undefined;

    const spinner = (
      <span class={cls} style={style} aria-hidden="true">
        <svg class="loader__svg" viewBox="0 0 16 16" fill="none" focusable="false">
          <path
            opacity="0.1"
            d="M3 8C3 5.23858 5.23858 3 8 3V2C4.68629 2 2 4.68629 2 8C2 9.99456 2.97323 11.7618 4.47072 12.8528L5.05894 12.044C3.81102 11.1348 3 9.66213 3 8Z"
            fill="currentColor"
          />
          <path
            opacity="0.2"
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M5.05892 12.0438C5.88425 12.6451 6.90069 12.9998 7.99998 12.9998C9.66211 12.9998 11.1348 12.1888 12.0439 10.9409L12.8527 11.5291C11.7618 13.0266 9.99454 13.9998 7.99998 13.9998C6.68083 13.9998 5.46111 13.5741 4.4707 12.8526L5.05892 12.0438Z"
            fill="currentColor"
          />
          <path
            opacity="0.4"
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12.0435 10.9408C12.6447 10.1155 12.9995 9.09906 12.9995 7.99976C12.9995 7.45884 12.9136 6.93798 12.7547 6.45007L13.7057 6.14014C13.8964 6.72562 13.9995 7.35065 13.9995 7.99976C13.9995 9.31891 13.5738 10.5386 12.8523 11.529L12.0435 10.9408Z"
            fill="currentColor"
          />
          <path
            opacity="0.6"
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12.7555 6.45152C12.4263 5.43958 11.7831 4.56933 10.9409 3.95577L11.5291 3.14697C12.5398 3.88325 13.3116 4.92755 13.7067 6.14188L12.7555 6.45152Z"
            fill="currentColor"
          />
          <path
            opacity="0.8"
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10.941 3.95583C10.5307 3.65688 10.0731 3.41886 9.58154 3.25509L9.89786 2.30615C10.4877 2.50267 11.0368 2.78829 11.5293 3.14704L10.941 3.95583Z"
            fill="currentColor"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M9.89788 2.30636C9.3014 2.10762 8.66327 2 8 2V3C8.55272 3 9.0845 3.08968 9.58157 3.2553L9.89788 2.30636Z"
            fill="currentColor"
          />
        </svg>
      </span>
    );

    if (!this.label) {
      return (
        <Host style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {spinner}
        </Host>
      );
    }

    return (
      <Host style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <span role="status" aria-live="polite" class="status">
          {spinner}
          <span class="visually-hidden">{this.label}</span>
        </span>
      </Host>
    );
  }
}

import { Component, Prop, h, Host } from '@stencil/core';

export type FadeSide = 'top' | 'bottom' | 'left' | 'right';

@Component({
  tag: 'ds-fade',
  styleUrl: 'Fade.css',
  shadow: true,
})
export class Fade {
  @Prop() side!: FadeSide;
  /** Height (or width for left/right) of the fade overlay — any CSS value. */
  @Prop() height: string | undefined;
  /** Background color to fade from. Defaults to var(--color-background-secondary). */
  @Prop() background: string = 'var(--color-background-secondary)';

  render() {
    return (
      <Host
        aria-hidden="true"
        class={{
          fade: true,
          [`fade--${this.side}`]: true,
        }}
        style={{
          height: this.height,
          '--ds-fade-bg': this.background,
        } as Record<string, string>}
      />
    );
  }
}

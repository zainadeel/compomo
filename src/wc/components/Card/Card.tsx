import { Component, Prop, h, Host } from '@stencil/core';

export type CardElevation = 'flat' | 'elevated' | 'floating';
export type CardRadius = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  tag: 'ds-card',
  styleUrl: 'Card.css',
  scoped: true,
})
export class Card {
  @Prop() elevation: CardElevation = 'elevated';
  @Prop() radius: CardRadius = 'lg';

  render() {
    return (
      <Host class={{ card: true, [`elevation-${this.elevation}`]: true, [`radius-${this.radius}`]: true }}>
        <slot name="header" />
        <div class="body">
          <slot />
        </div>
        <slot name="footer" />
      </Host>
    );
  }
}

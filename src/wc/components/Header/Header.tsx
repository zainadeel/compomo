import { Component, Prop, h, Host } from '@stencil/core';

export type HeaderBackground = 'primary' | 'secondary' | 'transparent' | 'translucent';

@Component({
  tag: 'ds-header',
  styleUrl: 'Header.css',
  scoped: true,
})
export class Header {
  @Prop() heading: string | undefined;
  @Prop() background: HeaderBackground = 'secondary';

  render() {
    return (
      <Host
        class={{ header: true, [`bg-${this.background}`]: true }}
        role="banner"
      >
        <div class="left">
          <slot name="left" />
          {this.heading && <span class="title text-title-small">{this.heading}</span>}
        </div>
        <div class="center">
          <slot name="center" />
        </div>
        <div class="right">
          <slot name="right" />
        </div>
      </Host>
    );
  }
}

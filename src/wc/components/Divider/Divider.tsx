import { Component, Prop, h, Host } from '@stencil/core';

export type DividerOrientation = 'horizontal' | 'vertical';

@Component({
  tag: 'ds-divider',
  styleUrl: 'Divider.css',
  shadow: true,
})
export class Divider {
  /** Direction of the divider line. Defaults to 'horizontal'. */
  @Prop() orientation: DividerOrientation = 'horizontal';

  render() {
    return (
      <Host
        role="separator"
        aria-orientation={this.orientation}
        class={{ vertical: this.orientation === 'vertical' }}
      />
    );
  }
}

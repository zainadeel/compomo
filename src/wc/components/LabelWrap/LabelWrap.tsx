import { Component, Prop, h, Host } from '@stencil/core';

export type LabelWrapSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Internal utility wrapper that kills line-height struts and adds optical
 * horizontal padding. Used inside interactive components (Button, Tag, etc.)
 *
 * Not intended as a standalone consumer-facing component — internal use only.
 */
@Component({
  tag: 'ds-label-wrap',
  styleUrl: 'LabelWrap.css',
  scoped: true,
})
export class LabelWrap {
  /** Typography size — controls optical horizontal padding. */
  @Prop() size: LabelWrapSize = 'md';

  /** Enable truncation with ellipsis — use inside full-width containers. */
  @Prop() truncate: boolean = false;

  render() {
    return (
      <Host
        class={{
          'label-wrap': true,
          'size-xs': this.size === 'xs',
          'size-sm': this.size === 'sm',
          'size-lg': this.size === 'lg',
          truncate: this.truncate,
        }}
      >
        <slot />
      </Host>
    );
  }
}

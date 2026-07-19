import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ds-avatar',
  styleUrl: 'Avatar.css',
  scoped: true,
})
export class Avatar {
  /** Canonical IcoMo icon name displayed inside the avatar. */
  @Prop() icon: string = '';

  /** Optional accessible label. Omit when the surrounding content already conveys the meaning. */
  @Prop() label: string | undefined;

  render() {
    return (
      <Host>
        <span
          class="avatar"
          role={this.label ? 'img' : 'presentation'}
          aria-label={this.label}
          aria-hidden={!this.label ? 'true' : undefined}
        >
          <ds-icon name={this.icon} size="md" color="secondary" />
        </span>
      </Host>
    );
  }
}

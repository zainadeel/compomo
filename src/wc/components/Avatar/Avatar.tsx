import { Component, h, Host, Prop } from '@stencil/core';
import type { IconColor } from '../Icon/Icon';

export type AvatarSize = 'md' | 'sm' | 'xs';

@Component({
  tag: 'ds-avatar',
  styleUrl: 'Avatar.css',
  scoped: true,
})
export class Avatar {
  /** Canonical IcoMo icon name displayed inside the avatar. */
  @Prop() icon: string = '';

  /** Semantic icon hierarchy. Use primary for stronger emphasis; secondary is the default. */
  @Prop() iconColor: IconColor = 'secondary';

  /** Circle and icon density. Maps to 32/20, 24/16, or 16/12 px. */
  @Prop() size: AvatarSize = 'md';

  /** Optional accessible label. Omit when the surrounding content already conveys the meaning. */
  @Prop() label: string | undefined;

  render() {
    return (
      <Host class={{ [`ds-control--${this.size}`]: true, [`avatar--${this.size}`]: true }}>
        <span
          class="avatar"
          role={this.label ? 'img' : 'presentation'}
          aria-label={this.label}
          aria-hidden={!this.label ? 'true' : undefined}
        >
          <ds-icon name={this.icon} size={this.size} color={this.iconColor} />
        </span>
      </Host>
    );
  }
}

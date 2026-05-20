import { Component, Prop, h, Host } from '@stencil/core';

@Component({
  tag: 'ds-badge',
  styleUrl: 'Badge.css',
  scoped: true,
})
export class Badge {
  @Prop() count: number = 0;
  @Prop() isSelected: boolean = false;
  /** Accessible label. Defaults to the count as a string. */
  @Prop() label: string | undefined;

  render() {
    if (this.count === 0) return <Host style={{ display: 'none' }} />;

    const display = this.count > 9 ? '+' : String(this.count);
    const ariaLabel = this.label ?? String(this.count);

    return (
      <Host class="badge" aria-label={ariaLabel}>
        <span
          class={{
            'text-caption-emphasis': true,
            'badge__text': true,
            'badge__text--selected': this.isSelected,
          }}
        >
          {display}
        </span>
      </Host>
    );
  }
}

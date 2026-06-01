import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

export type ButtonGroupElevation = 'none' | 'flat' | 'elevated' | 'floating';
export type ButtonGroupSize      = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonGroupItem {
  label?: string;
  /** Icon name for <ds-icon>. Set via JS property. */
  icon?: string;
  variant?: 'primary' | 'secondary';
  intent?: 'none' | 'neutral' | 'brand' | 'negative' | 'warning' | 'positive';
  inactive?: boolean;
  href?: string;
}

@Component({
  tag: 'ds-button-group',
  styleUrl: 'ButtonGroup.css',
  scoped: true,
})
export class ButtonGroup {
  /**
   * Array of button descriptors. Set via JS property.
   * @example el.items = [{ label: 'Filter', icon: 'Filter' }, { label: 'Sort' }];
   */
  @Prop() items: ButtonGroupItem[] = [];

  /** Chrome level for the group container. */
  @Prop() elevation: ButtonGroupElevation = 'flat';

  /** Size passed to each ds-button. */
  @Prop() size: ButtonGroupSize = 'md';

  /** Pill shape for group + buttons. */
  @Prop() rounded: boolean = false;

  /** Emits the index of the clicked item. */
  @Event() dsClick!: EventEmitter<number>;

  render() {
    const items = this.items;
    const count = items.length;
    const elev = this.elevation;
    const elevKey = elev.charAt(0).toUpperCase() + elev.slice(1);
    const isGhost = elev === 'none';

    const groupCls: Record<string, boolean> = {
      group: true,
      [`group${elevKey}`]: true,
      groupRounded: this.rounded,
    };

    return (
      <Host>
        <div class={groupCls} role="group">
          {items.map((item, i) => {
            const isFirst = i === 0;
            const isLast = i === count - 1;
            const isMid = !isFirst && !isLast;
            const variant = item.variant ?? 'secondary';
            const isIconOnly = !!item.icon && !item.label;
            const needsRoundedCorrection = this.rounded && !isIconOnly && this.size !== 'xs';
            const sizeKey = this.size.toUpperCase() as 'MD' | 'SM' | 'LG' | 'XS';

            const itemCls: Record<string, boolean> = {
              item: true,
              first: isFirst,
              last: isLast,
              middle: isMid,
              itemShort: isGhost && variant === 'secondary',
              [`roundedFirst${sizeKey}`]: !!(needsRoundedCorrection && isFirst),
              [`roundedLast${sizeKey}`]: !!(needsRoundedCorrection && isLast),
              [`roundedMid${sizeKey}`]: !!(needsRoundedCorrection && isMid),
            };

            const dividerCls: Record<string, boolean> = {
              divider: true,
              dividerGhost: isGhost,
              dividerGhostXS: isGhost && this.size === 'xs',
              dividerGhostSM: isGhost && this.size === 'sm',
              dividerGhostLG: isGhost && this.size === 'lg',
            };

            return [
              i > 0 && (
                <div class={dividerCls} aria-hidden="true" />
              ),
              <ds-button
                class={itemCls}
                variant={variant}
                intent={item.intent ?? 'none'}
                elevation={elev}
                size={this.size}
                label={item.label}
                rounded={this.rounded}
                inactive={item.inactive}
                href={item.href}
                onDsClick={() => this.dsClick.emit(i)}
              >
                {item.icon && (
                  <ds-icon slot="icon" name={item.icon} />
                )}
              </ds-button>,
            ];
          })}
        </div>
      </Host>
    );
  }
}

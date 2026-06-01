import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

export type ToggleGroupElevation  = 'none' | 'flat' | 'elevated' | 'floating';
export type ToggleGroupSize       = 'md' | 'sm' | 'xs';
export type ToggleGroupBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

export interface ToggleGroupItem {
  id: string;
  label?: string;
  /** Icon name for <ds-icon>. */
  icon?: string;
  inactive?: boolean;
}

@Component({
  tag: 'ds-toggle-button-group',
  styleUrl: 'ToggleButtonGroup.css',
  scoped: true,
})
export class ToggleButtonGroup {
  /**
   * Array of item descriptors. Set via JS property.
   * @example el.items = [{ id: 'list', label: 'List' }, { id: 'grid', icon: 'GridView' }];
   */
  @Prop() items: ToggleGroupItem[] = [];

  /** ID of the currently selected / pressed item. */
  @Prop({ mutable: true }) value: string = '';

  /** Chrome level for the group container. */
  @Prop() elevation: ToggleGroupElevation = 'elevated';

  /** Size passed to each ds-toggle-button. */
  @Prop() size: ToggleGroupSize = 'md';

  /** Pill shape for group + buttons. */
  @Prop() rounded: boolean = false;

  /** Parent surface context. */
  @Prop() background: ToggleGroupBackground | undefined;

  /** Emits the id of the newly selected item. */
  @Event() dsChange!: EventEmitter<string>;

  private handleItemChange(id: string) {
    if (id === this.value) return;
    this.value = id;
    this.dsChange.emit(id);
  }

  render() {
    const items = this.items;
    const count = items.length;
    const elev = this.elevation;
    const elevKey = elev.charAt(0).toUpperCase() + elev.slice(1);
    const bg = this.background;
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
            const isPressed = item.id === this.value;
            const isIconOnly = !!item.icon && !item.label;
            const needsRoundedCorrection = this.rounded && !isIconOnly && this.size !== 'xs';
            const sizeKey = this.size.toUpperCase() as 'MD' | 'SM' | 'XS';

            const itemCls: Record<string, boolean> = {
              item: true,
              first: isFirst,
              last: isLast,
              middle: isMid,
              itemShort: isGhost,
              itemPressed: isGhost && isPressed,
              [`roundedFirst${sizeKey}`]: !!(needsRoundedCorrection && isFirst),
              [`roundedLast${sizeKey}`]: !!(needsRoundedCorrection && isLast),
              [`roundedMid${sizeKey}`]: !!(needsRoundedCorrection && isMid),
            };

            const dividerCls: Record<string, boolean> = {
              divider: true,
              dividerGhost: isGhost,
              dividerGhostXS: isGhost && this.size === 'xs',
              dividerGhostSM: isGhost && this.size === 'sm',
            };

            return [
              i > 0 && (
                <div class={dividerCls} aria-hidden="true" />
              ),
              <ds-toggle-button
                class={itemCls}
                elevation={elev}
                size={this.size}
                label={item.label}
                icon={item.icon}
                rounded={this.rounded}
                background={bg}
                pressed={isPressed}
                inactive={item.inactive}
                onDsChange={() => this.handleItemChange(item.id)}
              />,
            ];
          })}
        </div>
      </Host>
    );
  }
}

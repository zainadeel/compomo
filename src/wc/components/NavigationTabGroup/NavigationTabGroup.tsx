import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import type { TabGroupSize, TabGroupWidth } from '../TabGroup/TabGroup';
import type { TabGroupItem } from '../TabGroup/tab-item-utils';

@Component({ tag: 'ds-navigation-tab-group', styleUrl: 'NavigationTabGroup.css', scoped: true })
export class NavigationTabGroup {
  /** Currently selected local view. User activation updates this value. */
  @Prop({ mutable: true }) value: string = '';
  @Prop() tabs: TabGroupItem[] = [];
  @Prop() size: TabGroupSize = 'md';
  @Prop() width: TabGroupWidth = 'hug';
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;

  @Event() dsChange!: EventEmitter<string>;

  private handleChange = (event: CustomEvent<string>) => {
    event.stopPropagation();
    this.value = event.detail;
    this.dsChange.emit(event.detail);
  };

  render() {
    return (
      <Host>
        <ds-tab-group
          tabs={this.tabs}
          value={this.value}
          size={this.size}
          width={this.width}
          presentation="navigation"
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
          onDsChange={this.handleChange}
        />
      </Host>
    );
  }
}

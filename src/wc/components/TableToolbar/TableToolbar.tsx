import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ds-table-toolbar',
  styleUrl: 'TableToolbar.css',
  scoped: true,
})
export class TableToolbar {
  /** Accessible name for the grouped table controls. */
  @Prop() label: string = 'Table controls';

  render() {
    return (
      <Host>
        <div class="table-toolbar" role="toolbar" aria-label={this.label}>
          <div class="table-toolbar__leading">
            <slot name="leading" />
          </div>
          <div class="table-toolbar__trailing">
            <slot name="trailing" />
          </div>
        </div>
      </Host>
    );
  }
}

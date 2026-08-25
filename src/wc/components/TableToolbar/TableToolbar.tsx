import { Component, Element, h, Host, Prop } from '@stencil/core';

const CAPTION_CONTROL_SELECTOR = 'ds-filter-menu, ds-select';

@Component({
  tag: 'ds-table-toolbar',
  styleUrl: 'TableToolbar.css',
  scoped: true,
})
export class TableToolbar {
  @Element() private el!: HTMLElement;

  /** Accessible name for the grouped table controls. */
  @Prop() label: string = 'Table controls';

  private captionControlObserver: MutationObserver | undefined;

  componentDidLoad(): void {
    this.connectCaptionControlObserver();
  }

  disconnectedCallback(): void {
    this.captionControlObserver?.disconnect();
  }

  render() {
    return (
      <Host>
        <div class="table-toolbar" role="toolbar" aria-label={this.label}>
          <div class="table-toolbar__start">
            <slot name="start" />
          </div>
          <ds-divider class="table-toolbar__rule" orientation="vertical" length="32px" />
          <div class="table-toolbar__main">
            <div class="table-toolbar__search">
              <slot name="search" />
            </div>
            <div class="table-toolbar__leading">
              <slot name="leading" />
            </div>
            <div class="table-toolbar__trailing">
              <slot name="trailing" />
            </div>
          </div>
        </div>
      </Host>
    );
  }

  private connectCaptionControlObserver(): void {
    if (this.captionControlObserver || typeof MutationObserver === 'undefined') return;
    this.captionControlObserver = new MutationObserver(this.syncCaptionControls);
    this.captionControlObserver.observe(this.el, { childList: true, subtree: true });
    this.syncCaptionControls();
  }

  private syncCaptionControls = () => {
    for (const control of this.el.querySelectorAll<
      HTMLElement & { collapseLabel?: boolean }
    >(CAPTION_CONTROL_SELECTOR)) {
      if (control.closest('ds-table-saved-views')) continue;
      if (control.collapseLabel) continue;
      control.collapseLabel = true;
    }
  };
}

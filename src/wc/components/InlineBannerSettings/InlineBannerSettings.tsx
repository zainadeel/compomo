import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ds-inline-banner-settings',
  styleUrl: 'InlineBannerSettings.css',
  scoped: true,
})
export class InlineBannerSettings {
  /** Authored informational copy rendered without transformation. */
  @Prop() description!: string;

  render() {
    return (
      <Host>
        {/* eslint-disable-next-line compomo/prefer-direct-ds-text -- This structural layer owns the banner's inner padding separately from the ds-text balance padding. */}
        <div class="inline-banner-settings__content">
          <ds-text
            class="inline-banner-settings__description"
            as="p"
            variant="text-body-small"
            color="secondary"
          >
            {this.description}
          </ds-text>
        </div>
      </Host>
    );
  }
}

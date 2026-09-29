import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'ds-inline-banner-settings',
  styleUrl: 'InlineBannerSettings.css',
  scoped: true,
})
export class InlineBannerSettings {
  /** Authored informational copy rendered without transformation. */
  @Prop() description!: string;
  /** Keep the informational row footprint while its copy is loading. */
  @Prop() isLoading: boolean = false;

  render() {
    return (
      <Host aria-busy={this.isLoading ? 'true' : undefined}>
        <div class="inline-banner-settings__content">
          <ds-skeleton preserveLayout isLoading={this.isLoading} textVariant="text-body-small">
            <ds-text
              class="inline-banner-settings__description"
              as="p"
              variant="text-body-small"
              color="secondary"
            >
              {this.description}
            </ds-text>
          </ds-skeleton>
        </div>
      </Host>
    );
  }
}

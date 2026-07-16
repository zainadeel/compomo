import { Component, Prop, h, Host } from '@stencil/core';

@Component({
  tag: 'ds-empty-state',
  styleUrl: 'EmptyState.css',
  scoped: true,
})
export class EmptyState {
  /** Optional decorative prefix glyph for the complete icon + title + body variant. */
  @Prop() icon: string | undefined;
  /** Optional visual title. Use with body; required when icon is provided. */
  @Prop() heading: string | undefined;
  /** Explanatory empty-state copy. Every supported variant includes body text. */
  @Prop() body: string = '';

  render() {
    const showHeading = Boolean(this.heading?.trim());
    const showIcon = showHeading && Boolean(this.icon);

    return (
      <Host>
        <div class="empty-state">
          {showIcon && (
            <ds-icon
              class="empty-state__icon"
              name={this.icon}
              size="xl"
              color="primary"
            />
          )}
          <div class="empty-state__text">
            {showHeading && (
              <ds-text
                class="empty-state__title"
                as="div"
                variant="text-title-small"
                color="primary"
                align="center"
              >
                {this.heading}
              </ds-text>
            )}
            {this.body && (
              <ds-text
                class="empty-state__body"
                as="p"
                variant="text-body-medium"
                color="secondary"
                align="center"
              >
                {this.body}
              </ds-text>
            )}
          </div>
        </div>
      </Host>
    );
  }
}

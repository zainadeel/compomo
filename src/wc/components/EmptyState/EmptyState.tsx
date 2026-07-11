import { Component, Prop, h, Host } from '@stencil/core';

export type EmptyStateType = 'no-content' | 'no-results' | 'no-results-filter' | 'no-access';

const DEFAULT_MESSAGES: Record<EmptyStateType, string> = {
  'no-content': 'No page contents to display.',
  'no-results': 'No results found.',
  'no-results-filter': 'No results found. Please update search criteria.',
  'no-access': "You don't have access to this page.",
};

@Component({
  tag: 'ds-empty-state',
  styleUrl: 'EmptyState.css',
  scoped: true,
})
export class EmptyState {
  @Prop() type: EmptyStateType = 'no-content';
  @Prop() message: string | undefined;
  /** Localized defaults keyed by empty-state type. Set as a JS property. */
  @Prop() messages: Partial<Record<EmptyStateType, string>> = {};

  render() {
    return (
      <Host>
        <ds-text class="empty-state" as="p" variant="text-body-medium" color="secondary">
          {this.message || this.messages[this.type] || DEFAULT_MESSAGES[this.type]}
        </ds-text>
      </Host>
    );
  }
}

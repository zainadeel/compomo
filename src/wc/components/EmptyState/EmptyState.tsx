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

  render() {
    return (
      <Host>
        <div class="empty-state">
          <ds-text as="p" variant="text-body-medium" color="secondary">
            {this.message || DEFAULT_MESSAGES[this.type]}
          </ds-text>
        </div>
      </Host>
    );
  }
}

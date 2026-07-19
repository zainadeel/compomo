import { Component, h, Host, Prop } from '@stencil/core';

let sectionId = 0;

@Component({
  tag: 'ds-conversation-list-section',
  styleUrl: 'ConversationListSection.css',
  scoped: true,
})
export class ConversationListSection {
  /** Visible section heading. */
  @Prop() heading: string = '';
  /** Optional stable id used for the section heading. */
  @Prop() sectionId: string = '';

  private readonly generatedId = `ds-conversation-section-${++sectionId}`;

  render() {
    const headingId = this.sectionId || this.generatedId;
    return (
      <Host>
        <section class="conversation-list-section" aria-labelledby={headingId}>
          <ds-text
            class="conversation-list-section__heading"
            textId={headingId}
            as="h3"
            variant="text-caption"
            emphasis
            color="secondary"
          >
            {this.heading}
          </ds-text>
          <div class="conversation-list-section__items" role="list">
            <slot />
          </div>
        </section>
      </Host>
    );
  }
}

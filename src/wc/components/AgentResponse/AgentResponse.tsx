import { Component, Prop, h, Host } from '@stencil/core';
import type {
  AgentResponseRenderMode,
  AgentResponsePart,
  MessageMetadataVisibility,
} from '../conversation-types';

@Component({ tag: 'ds-agent-response', styleUrl: 'AgentResponse.css', scoped: true })
export class AgentResponse {
  @Prop() messageId: string = '';
  @Prop() author: string = '';
  @Prop() showAuthor: boolean = true;
  @Prop() timestamp: string = '';
  @Prop() parts: AgentResponsePart[] = [];
  /** Renders serializable ordered parts or lets the default slot own the complete ordered body. */
  @Prop() renderMode: AgentResponseRenderMode = 'parts';
  @Prop() streaming: boolean = false;
  /** Controls whether the complete message metadata footer is persistent or revealed through hover/focus. */
  @Prop() metadataVisibility: MessageMetadataVisibility = 'always';

  private renderPart(part: AgentResponsePart) {
    switch (part.type) {
      case 'markdown':
        return (
          <ds-markdown
            key={part.id}
            content={part.content}
            streaming={part.state === 'streaming'}
          />
        );
      case 'activity':
        return <ds-agent-activity key={part.id} items={part.items} />;
      case 'tool':
        return (
          <ds-agent-tool-call
            key={part.id}
            name={part.name}
            label={part.label}
            state={part.state}
            input={part.input}
            output={part.output}
            error={part.error}
          />
        );
      case 'attachments':
        return <ds-attachment-list key={part.id} items={part.items} />;
      case 'sources':
        return <ds-agent-source-list key={part.id} items={part.items} />;
      case 'questionnaire':
        return (
          <ds-agent-questionnaire
            key={part.id}
            requestId={part.requestId}
            questions={part.questions}
            answers={part.answers}
            status="answered"
          />
        );
    }
  }

  render() {
    return (
      <Host>
        <ds-message
          messageId={this.messageId}
          direction="incoming"
          author={this.author}
          showAuthor={this.showAuthor}
          timestamp={this.timestamp}
          streaming={this.streaming}
          metadataVisibility={this.metadataVisibility}
        >
          <div class="agent-response">
            {this.renderMode === 'composed' ? (
              <slot />
            ) : (
              this.parts.map(part => this.renderPart(part))
            )}
          </div>
          <slot name="footer" slot="footer" />
          <slot name="metadata-actions" slot="metadata-actions" />
          <slot name="actions" slot="actions" />
        </ds-message>
      </Host>
    );
  }
}

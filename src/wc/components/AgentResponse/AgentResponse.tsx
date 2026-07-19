import { Component, Prop, h, Host } from '@stencil/core';
import type { AgentResponsePart } from '../conversation-types';

@Component({ tag: 'ds-agent-response', styleUrl: 'AgentResponse.css', scoped: true })
export class AgentResponse {
  @Prop() messageId: string = '';
  @Prop() author: string = '';
  @Prop() showAuthor: boolean = true;
  @Prop() timestamp: string = '';
  @Prop() parts: AgentResponsePart[] = [];
  @Prop() streaming: boolean = false;

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
        >
          <slot name="avatar" slot="avatar" />
          <ds-message-bubble variant="ghost">
            <div class="agent-response">{this.parts.map(part => this.renderPart(part))}</div>
          </ds-message-bubble>
          <slot name="footer" slot="footer" />
          <slot name="actions" slot="actions" />
        </ds-message>
      </Host>
    );
  }
}

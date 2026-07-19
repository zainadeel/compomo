import { Component, Prop, h, Host } from '@stencil/core';
import type { AgentSource } from '../conversation-types';

@Component({ tag: 'ds-agent-source-list', styleUrl: 'AgentSourceList.css', scoped: true })
export class AgentSourceList {
  @Prop() items: AgentSource[] = [];
  @Prop() heading: string = 'Sources';
  @Prop() open: boolean = false;

  private safeUrl(value: string) {
    try {
      const parsed = new URL(value, document.baseURI);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : undefined;
    } catch { return undefined; }
  }

  render() {
    if (!this.items.length) return null;
    return (
      <Host>
        <details class="agent-sources" open={this.open}>
          <summary>
            <ds-icon name="ChevronRight" size="xs" color="inherit" />
            <ds-text variant="text-body-small" emphasis>{this.heading} · {this.items.length}</ds-text>
          </summary>
          <ol>
            {this.items.map(source => {
              const href = this.safeUrl(source.url);
              return <li>
                {href
                  ? <a href={href} target="_blank" rel="noopener noreferrer"><ds-text variant="text-body-small" emphasis>{source.title}</ds-text><ds-icon name="ExternalLink" size="xs" color="inherit" /></a>
                  : <ds-text variant="text-body-small" emphasis>{source.title}</ds-text>}
                {source.description ? <ds-text variant="text-caption" color="secondary">{source.description}</ds-text> : null}
              </li>;
            })}
          </ol>
        </details>
      </Host>
    );
  }
}

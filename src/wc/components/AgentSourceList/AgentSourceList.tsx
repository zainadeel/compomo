import { Component, Event, EventEmitter, Prop, h, Host } from '@stencil/core';
import { resolveSafeUrl } from '../../utils';
import type { AgentSource } from '../conversation-types';

@Component({ tag: 'ds-agent-source-list', styleUrl: 'AgentSourceList.css', scoped: true })
export class AgentSourceList {
  @Prop() items: AgentSource[] = [];
  @Prop() heading: string = 'Sources';
  @Prop() open: boolean = false;

  @Event() dsOpenChange!: EventEmitter<{ open: boolean }>;

  private hostname(href: string): string {
    try {
      return new URL(href).hostname;
    } catch {
      return '';
    }
  }

  render() {
    if (!this.items.length) return null;
    return (
      <Host>
        <details
          class="agent-sources"
          open={this.open}
          onToggle={(event: Event) =>
            this.dsOpenChange.emit({
              open: (event.currentTarget as HTMLDetailsElement).open,
            })
          }
        >
          <summary>
            <ds-icon name="ChevronRight" size="xs" color="inherit" />
            <ds-text variant="text-body-small" emphasis>{this.heading} · {this.items.length}</ds-text>
          </summary>
          <ol>
            {this.items.map(source => {
              const href = resolveSafeUrl(source.url);
              const hostname = href ? this.hostname(href) : '';
              return <li>
                {href
                  ? <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${source.title} (${hostname}, opens in a new tab)`}
                    ><ds-text variant="text-body-small" emphasis>{source.title}</ds-text><ds-icon name="ExternalLink" size="xs" color="inherit" /></a>
                  : <ds-text variant="text-body-small" emphasis>{source.title}</ds-text>}
                {hostname ? <ds-text variant="text-caption" color="secondary">{hostname}</ds-text> : null}
                {source.description ? <ds-text variant="text-body-small" color="secondary">{source.description}</ds-text> : null}
              </li>;
            })}
          </ol>
        </details>
      </Host>
    );
  }
}

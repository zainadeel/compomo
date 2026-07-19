import { Component, Prop, h, Host } from '@stencil/core';
import type { AgentToolState } from '../conversation-types';

@Component({ tag: 'ds-agent-tool-call', styleUrl: 'AgentToolCall.css', scoped: true })
export class AgentToolCall {
  @Prop() name: string = '';
  @Prop() label: string = '';
  @Prop() state: AgentToolState = 'queued';
  @Prop() input?: unknown;
  @Prop() output?: unknown;
  @Prop() error?: string;
  @Prop() open: boolean = false;

  private serialize(value: unknown) {
    if (value === undefined) return '';
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  }

  render() {
    const active = this.state === 'queued' || this.state === 'running';
    const status = this.state.charAt(0).toUpperCase() + this.state.slice(1);
    return (
      <Host>
        <details class={`agent-tool agent-tool--${this.state}`} open={this.open}>
          <summary>
            <span class="agent-tool__status" aria-hidden="true">
              {active ? <ds-loader size="xs" color="inherit" /> : <ds-icon name={this.state === 'success' ? 'Check' : 'ErrorTriangle'} size="xs" color="inherit" />}
            </span>
            <span class="agent-tool__title">
              <ds-text variant="text-body-small" emphasis>{this.label || this.name}</ds-text>
              <ds-text variant="text-caption" color="secondary">{status}</ds-text>
            </span>
            <ds-icon class="agent-tool__chevron" name="ChevronRight" size="xs" color="inherit" />
          </summary>
          <div class="agent-tool__details">
            {this.input !== undefined ? <section><ds-text variant="text-caption" emphasis>Input</ds-text><pre>{this.serialize(this.input)}</pre></section> : null}
            {this.output !== undefined ? <section><ds-text variant="text-caption" emphasis>Output</ds-text><pre>{this.serialize(this.output)}</pre></section> : null}
            {this.error ? <section><ds-text variant="text-caption" emphasis>Error</ds-text><pre>{this.error}</pre></section> : null}
          </div>
        </details>
      </Host>
    );
  }
}

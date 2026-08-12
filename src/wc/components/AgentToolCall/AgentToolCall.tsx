import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
} from '@stencil/core';
import type { AgentToolState } from '../conversation-types';

const STATUS_LABELS: Record<AgentToolState, string> = {
  preparing: 'Preparing',
  queued: 'Queued',
  running: 'Running',
  'waiting-for-user': 'Waiting for your response',
  success: 'Completed',
  error: 'Failed',
  denied: 'Permission denied',
  canceled: 'Canceled',
};

@Component({ tag: 'ds-agent-tool-call', styleUrl: 'AgentToolCall.css', scoped: true })
export class AgentToolCall {
  @Element() el!: HTMLElement;

  @Prop() name: string = '';
  @Prop() label: string = '';
  @Prop() state: AgentToolState = 'queued';
  @Prop() statusLabel?: string;
  @Prop() input?: unknown;
  @Prop() output?: unknown;
  @Prop() error?: string;
  @Prop() open: boolean = false;

  @Event() dsOpenChange!: EventEmitter<{ open: boolean }>;

  @State() private hasSummary = false;
  @State() private hasResult = false;
  @State() private hasPlainTextResult = false;
  @State() private hasDetails = false;

  private slotObserver?: MutationObserver;

  componentWillLoad() {
    this.syncSlots();
  }

  componentDidLoad() {
    this.syncSlots();
    this.slotObserver = new MutationObserver(() => this.syncSlots());
    this.slotObserver.observe(this.el, {
      childList: true,
      subtree: false,
      attributes: true,
      attributeFilter: ['slot'],
    });
  }

  disconnectedCallback() {
    this.slotObserver?.disconnect();
  }

  private syncSlots() {
    this.hasSummary = Boolean(this.el.querySelector('[slot="summary"]'));
    const result = this.el.querySelector<HTMLElement>('[slot="result"]');
    this.hasResult = Boolean(result);
    this.hasPlainTextResult = Boolean(
      result && result.childElementCount === 0 && result.textContent?.trim(),
    );
    this.hasDetails = Boolean(this.el.querySelector('[slot="details"]'));
  }

  private serialize(value: unknown) {
    if (value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private get active(): boolean {
    return ['preparing', 'queued', 'running'].includes(this.state);
  }

  private get expandable(): boolean {
    return (
      this.hasDetails ||
      this.input !== undefined ||
      this.output !== undefined ||
      Boolean(this.error)
    );
  }

  private renderStatusIcon() {
    if (this.active) return <ds-loader size="xs" color="inherit" />;
    if (this.state === 'success') {
      return <ds-icon name="Check" size="xs" color="inherit" />;
    }
    if (this.state === 'waiting-for-user') {
      return <ds-icon name="Clock" size="xs" color="inherit" />;
    }
    return <ds-icon name="ErrorTriangle" size="xs" color="inherit" />;
  }

  private renderSummary(expandable: boolean) {
    return (
      <span class="agent-tool__summary-content">
        <span class="agent-tool__status-icon" aria-hidden="true">
          {this.renderStatusIcon()}
        </span>
        <span class="agent-tool__title">
          {this.hasSummary ? (
            <slot name="summary" />
          ) : (
            <ds-text as="span" variant="text-body-small" emphasis>
              {this.label || this.name}
            </ds-text>
          )}
          <ds-text
            class="agent-tool__state-label"
            as="span"
            variant="text-caption"
            color={['error', 'denied'].includes(this.state) ? 'negative' : 'secondary'}
          >
            {this.statusLabel ?? STATUS_LABELS[this.state]}
          </ds-text>
        </span>
        {expandable ? (
          <ds-icon
            class="agent-tool__chevron"
            name="ChevronRight"
            size="xs"
            color="inherit"
          />
        ) : null}
      </span>
    );
  }

  private renderGenericDetails() {
    return (
      <div class="agent-tool__diagnostics">
        {this.input !== undefined ? (
          <section>
            <ds-text variant="text-caption" emphasis>Input</ds-text>
            <pre>{this.serialize(this.input)}</pre>
          </section>
        ) : null}
        {this.output !== undefined ? (
          <section>
            <ds-text variant="text-caption" emphasis>Output</ds-text>
            <pre>{this.serialize(this.output)}</pre>
          </section>
        ) : null}
        {this.error ? (
          <section>
            <ds-text variant="text-caption" emphasis>Error</ds-text>
            <pre>{this.error}</pre>
          </section>
        ) : null}
      </div>
    );
  }

  private handleToggle = (event: Event) => {
    this.dsOpenChange.emit({ open: (event.currentTarget as HTMLDetailsElement).open });
  };

  render() {
    const expandable = this.expandable;
    return (
      <Host>
        <div class={`agent-tool agent-tool--${this.state}`}>
          {expandable ? (
            <details open={this.open} onToggle={this.handleToggle}>
              <summary>{this.renderSummary(true)}</summary>
              <div class="agent-tool__details">
                {this.hasDetails ? <slot name="details" /> : this.renderGenericDetails()}
              </div>
            </details>
          ) : (
            <div class="agent-tool__row">{this.renderSummary(false)}</div>
          )}
          {this.hasResult ? (
            <div
              class={{
                'agent-tool__result': true,
                'agent-tool__result--plain-text': this.hasPlainTextResult,
              }}
            >
              <slot name="result" />
            </div>
          ) : null}
        </div>
      </Host>
    );
  }
}

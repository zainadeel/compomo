import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { ClipboardFeedbackController } from '../../utils/clipboard';

@Component({
  tag: 'ds-code-block',
  styleUrls: ['../../utils/focus-ring.css', 'CodeBlock.css'],
  scoped: true,
})
export class CodeBlock {
  @Prop() code: string = '';
  @Prop() language: string = '';
  @Prop() filename: string = '';

  @State() private copied: boolean = false;
  @State() private scrollable = false;
  private viewport?: HTMLPreElement;
  private content?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private readonly copyFeedback = new ClipboardFeedbackController(copied => {
    this.copied = copied;
  });

  connectedCallback() {
    this.copyFeedback.connect();
    this.observeOverflow();
  }

  componentDidLoad() {
    this.observeOverflow();
  }

  componentDidRender() {
    this.syncOverflow();
  }

  private observeOverflow() {
    if (!this.viewport?.isConnected || !this.content) return;
    this.resizeObserver ??= new ResizeObserver(this.syncOverflow);
    this.resizeObserver.observe(this.viewport);
    this.resizeObserver.observe(this.content);
    this.syncOverflow();
  }

  private syncOverflow = () => {
    const viewport = this.viewport;
    if (!viewport?.isConnected) return;
    this.scrollable =
      viewport.scrollWidth > viewport.clientWidth || viewport.scrollHeight > viewport.clientHeight;
  };

  @Watch('code')
  handleCodeChange() {
    this.copyFeedback.reset();
  }

  disconnectedCallback() {
    this.copyFeedback.disconnect();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  private copy = async () => {
    await this.copyFeedback.copy(this.code);
  };

  render() {
    const label = this.filename || this.language || 'Code';
    return (
      <Host>
        <figure class="code-block">
          <figcaption class="code-block__header">
            <ds-text as="span" variant="text-caption" emphasis color="on-strong">
              {label}
            </ds-text>
            <ds-tooltip label={this.copied ? 'Copied' : 'Copy code'} side="bottom" size="sm">
              <ds-button-unfilled
                variant="icon"
                icon={this.copied ? 'Check' : 'Copy'}
                size="xs"
                aria-label={this.copied ? 'Copied' : 'Copy code'}
                hasBorder={false}
                onDsClick={this.copy}
              />
            </ds-tooltip>
          </figcaption>
          <pre
            class="ds-focus-ring"
            ref={element => {
              this.viewport = element;
            }}
            tabIndex={this.scrollable ? 0 : undefined}
            role={this.scrollable ? 'region' : undefined}
            aria-label={this.scrollable ? label : undefined}
          >
            <code
              ref={element => {
                this.content = element;
              }}
            >
              {this.code}
            </code>
          </pre>
        </figure>
      </Host>
    );
  }
}

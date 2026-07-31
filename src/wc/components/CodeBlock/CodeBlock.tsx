import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { ClipboardFeedbackController } from '../../utils/clipboard';

@Component({
  tag: 'ds-code-block',
  styleUrl: 'CodeBlock.css',
  scoped: true,
})
export class CodeBlock {
  @Prop() code: string = '';
  @Prop() language: string = '';
  @Prop() filename: string = '';

  @State() private copied: boolean = false;
  private readonly copyFeedback = new ClipboardFeedbackController(copied => {
    this.copied = copied;
  });

  connectedCallback() {
    this.copyFeedback.connect();
  }

  @Watch('code')
  handleCodeChange() {
    this.copyFeedback.reset();
  }

  disconnectedCallback() {
    this.copyFeedback.disconnect();
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
          <pre>
            <code>{this.code}</code>
          </pre>
        </figure>
      </Host>
    );
  }
}

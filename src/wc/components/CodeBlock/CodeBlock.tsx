import { Component, h, Host, Prop, State } from '@stencil/core';

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
  private copiedTimer?: ReturnType<typeof setTimeout>;

  disconnectedCallback() {
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
  }

  private copy = async () => {
    if (!navigator.clipboard || !this.code) return;
    await navigator.clipboard.writeText(this.code);
    this.copied = true;
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => {
      this.copied = false;
    }, 2000);
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
            <ds-button-unfilled
              variant="icon"
              icon={this.copied ? 'Check' : 'Copy'}
              size="xs"
              aria-label={this.copied ? 'Copied' : 'Copy code'}
              hasBorder={false}
              onDsClick={this.copy}
            />
          </figcaption>
          <pre>
            <code>{this.code}</code>
          </pre>
        </figure>
      </Host>
    );
  }
}

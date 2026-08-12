import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  Watch,
} from '@stencil/core';
import type { ButtonFilledIntent } from '../ButtonFilled/ButtonFilled';
import type { MessageComposerStatus } from '../conversation-types';

@Component({
  tag: 'ds-message-composer',
  styleUrl: 'MessageComposer.css',
  scoped: true,
})
export class MessageComposer {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) value: string = '';
  @Prop() placeholder: string = 'Write a message';
  @Prop() label: string = 'Message';
  @Prop() status: MessageComposerStatus = 'ready';
  @Prop() isInactive: boolean = false;
  @Prop() submitIntent: ButtonFilledIntent = 'brand';

  @Event() dsInput!: EventEmitter<string>;
  @Event() dsSubmit!: EventEmitter<{ text: string }>;
  @Event() dsStop!: EventEmitter<void>;

  private textarea?: HTMLTextAreaElement;

  componentDidLoad() {
    this.resize();
  }

  @Watch('value')
  onValueChange() {
    requestAnimationFrame(() => this.resize());
  }

  @Method()
  async setFocus() {
    this.textarea?.focus();
  }

  private get streaming(): boolean {
    return this.status === 'submitted' || this.status === 'streaming';
  }

  private resize() {
    if (!this.textarea) return;
    this.textarea.style.height = 'auto';
    this.textarea.style.height = `${this.textarea.scrollHeight}px`;
  }

  private handleInput = (event: Event) => {
    this.value = (event.target as HTMLTextAreaElement).value;
    this.resize();
    this.dsInput.emit(this.value);
  };

  private submit() {
    const text = this.value.trim();
    if (!text || this.isInactive || this.streaming) return;
    this.dsSubmit.emit({ text });
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    this.submit();
  };

  private handleAction = () => {
    if (this.streaming) this.dsStop.emit();
    else this.submit();
  };

  render() {
    const error = this.status === 'error';
    const actionInactive = !this.streaming && (this.isInactive || !this.value.trim());
    return (
      <Host>
        <form
          class={{ 'message-composer': true, 'message-composer--error': error }}
          aria-busy={this.streaming ? 'true' : undefined}
          onSubmit={(event: Event) => {
            event.preventDefault();
            this.submit();
          }}
        >
          <div class="message-composer__attachments">
            <slot name="attachments" />
          </div>
          <div class="message-composer__field">
            <textarea
              ref={element => {
                this.textarea = element;
              }}
              value={this.value}
              placeholder={this.placeholder}
              aria-label={this.label}
              aria-invalid={error ? 'true' : undefined}
              disabled={this.isInactive}
              rows={2}
              onInput={this.handleInput}
              onKeyDown={this.handleKeyDown}
            />
            <div class="message-composer__controls">
              <div class="message-composer__tools">
                <slot name="tools" />
              </div>
              <div class="message-composer__actions">
                <slot name="actions" />
                {actionInactive ? (
                  <ds-tooltip label="Send message" side="top" size="sm">
                    <ds-button-unfilled
                      class="message-composer__action"
                      variant="icon"
                      icon="ArrowUp"
                      size="md"
                      aria-label="Send message"
                      hasBorder
                      isInactive
                      onDsClick={this.handleAction}
                    />
                  </ds-tooltip>
                ) : (
                  <ds-tooltip
                    label={this.streaming ? 'Stop response' : 'Send message'}
                    side="top"
                    size="sm"
                  >
                    <ds-button-filled
                      class="message-composer__action"
                      variant="icon"
                      icon={this.streaming ? 'SquareFilled' : 'ArrowUp'}
                      intent={this.streaming ? 'brand' : this.submitIntent}
                      contrast="bold"
                      size="md"
                      aria-label={this.streaming ? 'Stop response' : 'Send message'}
                      onDsClick={this.handleAction}
                    />
                  </ds-tooltip>
                )}
              </div>
            </div>
          </div>
        </form>
      </Host>
    );
  }
}

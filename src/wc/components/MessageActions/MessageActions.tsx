import { Component, Event, EventEmitter, h, Host, Prop, State, Watch } from '@stencil/core';
import { writeClipboardText } from '../../utils/clipboard';
import type { MessageCopyResultEventDetail, MessageFeedback } from '../conversation-types';

@Component({
  tag: 'ds-message-actions',
  styleUrl: 'MessageActions.css',
  scoped: true,
})
export class MessageActions {
  @Prop() copyText: string | undefined;
  @Prop() feedbackEnabled: boolean = false;
  @Prop() feedback: MessageFeedback | undefined;

  @State() private copied: boolean = false;

  @Event() dsCopyResult!: EventEmitter<MessageCopyResultEventDetail>;
  @Event() dsFeedbackChange!: EventEmitter<MessageFeedback | undefined>;

  private copiedTimer?: ReturnType<typeof setTimeout>;

  @Watch('copyText')
  handleCopyTextChange() {
    this.clearCopiedState();
  }

  disconnectedCallback() {
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
  }

  private clearCopiedState() {
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = undefined;
    this.copied = false;
  }

  private copy = async () => {
    const success = await writeClipboardText(this.copyText ?? '');
    this.dsCopyResult.emit({ status: success ? 'success' : 'error' });
    if (!success) return;

    this.copied = true;
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => {
      this.copied = false;
      this.copiedTimer = undefined;
    }, 2000);
  };

  private changeFeedback(feedback: MessageFeedback, selected: boolean) {
    this.dsFeedbackChange.emit(selected ? feedback : undefined);
  }

  render() {
    const copyLabel = this.copied ? 'Copied' : 'Copy message';

    return (
      <Host>
        <div class="message-actions" role="group" aria-label="Message actions">
          {this.copyText ? (
            <ds-tooltip label={copyLabel} side="top" size="sm">
              <ds-button-unfilled
                variant="icon"
                icon={this.copied ? 'Check' : 'Copy'}
                size="xs"
                aria-label={copyLabel}
                hasBorder={false}
                onDsClick={this.copy}
              />
            </ds-tooltip>
          ) : null}
          {this.feedbackEnabled ? (
            <ds-tooltip label="Good response" side="top" size="sm">
              <ds-button-unfilled
                variant="icon"
                icon={this.feedback === 'positive' ? 'ThumbsUpFilled' : 'ThumbsUp'}
                size="xs"
                aria-label="Good response"
                hasBorder={false}
                pressed={this.feedback === 'positive'}
                onDsChange={(event: CustomEvent<boolean>) =>
                  this.changeFeedback('positive', event.detail)
                }
              />
            </ds-tooltip>
          ) : null}
          {this.feedbackEnabled ? (
            <ds-tooltip label="Bad response" side="top" size="sm">
              <ds-button-unfilled
                variant="icon"
                icon={this.feedback === 'negative' ? 'ThumbsDownFilled' : 'ThumbsDown'}
                size="xs"
                aria-label="Bad response"
                hasBorder={false}
                pressed={this.feedback === 'negative'}
                onDsChange={(event: CustomEvent<boolean>) =>
                  this.changeFeedback('negative', event.detail)
                }
              />
            </ds-tooltip>
          ) : null}
        </div>
      </Host>
    );
  }
}

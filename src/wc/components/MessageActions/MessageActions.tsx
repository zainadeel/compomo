import { Component, Event, EventEmitter, h, Host, Prop, State, Watch } from '@stencil/core';
import { ClipboardFeedbackController } from '../../utils/clipboard';
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

  private readonly copyFeedback = new ClipboardFeedbackController(copied => {
    this.copied = copied;
  });

  connectedCallback() {
    this.copyFeedback.connect();
  }

  @Watch('copyText')
  handleCopyTextChange() {
    this.copyFeedback.reset();
  }

  disconnectedCallback() {
    this.copyFeedback.disconnect();
  }

  private copy = async () => {
    const success = await this.copyFeedback.copy(this.copyText ?? '');
    if (success === undefined) return;

    this.dsCopyResult.emit({ status: success ? 'success' : 'error' });
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
                activeFill={false}
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
                activeFill={false}
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

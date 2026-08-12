import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import type {
  AgentQuestion,
  AgentQuestionAnswer,
  AgentQuestionnaireAnswerEventDetail,
  AgentQuestionnaireCancelEventDetail,
  AgentQuestionnaireLabels,
  AgentQuestionnaireStatus,
} from '../conversation-types';
import {
  createQuestionnaireDrafts,
  formatQuestionAnswer,
  normalizeQuestionAnswer,
  validateQuestionDraft,
} from './agent-questionnaire-model';
import type {
  AgentQuestionDraft,
  AgentQuestionDrafts,
} from './agent-questionnaire-model';

const DEFAULT_LABELS: AgentQuestionnaireLabels = {
  progress: 'Question {current} of {total}',
  previous: 'Previous',
  next: 'Next',
  answer: 'Answer',
  skip: 'Skip',
  cancel: 'Cancel',
  other: 'Other',
  otherPlaceholder: 'Enter another answer',
  preparing: 'Preparing questions…',
};

let questionnaireId = 0;

@Component({
  tag: 'ds-agent-questionnaire',
  styleUrl: 'AgentQuestionnaire.css',
  scoped: true,
})
export class AgentQuestionnaire {
  @Element() el!: HTMLElement;

  @Prop() requestId!: string;
  @Prop() questions!: AgentQuestion[];
  @Prop() answers: AgentQuestionAnswer[] = [];
  @Prop() status: AgentQuestionnaireStatus = 'ready';
  @Prop() errorMessage?: string;
  @Prop() allowCancel: boolean = false;
  @Prop() labels?: Partial<AgentQuestionnaireLabels>;

  @Event() dsAnswer!: EventEmitter<AgentQuestionnaireAnswerEventDetail>;
  @Event() dsCancel!: EventEmitter<AgentQuestionnaireCancelEventDetail>;

  @State() private currentStep = 0;
  @State() private drafts: AgentQuestionDrafts = {};
  @State() private validation: Record<string, string> = {};

  private readonly instanceId = ++questionnaireId;
  private answerPending = false;

  componentWillLoad() {
    this.resetDraft();
  }

  @Watch('requestId')
  handleRequestChange() {
    this.resetDraft();
  }

  @Watch('questions')
  handleQuestionsChange() {
    this.resetDraft();
  }

  @Watch('status')
  handleStatusChange(status: AgentQuestionnaireStatus) {
    if (status !== 'submitting') this.answerPending = false;
  }

  @Method()
  async setFocus(): Promise<void> {
    this.focusCurrentControl();
  }

  private get copy(): AgentQuestionnaireLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  private get disabled(): boolean {
    return this.status === 'submitting';
  }

  private resetDraft() {
    this.currentStep = 0;
    this.drafts = createQuestionnaireDrafts(this.questions ?? [], this.answers ?? []);
    this.validation = {};
    this.answerPending = false;
  }

  private focusCurrentControl() {
    const focus = () => {
      const control = this.el.querySelector<HTMLElement>(
        '[data-question-control]:not([disabled])',
      );
      const action = this.el.querySelector<HTMLElement>(
        '[data-question-action]:not([disabled])',
      );
      (control ?? action)?.focus();
    };
    focus();
    requestAnimationFrame(focus);
    setTimeout(focus, 0);
  }

  private updateDraft(questionId: string, update: Partial<AgentQuestionDraft>) {
    const previous = this.drafts[questionId] ?? {
      value: '',
      otherSelected: false,
      otherText: '',
      skipped: false,
    };
    this.drafts = {
      ...this.drafts,
      [questionId]: { ...previous, ...update, skipped: false },
    };
    if (this.validation[questionId]) {
      const { [questionId]: _removed, ...rest } = this.validation;
      this.validation = rest;
    }
  }

  private validate(question: AgentQuestion): boolean {
    const message = validateQuestionDraft(question, this.drafts[question.id]);
    if (!message) return true;
    this.validation = { ...this.validation, [question.id]: message };
    this.focusCurrentControl();
    return false;
  }

  private move(step: number) {
    this.currentStep = Math.min(Math.max(step, 0), this.questions.length - 1);
    this.focusCurrentControl();
  }

  private next(question: AgentQuestion) {
    if (!this.validate(question)) return;
    this.move(this.currentStep + 1);
  }

  private skip(question: AgentQuestion) {
    if (question.required) return;
    this.drafts = {
      ...this.drafts,
      [question.id]: {
        ...(this.drafts[question.id] ?? {
          value: '',
          otherSelected: false,
          otherText: '',
        }),
        skipped: true,
      },
    };
    if (this.currentStep < this.questions.length - 1) this.move(this.currentStep + 1);
    else this.submit();
  }

  private submit() {
    if (this.disabled || this.answerPending) return;
    const invalidIndex = this.questions.findIndex(
      question => !this.validateWithoutFocus(question),
    );
    if (invalidIndex >= 0) {
      this.currentStep = invalidIndex;
      this.focusCurrentControl();
      return;
    }

    this.answerPending = true;
    this.dsAnswer.emit({
      requestId: this.requestId,
      answers: this.questions.map(question =>
        normalizeQuestionAnswer(question, this.drafts[question.id]),
      ),
    });
  }

  private validateWithoutFocus(question: AgentQuestion): boolean {
    const message = validateQuestionDraft(question, this.drafts[question.id]);
    if (!message) return true;
    this.validation = { ...this.validation, [question.id]: message };
    return false;
  }

  private progressLabel(): string {
    return this.copy.progress
      .split('{current}')
      .join(String(this.currentStep + 1))
      .split('{total}')
      .join(String(this.questions.length));
  }

  private renderChoice(
    question: AgentQuestion,
    choice: NonNullable<AgentQuestion['choices']>[number],
  ) {
    const draft = this.drafts[question.id];
    const multiple = question.type === 'multiple';
    const checked = multiple
      ? Array.isArray(draft.value) && draft.value.includes(choice.value)
      : draft.value === choice.value && !draft.otherSelected;
    const inputId = `ds-agent-questionnaire-${this.instanceId}-${this.currentStep}-${choice.value}`;
    return (
      <label class={{ questionnaire__choice: true, 'questionnaire__choice--selected': checked }} htmlFor={inputId}>
        <input
          id={inputId}
          data-question-control
          type={multiple ? 'checkbox' : 'radio'}
          name={`ds-agent-question-${this.instanceId}-${question.id}`}
          form={`ds-agent-questionnaire-detached-${this.instanceId}`}
          value={choice.value}
          checked={checked}
          disabled={this.disabled}
          onChange={() => {
            if (multiple) {
              const values = Array.isArray(draft.value) ? draft.value : [];
              this.updateDraft(question.id, {
                value: checked
                  ? values.filter(value => value !== choice.value)
                  : [...values, choice.value],
              });
            } else {
              this.updateDraft(question.id, {
                value: choice.value,
                otherSelected: false,
              });
            }
          }}
        />
        <span class="questionnaire__choice-copy">
          <ds-text as="span" variant="text-body-medium" emphasis>{choice.label}</ds-text>
          {choice.description ? (
            <ds-text as="span" variant="text-body-small" color="secondary">
              {choice.description}
            </ds-text>
          ) : null}
        </span>
      </label>
    );
  }

  private renderOther(question: AgentQuestion) {
    if (!question.allowOther || question.type === 'text') return null;
    const draft = this.drafts[question.id];
    const inputId = `ds-agent-questionnaire-${this.instanceId}-${this.currentStep}-other`;
    return (
      <div class={{ questionnaire__other: true, 'questionnaire__choice--selected': draft.otherSelected }}>
        <label class="questionnaire__choice questionnaire__choice--other" htmlFor={inputId}>
          <input
            id={inputId}
            data-question-control
            type={question.type === 'multiple' ? 'checkbox' : 'radio'}
            name={`ds-agent-question-${this.instanceId}-${question.id}`}
            form={`ds-agent-questionnaire-detached-${this.instanceId}`}
            checked={draft.otherSelected}
            disabled={this.disabled}
            onChange={() => {
              this.updateDraft(question.id, {
                otherSelected:
                  question.type === 'multiple' ? !draft.otherSelected : true,
                value: question.type === 'single' ? '' : draft.value,
              });
              requestAnimationFrame(() =>
                this.el.querySelector<HTMLInputElement>(`#${inputId}-text`)?.focus(),
              );
            }}
          />
          <ds-text as="span" variant="text-body-medium" emphasis>{this.copy.other}</ds-text>
        </label>
        {draft.otherSelected ? (
          <input
            id={`${inputId}-text`}
            class="questionnaire__other-input"
            data-question-control
            type="text"
            form={`ds-agent-questionnaire-detached-${this.instanceId}`}
            value={draft.otherText}
            placeholder={this.copy.otherPlaceholder}
            aria-label={this.copy.other}
            aria-invalid={this.validation[question.id] ? 'true' : undefined}
            aria-describedby={this.validation[question.id] ? `${inputId}-error` : undefined}
            disabled={this.disabled}
            onInput={(event: Event) =>
              this.updateDraft(question.id, {
                otherText: (event.target as HTMLInputElement).value,
              })
            }
          />
        ) : null}
      </div>
    );
  }

  private renderQuestion(question: AgentQuestion) {
    const draft = this.drafts[question.id];
    const errorId = `ds-agent-questionnaire-${this.instanceId}-${this.currentStep}-error`;
    return (
      <div class="questionnaire__body">
        <div class="questionnaire__prompt">
          <ds-text as="h2" variant="text-title-small">{question.question}</ds-text>
          {question.description ? (
            <ds-text variant="text-body-small" color="secondary">
              {question.description}
            </ds-text>
          ) : null}
        </div>
        {question.type === 'text' ? (
          <textarea
            class="questionnaire__text-input"
            data-question-control
            value={typeof draft.value === 'string' ? draft.value : ''}
            form={`ds-agent-questionnaire-detached-${this.instanceId}`}
            placeholder={question.placeholder}
            aria-label={question.question}
            aria-invalid={this.validation[question.id] ? 'true' : undefined}
            aria-describedby={this.validation[question.id] ? errorId : undefined}
            disabled={this.disabled}
            rows={4}
            onInput={(event: Event) =>
              this.updateDraft(question.id, {
                value: (event.target as HTMLTextAreaElement).value,
              })
            }
          />
        ) : (
          <fieldset
            class="questionnaire__choices"
            aria-describedby={this.validation[question.id] ? errorId : undefined}
          >
            <legend class="ds-visually-hidden">{question.question}</legend>
            {question.choices?.map(choice => this.renderChoice(question, choice))}
            {this.renderOther(question)}
          </fieldset>
        )}
        {this.validation[question.id] ? (
          <div id={errorId} class="questionnaire__error" role="alert">
            <ds-icon name="ErrorTriangle" size="xs" color="inherit" />
            <ds-text variant="text-body-small" color="negative">
              {this.validation[question.id]}
            </ds-text>
          </div>
        ) : null}
      </div>
    );
  }

  private renderAnswered() {
    return (
      <div class="questionnaire questionnaire--answered">
        <ol class="questionnaire__summary">
          {this.questions.map(question => (
            <li>
              <ds-text variant="text-body-small" emphasis>{question.question}</ds-text>
              <ds-text variant="text-body-small" color="secondary">
                {formatQuestionAnswer(
                  question,
                  this.answers.find(answer => answer.questionId === question.id),
                )}
              </ds-text>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  render() {
    if (this.status === 'preparing') {
      return (
        <Host>
          <div class="questionnaire questionnaire--preparing" role="status">
            <ds-loader size="sm" />
            <ds-text variant="text-body-medium">{this.copy.preparing}</ds-text>
          </div>
        </Host>
      );
    }
    if (!this.questions?.length) return null;
    if (this.status === 'answered') return <Host>{this.renderAnswered()}</Host>;

    const question = this.questions[this.currentStep];
    const last = this.currentStep === this.questions.length - 1;
    const canSkip = Boolean(question.skippable && !question.required);
    return (
      <Host>
        <section
          class={{
            questionnaire: true,
            'questionnaire--submitting': this.disabled,
            'questionnaire--error': this.status === 'error',
          }}
          aria-busy={this.disabled ? 'true' : undefined}
          aria-label={question.question}
        >
          <header class="questionnaire__header">
            <ds-text variant="text-caption" color="secondary">{this.progressLabel()}</ds-text>
            {this.allowCancel ? (
              <button
                class="questionnaire__quiet-action"
                data-question-action
                type="button"
                disabled={this.disabled}
                onClick={() => this.dsCancel.emit({ requestId: this.requestId })}
              >
                <ds-text as="span" variant="text-body-small" emphasis>
                  {this.copy.cancel}
                </ds-text>
              </button>
            ) : null}
          </header>
          {this.renderQuestion(question)}
          {this.status === 'error' && this.errorMessage ? (
            <div class="questionnaire__submission-error" role="alert">
              <ds-icon name="ErrorTriangle" size="xs" color="inherit" />
              <ds-text variant="text-body-small" color="negative">{this.errorMessage}</ds-text>
            </div>
          ) : null}
          <footer class="questionnaire__actions">
            <div class="questionnaire__actions-leading">
              {this.currentStep > 0 ? (
                <button
                  class="questionnaire__secondary-action"
                  data-question-action
                  type="button"
                  disabled={this.disabled}
                  onClick={() => this.move(this.currentStep - 1)}
                >
                  <ds-text as="span" variant="text-body-small" emphasis>
                    {this.copy.previous}
                  </ds-text>
                </button>
              ) : null}
              {canSkip ? (
                <button
                  class="questionnaire__quiet-action"
                  data-question-action
                  type="button"
                  disabled={this.disabled}
                  onClick={() => this.skip(question)}
                >
                  <ds-text as="span" variant="text-body-small" emphasis>
                    {this.copy.skip}
                  </ds-text>
                </button>
              ) : null}
            </div>
            <button
              class="questionnaire__primary-action"
              data-question-action
              type="button"
              disabled={this.disabled}
              onClick={() => (last ? this.submit() : this.next(question))}
            >
              {this.disabled ? <ds-loader size="xs" color="inherit" /> : null}
              <ds-text as="span" variant="text-body-small" emphasis>
                {last ? this.copy.answer : this.copy.next}
              </ds-text>
            </button>
          </footer>
        </section>
      </Host>
    );
  }
}

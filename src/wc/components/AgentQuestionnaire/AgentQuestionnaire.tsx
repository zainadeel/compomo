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
import type { AgentQuestionDraft, AgentQuestionDrafts } from './agent-questionnaire-model';

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
  private readonly otherValue = `__ds-agent-questionnaire-other-${this.instanceId}`;
  private answerPending = false;
  private resetScheduled = false;
  private draftRequestId?: string;
  private answersSnapshot: AgentQuestionAnswer[] = [];
  private waitingForRequestAnswers = false;

  componentWillLoad() {
    this.draftRequestId = this.requestId;
    this.answersSnapshot = this.answers;
    this.resetDraft();
  }

  @Watch('requestId')
  @Watch('questions')
  @Watch('answers')
  handleQuestionnaireInputChange() {
    this.scheduleDraftReset();
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

  private resetDraft(answers = this.answers) {
    this.currentStep = 0;
    this.drafts = createQuestionnaireDrafts(this.questions ?? [], answers ?? []);
    this.validation = {};
    this.answerPending = false;
  }

  private scheduleDraftReset() {
    if (this.resetScheduled) return;
    this.resetScheduled = true;
    queueMicrotask(() => {
      this.resetScheduled = false;
      const requestChanged = this.requestId !== this.draftRequestId;
      const answersChanged = this.answers !== this.answersSnapshot;
      if (requestChanged && !answersChanged) {
        this.waitingForRequestAnswers = true;
      } else if (answersChanged) {
        this.waitingForRequestAnswers = false;
      }
      this.resetDraft(this.waitingForRequestAnswers ? [] : this.answers);
      this.draftRequestId = this.requestId;
      this.answersSnapshot = this.answers;
    });
  }

  private focusCurrentControl(preferInvalid = false) {
    const focus = () => {
      const invalidControl = preferInvalid
        ? this.el.querySelector<HTMLElement>(
            '[data-question-control][aria-invalid="true"]:not([disabled])'
          )
        : null;
      const control =
        invalidControl ??
        this.el.querySelector<HTMLElement>(
          '[data-question-control]:not([disabled]):not([is-inactive])'
        );
      const action = this.el.querySelector<HTMLElement>(
        '[data-question-action]:not([is-inactive]):not([is-loading])'
      );
      const target = (control ?? action) as
        | (HTMLElement & { setFocus?: () => Promise<void> })
        | null;
      if (target?.setFocus) void target.setFocus();
      else target?.focus();
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
    this.focusCurrentControl(true);
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
    const invalidIndex = this.questions.findIndex(question => !this.validateWithoutFocus(question));
    if (invalidIndex >= 0) {
      this.currentStep = invalidIndex;
      this.focusCurrentControl(true);
      return;
    }

    this.answerPending = true;
    this.dsAnswer.emit({
      requestId: this.requestId,
      answers: this.questions.map(question =>
        normalizeQuestionAnswer(question, this.drafts[question.id])
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

  private selectSingle(question: AgentQuestion, value: string) {
    const otherSelected = value === this.otherValue;
    this.updateDraft(question.id, {
      value: otherSelected ? '' : value,
      otherSelected,
    });
    if (otherSelected) {
      requestAnimationFrame(() =>
        this.el.querySelector<HTMLInputElement>('[data-question-other-input]')?.focus()
      );
    }
  }

  private renderSingleChoice(question: AgentQuestion, promptId: string, errorId: string) {
    const draft = this.drafts[question.id];
    const value = draft.otherSelected
      ? this.otherValue
      : typeof draft.value === 'string'
        ? draft.value
        : '';
    const options = [
      ...(question.choices ?? []),
      ...(question.allowOther ? [{ value: this.otherValue, label: this.copy.other }] : []),
    ];
    return (
      <div class="questionnaire__single-choice">
        <ds-radio
          data-question-control
          size="lg"
          options={options}
          value={value}
          disabled={this.disabled}
          form={`ds-agent-questionnaire-detached-${this.instanceId}`}
          ariaLabelledby={promptId}
          aria-describedby={this.validation[question.id] ? errorId : undefined}
          onDsChange={(event: CustomEvent<string>) => this.selectSingle(question, event.detail)}
        />
        {draft.otherSelected ? this.renderOtherInput(question, errorId) : null}
      </div>
    );
  }

  private renderMultipleChoice(question: AgentQuestion, errorId: string) {
    const draft = this.drafts[question.id];
    const values = Array.isArray(draft.value) ? draft.value : [];
    const detachedForm = `ds-agent-questionnaire-detached-${this.instanceId}`;
    return (
      <div class="questionnaire__multiple-choice">
        {question.choices?.map(choice => (
          <ds-checkbox
            key={choice.value}
            data-question-control
            size="lg"
            label={choice.label}
            description={choice.description}
            value={choice.value}
            checked={values.includes(choice.value)}
            disabled={this.disabled}
            form={detachedForm}
            onDsChange={(event: CustomEvent<boolean>) => {
              this.updateDraft(question.id, {
                value: event.detail
                  ? [...values, choice.value]
                  : values.filter(value => value !== choice.value),
              });
            }}
          />
        ))}
        {question.allowOther ? (
          <div class="questionnaire__other-choice">
            <ds-checkbox
              data-question-control
              size="lg"
              label={this.copy.other}
              checked={draft.otherSelected}
              disabled={this.disabled}
              form={detachedForm}
              onDsChange={(event: CustomEvent<boolean>) => {
                this.updateDraft(question.id, { otherSelected: event.detail });
                if (event.detail) {
                  requestAnimationFrame(() =>
                    this.el.querySelector<HTMLInputElement>('[data-question-other-input]')?.focus()
                  );
                }
              }}
            />
            {draft.otherSelected ? this.renderOtherInput(question, errorId) : null}
          </div>
        ) : null}
      </div>
    );
  }

  private renderOtherInput(question: AgentQuestion, errorId: string) {
    const draft = this.drafts[question.id];
    return (
      <input
        class="questionnaire__other-input"
        data-question-control
        data-question-other-input
        type="text"
        form={`ds-agent-questionnaire-detached-${this.instanceId}`}
        value={draft.otherText}
        placeholder={this.copy.otherPlaceholder}
        aria-label={this.copy.other}
        aria-invalid={this.validation[question.id] ? 'true' : undefined}
        aria-describedby={this.validation[question.id] ? errorId : undefined}
        disabled={this.disabled}
        onInput={(event: Event) =>
          this.updateDraft(question.id, {
            otherText: (event.target as HTMLInputElement).value,
          })
        }
      />
    );
  }

  private renderQuestion(question: AgentQuestion) {
    const draft = this.drafts[question.id];
    const errorId = `ds-agent-questionnaire-${this.instanceId}-${this.currentStep}-error`;
    const promptId = `ds-agent-questionnaire-${this.instanceId}-${this.currentStep}-prompt`;
    return (
      <div class="questionnaire__body">
        <div class="questionnaire__prompt">
          <ds-text as="h2" variant="text-title-small" textId={promptId}>
            {question.question}
          </ds-text>
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
            {question.type === 'single'
              ? this.renderSingleChoice(question, promptId, errorId)
              : this.renderMultipleChoice(question, errorId)}
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
              <ds-text variant="text-body-small" emphasis>
                {question.question}
              </ds-text>
              <ds-text variant="text-body-small" color="secondary">
                {formatQuestionAnswer(
                  question,
                  this.answers.find(answer => answer.questionId === question.id)
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
            <ds-text variant="text-caption" color="secondary">
              {this.progressLabel()}
            </ds-text>
            {this.allowCancel ? (
              <ds-tooltip label={this.copy.cancel} side="top" size="sm">
                <ds-button-unfilled
                  data-question-action
                  variant="icon"
                  icon="Cross"
                  size="sm"
                  aria-label={this.copy.cancel}
                  hasBorder={false}
                  isInactive={this.disabled}
                  onDsClick={() => this.dsCancel.emit({ requestId: this.requestId })}
                />
              </ds-tooltip>
            ) : null}
          </header>
          {this.renderQuestion(question)}
          {this.status === 'error' && this.errorMessage ? (
            <div class="questionnaire__submission-error" role="alert">
              <ds-icon name="ErrorTriangle" size="xs" color="inherit" />
              <ds-text variant="text-body-small" color="negative">
                {this.errorMessage}
              </ds-text>
            </div>
          ) : null}
          <footer class="questionnaire__actions">
            <div class="questionnaire__actions-leading">
              {this.currentStep > 0 ? (
                <div class="questionnaire__action-item">
                  <ds-button-unfilled
                    data-question-action
                    label={this.copy.previous}
                    size="sm"
                    width="fill"
                    isInactive={this.disabled}
                    onDsClick={() => this.move(this.currentStep - 1)}
                  />
                </div>
              ) : null}
              {canSkip ? (
                <div class="questionnaire__action-item">
                  <ds-button-unfilled
                    data-question-action
                    label={this.copy.skip}
                    size="sm"
                    width="fill"
                    hasBorder={false}
                    isInactive={this.disabled}
                    onDsClick={() => this.skip(question)}
                  />
                </div>
              ) : null}
            </div>
            <div class="questionnaire__action-item questionnaire__action-item--primary">
              <ds-button-filled
                data-question-action
                label={last ? this.copy.answer : this.copy.next}
                size="sm"
                width="fill"
                isLoading={this.disabled}
                onDsClick={() => (last ? this.submit() : this.next(question))}
              />
            </div>
          </footer>
        </section>
      </Host>
    );
  }
}

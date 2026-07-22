import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';
import type { BarWorkflowStep, BarWorkflowSubmitAction } from './bar-workflow-types';

@Component({
  tag: 'ds-bar-workflow',
  styleUrl: 'BarWorkflow.css',
  scoped: true,
})
export class BarWorkflow {
  /** The workflow's single visible h1. */
  @Prop() heading!: string;

  /** Ordered workflow steps. Step state is controlled by the application. */
  @Prop() steps: BarWorkflowStep[] = [];

  /** Id of the current workflow step. Falls back to the first step. */
  @Prop() value: string = '';

  /** Concise tooltip label for the Exit control. */
  @Prop() exitLabel: string = 'Exit';

  /** Workflow-specific accessible name for Exit. */
  @Prop() exitAriaLabel: string = 'Exit workflow';

  /** Tooltip and accessible name for the previous-step control. */
  @Prop() previousLabel: string = 'Previous step';

  /** Tooltip and accessible name for the next-step control. */
  @Prop() nextLabel: string = 'Next step';

  /** The final-step Save or Submit action. */
  @Prop() submitAction: BarWorkflowSubmitAction = {
    label: 'Save',
    type: 'submit',
  };

  /** Prevent advancing while the current step is incomplete or invalid. */
  @Prop() isNextInactive: boolean = false;

  /** Emitted when Exit is activated. */
  @Event() dsExit!: EventEmitter<MouseEvent>;

  /** Emitted with the target previous or next step id. The component never mutates value. */
  @Event() dsStepChange!: EventEmitter<string>;

  /** Emitted when the final Save or Submit control is activated. */
  @Event() dsSubmit!: EventEmitter<MouseEvent>;

  private get currentIndex(): number {
    const index = this.steps.findIndex(step => step.id === this.value);
    return index >= 0 ? index : 0;
  }

  private get previousStep(): BarWorkflowStep | null {
    return this.steps[this.currentIndex - 1] ?? null;
  }

  private get nextStep(): BarWorkflowStep | null {
    return this.steps[this.currentIndex + 1] ?? null;
  }

  private get isLastStep(): boolean {
    return this.steps.length <= 1 || this.currentIndex === this.steps.length - 1;
  }

  private get resolvedHeading(): string {
    if (this.steps.length <= 1) return this.heading;
    return `${this.heading} · ${this.currentIndex + 1}/${this.steps.length}`;
  }

  private handlePrevious = () => {
    if (this.previousStep && !this.previousStep.isInactive) {
      this.dsStepChange.emit(this.previousStep.id);
    }
  };

  private handleNext = () => {
    if (this.nextStep && !this.isNextInactive && !this.nextStep.isInactive) {
      this.dsStepChange.emit(this.nextStep.id);
    }
  };

  render() {
    const submit = this.submitAction;
    return (
      <Host>
        <div class="bar-workflow">
          <div class="bar-workflow__identity">
            <ds-tooltip label={this.exitLabel} side="bottom" size="sm">
              <ds-button-unfilled
                class="bar-workflow__exit"
                variant="icon"
                icon="Cross"
                aria-label={this.exitAriaLabel}
                size="md"
                background="bold"
                activeFill={false}
                hasBorder={false}
                onDsClick={(event: CustomEvent<MouseEvent>) => this.dsExit.emit(event.detail)}
              />
            </ds-tooltip>
            <ds-text
              class="bar-workflow__heading ds-control--md"
              variant="text-title-small"
              emphasis
              color="on-bold"
              as="h1"
              lineTruncation={1}
            >
              {this.resolvedHeading}
            </ds-text>
          </div>

          <div class="bar-workflow__actions">
            {this.previousStep ? (
              <ds-tooltip label={this.previousLabel} side="bottom" size="sm">
                <ds-button-unfilled
                  class="bar-workflow__previous"
                  variant="icon"
                  icon="ChevronLeft"
                  aria-label={this.previousLabel}
                  size="md"
                  background="bold"
                  activeFill={false}
                  hasBorder={false}
                  isInactive={this.previousStep.isInactive}
                  onDsClick={this.handlePrevious}
                />
              </ds-tooltip>
            ) : null}

            {this.isLastStep ? (
              <ds-tooltip label={submit.label} side="bottom" size="sm">
                <ds-button-filled
                  class="bar-workflow__submit"
                  variant="icon"
                  icon="Check"
                  label={submit.label}
                  aria-label={submit.label}
                  intent="brand"
                  contrast="faint"
                  background="bold"
                  size="md"
                  type={submit.type ?? 'submit'}
                  isInactive={submit.isInactive}
                  isLoading={submit.isLoading}
                  onDsClick={(event: CustomEvent<MouseEvent>) => this.dsSubmit.emit(event.detail)}
                />
              </ds-tooltip>
            ) : (
              <ds-tooltip label={this.nextLabel} side="bottom" size="sm">
                <ds-button-filled
                  class="bar-workflow__next"
                  variant="icon"
                  icon="ChevronRight"
                  label={this.nextLabel}
                  aria-label={this.nextLabel}
                  intent="brand"
                  contrast="faint"
                  background="bold"
                  size="md"
                  type="button"
                  isInactive={this.isNextInactive || this.nextStep?.isInactive}
                  onDsClick={this.handleNext}
                />
              </ds-tooltip>
            )}
          </div>
        </div>
      </Host>
    );
  }
}

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-bar-workflow.js';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import type { BarWorkflowStep } from './bar-workflow-types';

const STEPS: BarWorkflowStep[] = [
  { id: 'details', label: 'Driver details' },
  { id: 'employment', label: 'Employment' },
  { id: 'qualifications', label: 'Qualifications' },
];

const meta: Meta = {
  title: 'Navigation/BarWorkflow',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      ...isolatedOverlayDocs('320px'),
      description: {
        component:
          'Compact-only create/edit workflow chrome. The default is a single-step flow with Exit and Save or Submit. Optional steps are controlled navigation data, not a visible progress indicator: Previous appears after step one, Next advances between intermediate steps, and the final action becomes Check for Save or Submit.',
      },
    },
  },
  argTypes: {
    heading: { control: 'text' },
    submitLabel: { control: 'text' },
  },
  args: {
    heading: 'Create driver',
    submitLabel: 'Save driver',
  },
};

export default meta;
type Story = StoryObj;

function renderWorkflow(value: string, heading = 'Create driver', isNextInactive = false) {
  return html`
    <ds-bar-workflow
      heading=${heading}
      .steps=${STEPS}
      value=${value}
      exit-label="Exit"
      exit-aria-label="Exit driver creation"
      previous-label="Previous step"
      next-label="Next step"
      .submitAction=${{ label: 'Save driver', type: 'submit' }}
      .isNextInactive=${isNextInactive}
      @dsStepChange=${(event: CustomEvent<string>) => {
        (event.currentTarget as HTMLDsBarWorkflowElement).value = event.detail;
      }}
    ></ds-bar-workflow>
  `;
}

export const Playground: Story = {
  render: args => html`
      <ds-bar-workflow
        heading=${args['heading']}
        exit-label="Exit"
        exit-aria-label="Exit driver creation"
        .submitAction=${{ label: args['submitLabel'], type: 'submit' }}
      ></ds-bar-workflow>
    `,
};

export const FirstStep: Story = {
  name: 'First step',
  render: () => renderWorkflow('details'),
};

export const MiddleStep: Story = {
  name: 'Middle step',
  render: () => renderWorkflow('employment'),
};

export const LastStep: Story = {
  name: 'Last step · Save',
  render: () => renderWorkflow('qualifications'),
};

export const BlockedNext: Story = {
  name: 'Next inactive',
  render: () => renderWorkflow('details', 'Create driver', true),
};

export const SingleStep: Story = {
  name: 'Single-step edit',
  render: () => html`
    <ds-bar-workflow
      heading="Edit driver"
      .steps=${[{ id: 'details', label: 'Driver details' }]}
      value="details"
      exit-aria-label="Exit driver editing"
      .submitAction=${{ label: 'Save changes', type: 'submit' }}
    ></ds-bar-workflow>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import type {
  AgentQuestion,
  AgentQuestionAnswer,
  AgentQuestionnaireLabels,
  AgentQuestionnaireStatus,
} from '../conversation-types';
import '../../../../dist/components/ds-agent-questionnaire.js';

const meta = {
  title: 'Agent/Questionnaire',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const singleQuestion: AgentQuestion[] = [
  {
    id: 'priority',
    type: 'single',
    question: 'Which issue should I investigate first?',
    description: 'Choose the work that should lead the next agent turn.',
    required: true,
    allowOther: true,
    choices: [
      {
        value: 'battery',
        label: 'Repeated battery failures',
        description: 'Review the three vehicles with repeated charging-system visits.',
      },
      {
        value: 'tires',
        label: 'Overdue tire inspections',
        description: 'Prepare work orders for the two overdue inspections.',
      },
    ],
  },
];

const multipleQuestion: AgentQuestion[] = [
  {
    id: 'deliverables',
    type: 'multiple',
    question: 'Which deliverables should I prepare?',
    required: true,
    allowOther: true,
    choices: [
      { value: 'summary', label: 'Executive summary' },
      { value: 'orders', label: 'Draft work orders' },
      { value: 'csv', label: 'CSV export' },
    ],
  },
];

const textQuestion: AgentQuestion[] = [
  {
    id: 'context',
    type: 'text',
    question: 'What additional context should I use?',
    placeholder: 'Add constraints, dates, or participants',
    skippable: true,
  },
];

const multiStep: AgentQuestion[] = [
  singleQuestion[0],
  multipleQuestion[0],
  textQuestion[0],
];

const frame = (
  questions: AgentQuestion[],
  options: {
    status?: AgentQuestionnaireStatus;
    answers?: AgentQuestionAnswer[];
    errorMessage?: string;
    allowCancel?: boolean;
    labels?: Partial<AgentQuestionnaireLabels>;
  } = {},
) => html`
  <div style="width:min(600px, 90vw);">
    <ds-agent-questionnaire
      request-id="request-42"
      .questions=${questions}
      .answers=${options.answers ?? []}
      .status=${options.status ?? 'ready'}
      .errorMessage=${options.errorMessage}
      .allowCancel=${options.allowCancel ?? true}
      .labels=${options.labels}
    ></ds-agent-questionnaire>
  </div>
`;

export const Preparing: Story = {
  render: () => frame(singleQuestion, { status: 'preparing' }),
};

export const SingleChoice: Story = {
  render: () => frame(singleQuestion),
};

export const MultipleChoice: Story = {
  render: () => frame(multipleQuestion),
};

export const FreeText: Story = {
  render: () => frame(textQuestion),
};

export const OtherAnswer: Story = {
  render: () =>
    frame(singleQuestion, {
      answers: [{ questionId: 'priority', value: 'A different investigation' }],
    }),
};

export const RequiredValidation: Story = {
  render: () => frame(singleQuestion),
  play: async ({ canvasElement }) => {
    canvasElement.querySelector('ds-agent-questionnaire ds-button-filled')?.dispatchEvent(
      new CustomEvent('dsClick', { bubbles: true, composed: true }),
    );
  },
};

export const OptionalAndSkippable: Story = {
  render: () => frame(textQuestion),
};

export const MultiStepNavigation: Story = {
  render: () => frame(multiStep),
};

export const Submitting: Story = {
  render: () =>
    frame(singleQuestion, {
      status: 'submitting',
      answers: [{ questionId: 'priority', value: 'battery' }],
    }),
};

export const SubmissionErrorRetainsAnswers: Story = {
  render: () =>
    frame(singleQuestion, {
      status: 'error',
      errorMessage: 'Your answer could not be sent. Check your connection and try again.',
      answers: [{ questionId: 'priority', value: 'battery' }],
    }),
};

export const Cancellable: Story = {
  name: 'Canceled by application intent',
  render: () => frame(singleQuestion, { allowCancel: true }),
};

export const AnsweredTranscript: Story = {
  render: () =>
    frame(multiStep, {
      status: 'answered',
      answers: [
        { questionId: 'priority', value: 'battery' },
        { questionId: 'deliverables', value: ['summary', 'csv'] },
        { questionId: 'context', value: null },
      ],
    }),
};

export const NarrowViewport: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => html`<div style="width:320px;">${frame(multiStep)}</div>`,
};

export const LongLocalizedLabels: Story = {
  render: () =>
    frame(multiStep, {
      labels: {
        progress: 'Question structurée {current} parmi un total de {total}',
        previous: 'Revenir à la question précédente',
        next: 'Continuer vers la question suivante',
        answer: 'Envoyer toutes les réponses',
        skip: 'Passer cette question facultative',
        cancel: 'Annuler cette demande',
      },
    }),
};

export const ForcedColorsReview: Story = {
  name: 'Forced colors review',
  render: () => frame(multiStep),
};

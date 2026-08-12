import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AgentQuestion } from '../src/wc/components/conversation-types';
import {
  createQuestionnaireDrafts,
  formatQuestionAnswer,
  normalizeQuestionAnswer,
  validateQuestionDraft,
} from '../src/wc/components/AgentQuestionnaire/agent-questionnaire-model';

const questions: AgentQuestion[] = [
  {
    id: 'single',
    type: 'single',
    question: 'Choose one',
    required: true,
    allowOther: true,
    choices: [
      { value: 'alpha', label: 'Alpha' },
      { value: 'beta', label: 'Beta' },
    ],
  },
  {
    id: 'multiple',
    type: 'multiple',
    question: 'Choose several',
    choices: [
      { value: 'one', label: 'One' },
      { value: 'two', label: 'Two' },
    ],
    allowOther: true,
  },
  {
    id: 'text',
    type: 'text',
    question: 'Add context',
  },
];

describe('agent questionnaire draft model', () => {
  it('seeds known, multiple, other, and skipped answers without losing order', () => {
    const drafts = createQuestionnaireDrafts(questions, [
      { questionId: 'single', value: 'A custom choice' },
      { questionId: 'multiple', value: ['one', 'Another deliverable'] },
      { questionId: 'text', value: null },
    ]);

    assert.deepEqual(drafts.single, {
      value: '',
      otherSelected: true,
      otherText: 'A custom choice',
      skipped: false,
    });
    assert.deepEqual(drafts.multiple, {
      value: ['one'],
      otherSelected: true,
      otherText: 'Another deliverable',
      skipped: false,
    });
    assert.equal(drafts.text.skipped, true);
  });

  it('normalizes single strings, multiple arrays, other text, and skipped nulls', () => {
    const drafts = createQuestionnaireDrafts(questions, [
      { questionId: 'single', value: 'beta' },
      { questionId: 'multiple', value: ['one', 'Custom'] },
      { questionId: 'text', value: null },
    ]);

    assert.deepEqual(normalizeQuestionAnswer(questions[0], drafts.single), {
      questionId: 'single',
      value: 'beta',
    });
    assert.deepEqual(normalizeQuestionAnswer(questions[1], drafts.multiple), {
      questionId: 'multiple',
      value: ['one', 'Custom'],
    });
    assert.deepEqual(normalizeQuestionAnswer(questions[2], drafts.text), {
      questionId: 'text',
      value: null,
    });
  });

  it('blocks missing required choices and blank selected other text', () => {
    const drafts = createQuestionnaireDrafts(questions, []);
    assert.equal(
      validateQuestionDraft(questions[0], drafts.single),
      'Choose an answer before continuing.',
    );

    drafts.single.otherSelected = true;
    assert.equal(
      validateQuestionDraft(questions[0], drafts.single),
      'Enter a response for Other.',
    );
  });

  it('rejects choice questions without choices and formats answered history labels', () => {
    const invalid: AgentQuestion = {
      id: 'invalid',
      type: 'multiple',
      question: 'Missing options',
    };
    const [draft] = Object.values(createQuestionnaireDrafts([invalid], []));
    assert.equal(
      validateQuestionDraft(invalid, draft),
      'This question has no available choices.',
    );
    assert.equal(
      formatQuestionAnswer(questions[1], {
        questionId: 'multiple',
        value: ['one', 'Custom'],
      }),
      'One, Custom',
    );
    assert.equal(formatQuestionAnswer(questions[2], undefined), 'Skipped');
  });
});

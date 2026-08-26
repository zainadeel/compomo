import type { AgentQuestion, AgentQuestionAnswer } from '../conversation-types';

export interface AgentQuestionDraft {
  value: string | string[];
  otherSelected: boolean;
  otherText: string;
  skipped: boolean;
}

export type AgentQuestionDrafts = Record<string, AgentQuestionDraft>;

function answerFor(
  answers: AgentQuestionAnswer[],
  questionId: string
): AgentQuestionAnswer | undefined {
  return answers.find(answer => answer.questionId === questionId);
}

export function createQuestionnaireDrafts(
  questions: AgentQuestion[],
  answers: AgentQuestionAnswer[]
): AgentQuestionDrafts {
  return Object.fromEntries(
    questions.map(question => {
      const answer = answerFor(answers, question.id);
      const choiceValues = new Set(question.choices?.map(choice => choice.value) ?? []);

      if (question.type === 'multiple') {
        const values = Array.isArray(answer?.value) ? answer.value : [];
        const known = values.filter(value => choiceValues.has(value));
        const other = values.find(value => !choiceValues.has(value)) ?? '';
        return [
          question.id,
          {
            value: known,
            otherSelected: Boolean(question.allowOther && other),
            otherText: question.allowOther ? other : '',
            skipped: answer?.value === null,
          },
        ];
      }

      const value = typeof answer?.value === 'string' ? answer.value : '';
      const isKnownChoice = question.type === 'single' && choiceValues.has(value);
      return [
        question.id,
        {
          value: question.type === 'single' && !isKnownChoice ? '' : value,
          otherSelected: Boolean(
            question.type === 'single' && question.allowOther && value && !isKnownChoice
          ),
          otherText:
            question.type === 'single' && question.allowOther && value && !isKnownChoice
              ? value
              : '',
          skipped: answer?.value === null,
        },
      ];
    })
  );
}

export function normalizeQuestionAnswer(
  question: AgentQuestion,
  draft: AgentQuestionDraft
): AgentQuestionAnswer {
  if (draft.skipped) return { questionId: question.id, value: null };

  if (question.type === 'multiple') {
    const values = Array.isArray(draft.value) ? [...draft.value] : [];
    if (draft.otherSelected && draft.otherText.trim()) values.push(draft.otherText.trim());
    return {
      questionId: question.id,
      value: values.length || question.required ? values : null,
    };
  }

  if (draft.otherSelected) {
    const other = draft.otherText.trim();
    return { questionId: question.id, value: other || null };
  }

  const value = typeof draft.value === 'string' ? draft.value.trim() : '';
  return { questionId: question.id, value: value || null };
}

export function validateQuestionDraft(
  question: AgentQuestion,
  draft: AgentQuestionDraft
): string | undefined {
  if ((question.type === 'single' || question.type === 'multiple') && !question.choices?.length) {
    return 'This question has no available choices.';
  }

  if (draft.otherSelected && !draft.otherText.trim()) {
    return 'Enter a response for Other.';
  }

  if (!question.required || draft.skipped) return undefined;
  const answer = normalizeQuestionAnswer(question, draft).value;
  const missing = answer === null || (Array.isArray(answer) && answer.length === 0);
  if (!missing) return undefined;
  return question.type === 'text'
    ? 'Enter an answer before continuing.'
    : 'Choose an answer before continuing.';
}

export function formatQuestionAnswer(
  question: AgentQuestion,
  answer: AgentQuestionAnswer | undefined
): string {
  if (!answer || answer.value === null) return 'Skipped';
  const values = Array.isArray(answer.value) ? answer.value : [answer.value];
  const labels = new Map(question.choices?.map(choice => [choice.value, choice.label]) ?? []);
  return values.map(value => labels.get(value) ?? value).join(', ');
}

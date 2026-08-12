import '/dist/components/ds-agent-questionnaire.js';
import '/dist/components/ds-agent-tool-call.js';
import '/dist/components/ds-agent-source-list.js';
import '/dist/components/ds-message-composer.js';
import '/dist/components/ds-button-unfilled.js';
import '/dist/components/ds-agent-response.js';
import '/dist/components/ds-message-scroller.js';
import '/dist/components/ds-message.js';
import '/dist/components/ds-message-bubble.js';

await Promise.all([
  'ds-agent-questionnaire',
  'ds-agent-tool-call',
  'ds-agent-source-list',
  'ds-message-composer',
  'ds-agent-response',
  'ds-message-scroller',
  'ds-message',
].map(tag => customElements.whenDefined(tag)));

const questions = [
  {
    id: 'priority',
    type: 'single',
    question: 'Which issue should I investigate first?',
    required: true,
    allowOther: true,
    choices: [
      { value: 'battery', label: 'Repeated battery failures', description: 'Three matching visits.' },
      { value: 'tires', label: 'Overdue tire inspections' },
    ],
  },
  {
    id: 'deliverables',
    type: 'multiple',
    question: 'Which deliverables should I prepare?',
    required: true,
    choices: [
      { value: 'summary', label: 'Executive summary' },
      { value: 'orders', label: 'Draft work orders' },
    ],
  },
  {
    id: 'context',
    type: 'text',
    question: 'Add optional context',
    skippable: true,
  },
];

const questionnaire = document.querySelector('#questionnaire');
questionnaire.questions = questions;
window.answerEvents = [];
window.cancelEvents = [];
questionnaire.addEventListener('dsAnswer', event => {
  window.answerEvents.push(event.detail);
  questionnaire.status = 'submitting';
});
questionnaire.addEventListener('dsCancel', event => window.cancelEvents.push(event.detail));

const toolDetails = document.querySelector('#tool-details');
toolDetails.input = { period: '30 days' };
toolDetails.output = { matches: 12 };
window.toolOpenEvents = [];
toolDetails.addEventListener('dsOpenChange', event => window.toolOpenEvents.push(event.detail));
const toolCustom = document.querySelector('#tool-custom');
toolCustom.input = { should: 'not render' };
toolCustom.output = { should: 'not render' };

const sources = document.querySelector('#sources');
sources.items = [
  { id: 'safe', title: 'Maintenance guide', description: 'Inspection guidance', url: 'https://docs.example.com/guide' },
  { id: 'unsafe', title: 'Unsafe source', url: 'javascript:alert(1)' },
  { id: 'invalid', title: 'Malformed source', url: 'http://[' },
];
window.sourceOpenEvents = [];
sources.addEventListener('dsOpenChange', event => window.sourceOpenEvents.push(event.detail));

const response = document.querySelector('#response');
response.showAuthor = false;
response.parts = [
  {
    id: 'prose',
    type: 'markdown',
    state: 'complete',
    content: `## Findings

This measured paragraph remains readable in a wide response lane and includes a verylongunbrokenidentifier_that_must_wrap_without_widening_the_page_or_the_response_lane.

| Vehicle | Recommendation |
| --- | --- |
| Unit 104 | Run a complete charging-system test and inspect the full service history |

\`\`\`ts
const affected = records.filter(record => record.issue === 'battery')
\`\`\``,
  },
];

const composedResponse = document.querySelector('#response-composed');
composedResponse.showAuthor = false;
composedResponse.parts = [
  { id: 'ignored', type: 'markdown', state: 'complete', content: 'Ignored parts content' },
];

const historyResponse = document.querySelector('#response-history');
historyResponse.showAuthor = false;
historyResponse.parts = [
  {
    id: 'answered-questionnaire',
    type: 'questionnaire',
    requestId: 'request-one',
    status: 'answered',
    questions: [questions[0]],
    answers: [{ questionId: 'priority', value: 'battery' }],
  },
];

const scroller = document.querySelector('#scroller');
function createMessage(id, text, anchor = false) {
  const message = document.createElement('ds-message');
  message.messageId = id;
  message.direction = 'outgoing';
  message.author = 'You';
  if (anchor) message.setAttribute('scroll-anchor', '');
  const bubble = document.createElement('ds-message-bubble');
  bubble.variant = 'user';
  bubble.textContent = text;
  message.append(bubble);
  return message;
}

for (let index = 0; index < 12; index += 1) {
  scroller.append(
    createMessage(`history-${index}`, `Earlier transcript message ${index}. ${'Context '.repeat(8)}`),
  );
}
scroller.busy = true;

window.appendAnchoredTurn = () => {
  const message = createMessage('new-turn', 'Start a newly anchored turn.', true);
  const existing = [...scroller.querySelectorAll('ds-message')].at(-1);
  existing.after(message);
  return message;
};

window.prependHistory = () => {
  const message = createMessage('older-history', 'An older history item.');
  scroller.querySelector('ds-message').before(message);
};

let growth = 0;
window.growLatestMessage = () => {
  growth += 1;
  const message = [...scroller.querySelectorAll('ds-message')].at(-1);
  message.style.minHeight = `${message.getBoundingClientRect().height + 160}px`;
  message.dataset.growth = String(growth);
};

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

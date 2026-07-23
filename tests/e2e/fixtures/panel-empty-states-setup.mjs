import '/dist/components/ds-conversation-list.js';
import '/dist/components/ds-empty-state.js';
import '/dist/components/ds-scroll-overlay.js';

await Promise.all([
  customElements.whenDefined('ds-conversation-list'),
  customElements.whenDefined('ds-empty-state'),
  customElements.whenDefined('ds-scroll-overlay'),
]);

const conversations = document.querySelector('#conversations');
const lateEmptyState = document.createElement('ds-empty-state');
lateEmptyState.slot = 'empty';
lateEmptyState.heading = 'No conversations';
lateEmptyState.body = 'Start one when you are ready.';
conversations.append(lateEmptyState);

const activity = document.querySelector('#activity');
const lateActivityEmptyState = document.createElement('ds-empty-state');
lateActivityEmptyState.slot = 'empty';
lateActivityEmptyState.heading = 'No activity';
lateActivityEmptyState.body = 'New activity will appear here.';
activity.append(lateActivityEmptyState);

document.documentElement.dataset.ready = 'true';

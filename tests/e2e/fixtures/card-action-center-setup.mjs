import '/dist/components/ds-card-action-center.js';

await customElements.whenDefined('ds-card-action-center');

const card = document.querySelector('#action-center');
card.sections = [
  {
    id: 'action-center',
    heading: 'Action center',
    items: [
      {
        id: 'events-to-review',
        label: 'Events to review',
        value: 44,
        tag: { intent: 'negative', contrast: 'faint' },
      },
      {
        id: 'speeding-events-to-review',
        label: 'Speeding events to review',
        value: 41,
        tag: { intent: 'negative' },
      },
      {
        id: 'dashcam-issues',
        label: 'Dashcam issues',
        value: 182,
        tag: { intent: 'negative' },
      },
      {
        id: 'ai-omnicam-issues',
        label: 'AI Omnicam issues',
        value: 59,
        tag: { intent: 'negative' },
      },
    ],
  },
  {
    id: 'reports',
    heading: 'Reports',
    items: [
      {
        id: 'score-trend',
        label: 'Safety Score trend',
        href: '/reports/safety-score-trend',
      },
      { id: 'score-factors', label: 'Safety Score factors' },
      { id: 'leaderboard', label: 'Performance leaderboard' },
      { id: 'event-report', label: 'Safety event report' },
    ],
  },
  {
    id: 'links',
    heading: 'Links',
    items: [
      { id: 'video-requests', label: 'Video requests' },
      { id: 'connection-history', label: 'Connection history' },
      { id: 'camera-support', label: 'Camera support', isInactive: true },
    ],
  },
];

window.__cardActionCenterEvents = [];
card.addEventListener('dsAction', event => {
  window.__cardActionCenterEvents.push({
    sectionId: event.detail.sectionId,
    itemId: event.detail.itemId,
    label: event.detail.item.label,
    href: event.detail.href,
    hasOriginalEvent: event.detail.originalEvent instanceof MouseEvent,
  });
  event.preventDefault();
});

document.documentElement.dataset.ready = 'true';

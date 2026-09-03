import '/dist/components/ds-card-navigation.js';

await customElements.whenDefined('ds-card-navigation');

window.__cardNavigationEvents = [];

for (const card of document.querySelectorAll('ds-card-navigation')) {
  card.addEventListener('dsNavigate', event => {
    window.__cardNavigationEvents.push({
      href: event.detail.href,
      hasOriginalEvent: event.detail.originalEvent instanceof MouseEvent,
    });
    event.preventDefault();
  });
}

document.documentElement.dataset.ready = 'true';

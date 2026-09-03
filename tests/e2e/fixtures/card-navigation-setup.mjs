import '/dist/components/ds-card-navigation.js';
import '/dist/components/ds-card-settings-scope.js';
import '/dist/components/ds-menu.js';

await customElements.whenDefined('ds-card-navigation');
await customElements.whenDefined('ds-card-settings-scope');
await customElements.whenDefined('ds-menu');

const scope = document.querySelector('ds-card-settings-scope');
const profileMenu = document.querySelector('#profile-menu');
scope.addEventListener('dsScopeRequest', event => {
  if (event.detail.scope !== 'profile') return;
  profileMenu.anchor = event.detail.anchor;
  profileMenu.initialFocusVisible = event.detail.originalEvent.detail === 0;
  profileMenu.open = true;
  scope.profileExpanded = true;
});
profileMenu.addEventListener('dsClose', () => {
  profileMenu.open = false;
  scope.profileExpanded = false;
});

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

import '/dist/components/ds-popover.js';

await customElements.whenDefined('ds-popover');

const closes = (window.popoverCloses = []);
for (const popover of document.querySelectorAll('ds-popover')) {
  const trigger = document.getElementById(popover.anchorId);
  trigger.addEventListener('click', () => (popover.open = !popover.open));
  popover.addEventListener('dsClose', event => closes.push(event.detail.reason));
}

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

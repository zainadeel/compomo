import '/dist/components/ds-tooltip.js';

await customElements.whenDefined('ds-tooltip');

document.getElementById('swap-trigger').addEventListener('click', () => {
  const tooltip = document.getElementById('dynamic-tooltip');
  const replacement = document.createElement('button');
  replacement.id = 'dynamic-anchor-b';
  replacement.textContent = 'Replacement trigger';
  tooltip.style.marginLeft = '240px';
  tooltip.replaceChildren(replacement);
});

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

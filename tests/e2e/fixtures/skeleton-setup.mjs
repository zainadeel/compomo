import '/dist/components/ds-skeleton.js';

await customElements.whenDefined('ds-skeleton');
document.querySelector('#control').width = 160;
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

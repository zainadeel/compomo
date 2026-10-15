import '/dist/components/ds-disclosure.js';

await customElements.whenDefined('ds-disclosure');

const toggles = (window.disclosureToggles = []);
document.getElementById('alerts').addEventListener('dsToggle', event => toggles.push(event.detail));

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

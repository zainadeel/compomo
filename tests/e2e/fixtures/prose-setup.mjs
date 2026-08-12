import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-agent-tool-call.js';
import '/dist/components/ds-markdown.js';

document.getElementById('agent-tool-call').input = { period: '30 days' };
document.getElementById('agent-tool-call').output = { matches: 12 };

await Promise.all([
  customElements.whenDefined('ds-agent-tool-call'),
  customElements.whenDefined('ds-button-filled'),
  customElements.whenDefined('ds-markdown'),
]);

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

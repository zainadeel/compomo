import { registerIcons } from '/dist/lib/utils/index.js';
import '/dist/components/ds-icon.js';
import '/dist/components/ds-markdown.js';

window.securityViolations = [];
document.addEventListener('securitypolicyviolation', event =>
  window.securityViolations.push(event.effectiveDirective)
);
registerIcons({
  SecurityGradient:
    '<svg viewBox="0 0 24 24"><defs><linearGradient id="paint"><stop offset="0" stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient><clipPath id="clip"><rect width="24" height="24" rx="4"/></clipPath></defs><rect width="24" height="24" fill="url(#paint)" clip-path="url(#clip)"/></svg>',
});
let sequence = 0;
window.setSecurityIcon = svg => {
  const name = `SecurityCase${++sequence}`;
  registerIcons({ [name]: svg });
  document.querySelector('#dynamic').name = name;
};
document.querySelector('#markdown').content =
  '## Safe &amp; sound\n\n**Formatted** &copy; &#x2713; [Safe link](https://example.com/docs)';
await Promise.all(['ds-icon', 'ds-markdown'].map(tag => customElements.whenDefined(tag)));
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

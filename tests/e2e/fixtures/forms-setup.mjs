import '/dist/components/ds-input.js';
import '/dist/components/ds-field.js';
import '/dist/components/ds-checkbox.js';
import '/dist/components/ds-select.js';
import '/dist/components/ds-radio.js';
import '/dist/components/ds-switch.js';
import '/dist/components/ds-slider.js';

await Promise.all([
  'ds-input', 'ds-field', 'ds-checkbox', 'ds-select', 'ds-radio', 'ds-switch', 'ds-slider',
].map(tag => customElements.whenDefined(tag)));

document.getElementById('region').name = 'region';
document.getElementById('region').options = [
  { label: 'Canada', value: 'ca' },
  { label: 'United States', value: 'us' },
];
document.getElementById('tier').options = [
  { label: 'Standard', value: 'standard' },
  { label: 'Premium', value: 'premium' },
];
for (const size of ['md', 'sm', 'xs']) {
  document.getElementById(`radio-${size}`).options = [
    { label: `${size} selected`, value: 'selected' },
    { label: `${size} unselected`, value: 'unselected' },
  ];
}
const rangeSlider = document.getElementById('slider-range');
rangeSlider.value = [20, 80];
rangeSlider.step = 2;
rangeSlider.minStepsBetweenValues = 5;
rangeSlider.startLabel = 'Minimum price';
rangeSlider.endLabel = 'Maximum price';

window.__sliderEvents = { change: [], commit: [] };
document.getElementById('slider-single').addEventListener('dsChange', event => {
  window.__sliderEvents.change.push(event.detail);
});
document.getElementById('slider-single').addEventListener('dsCommit', event => {
  window.__sliderEvents.commit.push(event.detail);
});

document.getElementById('profile').addEventListener('submit', event => {
  event.preventDefault();
  window.__submitted = Object.fromEntries(new FormData(event.currentTarget));
});
document.documentElement.dataset.ready = 'true';

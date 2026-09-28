import '/dist/components/ds-button-filled.js';
import '/dist/components/ds-button-unfilled.js';
import '/dist/components/ds-input.js';
import '/dist/components/ds-textarea.js';
import '/dist/components/ds-input-date.js';
import '/dist/components/ds-input-time.js';
import '/dist/components/ds-message-composer.js';
import '/dist/components/ds-menu.js';
import '/dist/components/ds-table.js';
import '/dist/components/ds-chart.js';
import '/dist/components/ds-card-overview.js';
import '/dist/components/ds-modal.js';
import '/dist/components/ds-text.js';
import { barY, defineChart, resolveCssLengthPx } from '/dist/lib/utils/index.js';
import { scaleBand, scaleLinear } from 'd3-scale';

window.resolveResponsiveLength = value => resolveCssLengthPx(value, -999);
const menu = document.getElementById('menu');
menu.items = [{ value: 'edit', label: 'Edit review', icon: 'Pencil' }, { value: 'archive', label: 'Archive review' }];
document.getElementById('menu-trigger').addEventListener('click', () => { menu.open = !menu.open; });
menu.addEventListener('dsClose', () => { menu.open = false; });
const table = document.getElementById('table');
table.columns = [{ id: 'name', label: 'Driver', size: 'sm' }, { id: 'status', label: 'Status', size: 'sm' }];
table.rows = [{ id: 'one', cells: { name: 'Avery Chen', status: 'Available' } }];
table.displayedCount = 1;
table.totalCount = 1;
document.getElementById('chart').definition = defineChart({
  marks: [barY([{ id: 'mon', day: 'Mon', value: 3 }, { id: 'tue', day: 'Tue', value: 5 }], { id: 'events', key: 'id', x: 'day', y: 'value' })],
  x: { scale: scaleBand, axis: { label: 'Day' } },
  y: { scale: scaleLinear, axis: { label: 'Events' } },
});
await Promise.all([...document.querySelectorAll('*')].filter(el => el.localName.startsWith('ds-')).map(el => customElements.whenDefined(el.localName)));
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

import '@ds-mo/tokens/css';
import { createApp, h, ref } from 'vue';
import { DsInput, DsSwitch, DsModal, DsButtonFilled, DsShellApp } from '@ds-mo/ui/vue';

const value = ref('initial');
const checked = ref(false);
const mounted = ref(true);
const open = ref(false);
const state = {
  events: [],
  setValue: next => {
    value.value = next;
  },
  setMounted: next => {
    mounted.value = next;
  },
};
createApp({
  setup() {
    return () =>
      h(DsShellApp, { id: 'shell', composition: 'slotted', style: { height: '700px' } }, () =>
        h('main', null, [
          mounted.value &&
            h(DsInput, {
              id: 'text',
              ariaLabel: 'Name',
              modelValue: value.value,
              'onUpdate:modelValue': next => {
                value.value = next;
              },
              onDsChange: event => state.events.push(event.detail),
            }),
          h(DsSwitch, {
            id: 'switch',
            'aria-label': 'Enabled',
            modelValue: checked.value,
            'onUpdate:modelValue': next => {
              checked.value = next;
            },
          }),
          h(DsButtonFilled, {
            id: 'open',
            label: 'Open review',
            onClick: () => {
              open.value = true;
            },
          }),
          h(
            DsModal,
            {
              heading: 'Review',
              open: open.value,
              onDsClose: () => {
                open.value = false;
              },
            },
            () => h('p', null, 'Review the changes.')
          ),
          h('output', { id: 'value' }, value.value),
          h('output', { id: 'checked' }, String(checked.value)),
        ])
      );
  },
}).mount('consumer-root');
window.consumer = state;
document.documentElement.dataset.ready = 'true';

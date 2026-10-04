import '@ds-mo/tokens/css';
import { createElement as h, createRef, StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DsInput, DsModal, DsButtonFilled, DsShellApp } from '@ds-mo/ui/react';

const inputRef = createRef();
const state = { events: [], inputRef };
function Consumer() {
  const [value, setValue] = useState('initial');
  const [mounted, setMounted] = useState(true);
  const [open, setOpen] = useState(false);
  Object.assign(state, { setValue, setMounted, setOpen });
  return h(
    DsShellApp,
    { id: 'shell', composition: 'slotted', style: { height: '700px' } },
    h(
      'main',
      null,
      mounted &&
        h(DsInput, {
          id: 'text',
          ariaLabel: 'Name',
          value,
          ref: inputRef,
          onDsChange: event => {
            state.events.push(event.detail);
            setValue(event.detail);
          },
        }),
      h(DsButtonFilled, { id: 'open', label: 'Open review', onClick: () => setOpen(true) }),
      h(
        DsModal,
        { heading: 'Review', open, onDsClose: () => setOpen(false) },
        h('p', null, 'Review the changes.')
      ),
      h('output', { id: 'value' }, value)
    )
  );
}
const root = createRoot(document.querySelector('consumer-root'));
root.render(h(StrictMode, null, h(Consumer)));
window.consumer = state;
document.documentElement.dataset.ready = 'true';

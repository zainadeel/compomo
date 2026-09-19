// Observe the real ElementInternals API without replacing browser form behavior.
// State restoration timing is browser-owned, so tests replay the recorded state
// through the registered custom-element lifecycle callback deterministically.
const internalsByHost = new WeakMap();
const stateByInternals = new WeakMap();
const attachInternals = HTMLElement.prototype.attachInternals;
HTMLElement.prototype.attachInternals = function () {
  const internals = attachInternals.call(this);
  internalsByHost.set(this, internals);
  return internals;
};
const setFormValue = ElementInternals.prototype.setFormValue;
ElementInternals.prototype.setFormValue = function (...args) {
  const result = setFormValue.apply(this, args);
  stateByInternals.set(this, args.length > 1 ? args[1] : args[0]);
  return result;
};

for (const tag of [
  'input',
  'textarea',
  'input-date',
  'input-time',
  'checkbox',
  'switch',
  'radio',
  'radio-tile',
  'select',
  'slider',
])
  await import(/* @vite-ignore */ `/dist/components/ds-${tag}.js`);

window.formContracts = {
  mount(cases) {
    for (const { id, tag, props, initial } of cases) {
      const control = document.createElement(`ds-${tag}`);
      control.id = id;
      control.name = id;
      control.setAttribute('aria-label', id);
      Object.assign(control, props, initial);
      control.addEventListener('dsChange', () => {
        control.dataset.changes = String(Number(control.dataset.changes || 0) + 1);
      });
      document.querySelector('#controls').append(control);
    }
  },
  inspect(id) {
    const control = document.getElementById(id);
    const internals = internalsByHost.get(control);
    return {
      state: stateByInternals.get(internals),
      owner: internals.form?.id ?? null,
      valid: internals.validity.valid,
      message: internals.validationMessage,
      changes: Number(control.dataset.changes || 0),
    };
  },
  restore(id, state) {
    document.getElementById(id).formStateRestoreCallback(state, 'restore');
  },
};
document.documentElement.dataset.ready = 'true';

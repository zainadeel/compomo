import '/dist/components/ds-toast.js';
import { createToastManager } from '/dist/lib/toast/index.js';

await customElements.whenDefined('ds-toast');

const toast = document.getElementById('toast');
const manager = createToastManager();
toast.manager = manager;
toast.limit = 2;

window.__toastEvents = {
  actions: [],
  closes: [],
  removes: [],
};

toast.addEventListener('dsToastAction', event => {
  window.__toastEvents.actions.push(event.detail.id);
});
toast.addEventListener('dsToastClose', event => {
  window.__toastEvents.closes.push({
    id: event.detail.id,
    reason: event.detail.reason,
  });
});
toast.addEventListener('dsToastRemove', event => {
  window.__toastEvents.removes.push(event.detail.id);
});

window.__toastManager = manager;
window.__createToastManager = createToastManager;
window.__addToast = options =>
  manager.add({
    ...options,
    action: options.actionLabel
      ? {
          label: options.actionLabel,
          onAction: ({ id }) => {
            window.__toastEvents.actions.push(`callback:${id}`);
          },
        }
      : undefined,
  });

let resolvePromise;
window.__startToastPromise = () => {
  const promise = new Promise(resolve => {
    resolvePromise = resolve;
  });
  void manager.promise(promise, {
    loading: {
      title: 'Uploading',
      description: 'The report is uploading.',
    },
    success: value => ({
      title: 'Uploaded',
      description: value,
      timeout: 0,
    }),
    error: 'Upload failed',
  });
};
window.__resolveToastPromise = value => resolvePromise?.(value);

document.documentElement.dataset.ready = 'true';

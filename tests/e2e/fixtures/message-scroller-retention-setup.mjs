import '/dist/components/ds-message-scroller.js';

await customElements.whenDefined('ds-message-scroller');

const scroller = document.querySelector('#retention-scroller');

function createMessage(id) {
  const message = document.createElement('ds-message');
  message.setAttribute('message-id', id);
  message.textContent = `Transcript message ${id}`;
  return message;
}

for (let index = 0; index < 12; index += 1) {
  scroller.append(createMessage(`initial-${index}`));
}

window.replaceRetentionTranscript = () => {
  const previous = [...scroller.querySelectorAll('ds-message')];
  window.replacedTranscriptWeakRefs = previous.map(element => new WeakRef(element));
  previous.forEach(element => element.remove());
  for (let index = 0; index < 12; index += 1) {
    scroller.append(createMessage(`replacement-${index}`));
  }
  return previous.length;
};

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
document.documentElement.dataset.ready = 'true';

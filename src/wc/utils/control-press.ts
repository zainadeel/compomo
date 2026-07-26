const ELEVATED_PRESS_SELECTOR = '.ds-control-elevation--press-scale';
const ELEVATED_PRESS_ATTRIBUTE = 'data-ds-press-active';

const activeElevatedPresses = new WeakMap<HTMLElement, () => void>();

/**
 * Transfers an eligible button pointer press to its elevated wrapper.
 *
 * The wrapper cannot rely on `:active`: Chromium also activates ancestors of a
 * disabled native button. Window-level release cleanup preserves the native
 * release-outside behavior without changing pointer capture or click delivery.
 */
export function beginElevatedControlPress(
  event: PointerEvent,
  eligible: boolean,
): void {
  if (!eligible || event.button !== 0) return;

  const target = event.currentTarget as HTMLElement | null;
  const wrapper = target?.closest<HTMLElement>(ELEVATED_PRESS_SELECTOR);
  const view = target?.ownerDocument.defaultView;
  if (!wrapper || !view) return;

  activeElevatedPresses.get(wrapper)?.();
  wrapper.setAttribute(ELEVATED_PRESS_ATTRIBUTE, '');

  const finish = () => {
    wrapper.removeAttribute(ELEVATED_PRESS_ATTRIBUTE);
    view.removeEventListener('pointerup', finish);
    view.removeEventListener('pointercancel', finish);
    view.removeEventListener('blur', finish);
    activeElevatedPresses.delete(wrapper);
  };

  activeElevatedPresses.set(wrapper, finish);
  view.addEventListener('pointerup', finish);
  view.addEventListener('pointercancel', finish);
  view.addEventListener('blur', finish);
}

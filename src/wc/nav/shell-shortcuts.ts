import type { PanelToolsToolId } from '../components/PanelTools/panel-tools-types';

export type ShellShortcutAction =
  | 'toggle-panel-nav'
  | 'close-panel-tools'
  | `open-tool:${PanelToolsToolId}`;

const TOOL_SHORTCUT_KEYS: Record<string, PanelToolsToolId> = {
  k: 'search',
  a: 'agents',
  s: 'stacks',
  m: 'messages',
  n: 'activity',
};

/** Tool shortcut keys (K/A/S/M/N/?) toggle open/closed via `ds-panel-tools.activateTool`. */

/** True when no modifier keys are held — avoids browser/app chords like ⌘N. */
export function isBareShellShortcutKey(
  e: Pick<KeyboardEvent, 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>,
): boolean {
  return !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;
}

/** Skip shell shortcuts while typing in an editable control. */
export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;
  if (!('closest' in target) || typeof target.closest !== 'function') return false;

  const el = target as Element & { isContentEditable?: boolean };

  const editable = el.closest(
    'input, textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]',
  );
  if (editable) return true;

  const role = el.getAttribute('role');
  if (role === 'textbox' || role === 'combobox' || role === 'searchbox') return true;

  return Boolean(el.isContentEditable);
}

function normalizedShortcutKey(e: Pick<KeyboardEvent, 'key' | 'code'>): string {
  if (e.key === '[' || e.code === 'BracketLeft') return '[';
  if (e.key === ']' || e.code === 'BracketRight') return ']';
  return e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
}

/** Resolve a shell chrome shortcut, or `null` when the key is not handled. */
export function resolveShellShortcut(
  e: Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>,
): ShellShortcutAction | null {
  if (
    (e.key === '?' || (e.code === 'Slash' && e.shiftKey)) &&
    !e.metaKey && !e.ctrlKey && !e.altKey
  ) {
    return 'open-tool:help';
  }
  if (!isBareShellShortcutKey(e)) return null;

  const key = normalizedShortcutKey(e);
  if (key === '[') return 'toggle-panel-nav';
  if (key === ']') return 'close-panel-tools';

  const toolId = TOOL_SHORTCUT_KEYS[key];
  if (toolId) return `open-tool:${toolId}`;

  return null;
}

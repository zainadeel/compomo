import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isBareShellShortcutKey,
  isEditableShortcutTarget,
  resolveShellShortcut,
} from '../src/wc/nav/shell-shortcuts';

function keyEvent(
  init: Partial<KeyboardEvent> & Pick<KeyboardEvent, 'key'>,
): Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'> {
  return {
    code: '',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...init,
  };
}

describe('isBareShellShortcutKey', () => {
  it('accepts unmodified keys only', () => {
    assert.equal(isBareShellShortcutKey(keyEvent({ key: 'k' })), true);
    assert.equal(isBareShellShortcutKey(keyEvent({ key: 'k', metaKey: true })), false);
    assert.equal(isBareShellShortcutKey(keyEvent({ key: 'k', ctrlKey: true })), false);
    assert.equal(isBareShellShortcutKey(keyEvent({ key: 'k', shiftKey: true })), false);
    assert.equal(isBareShellShortcutKey(keyEvent({ key: 'k', altKey: true })), false);
  });
});

describe('resolveShellShortcut', () => {
  it('maps panel and tool keys without modifiers', () => {
    assert.equal(resolveShellShortcut(keyEvent({ key: '[' })), 'toggle-panel-nav');
    assert.equal(
      resolveShellShortcut(keyEvent({ key: '[', code: 'BracketLeft' })),
      'toggle-panel-nav',
    );
    assert.equal(resolveShellShortcut(keyEvent({ key: ']' })), 'close-panel-tools');
    assert.equal(
      resolveShellShortcut(keyEvent({ key: ']', code: 'BracketRight' })),
      'close-panel-tools',
    );
    assert.equal(resolveShellShortcut(keyEvent({ key: 'k' })), 'open-tool:search');
    assert.equal(resolveShellShortcut(keyEvent({ key: 'a' })), 'open-tool:agents');
    assert.equal(resolveShellShortcut(keyEvent({ key: 's' })), 'open-tool:stacks');
    assert.equal(resolveShellShortcut(keyEvent({ key: 'm' })), 'open-tool:messages');
    assert.equal(resolveShellShortcut(keyEvent({ key: 'n' })), 'open-tool:activity');
  });

  it('maps every tool shortcut key', () => {
    const keys: Array<[string, string]> = [
      ['k', 'search'],
      ['a', 'agents'],
      ['s', 'stacks'],
      ['m', 'messages'],
      ['n', 'activity'],
    ];
    for (const [key, tool] of keys) {
      assert.equal(resolveShellShortcut(keyEvent({ key })), `open-tool:${tool}`);
    }
  });

  it('ignores modified keys to avoid browser chords', () => {
    assert.equal(resolveShellShortcut(keyEvent({ key: 'k', metaKey: true })), null);
    assert.equal(resolveShellShortcut(keyEvent({ key: 'n', metaKey: true })), null);
    assert.equal(resolveShellShortcut(keyEvent({ key: '[', ctrlKey: true })), null);
  });
});

describe('isEditableShortcutTarget', () => {
  it('returns true when inside an editable selector', () => {
    const input = { tagName: 'INPUT' } as Element;
    const target = {
      closest: (selector: string) => (selector.includes('input') ? input : null),
      getAttribute: () => null,
      isContentEditable: false,
    } as unknown as HTMLElement;

    assert.equal(isEditableShortcutTarget(target), true);
  });

  it('returns true for contenteditable and textbox roles', () => {
    const editable = {
      closest: () => null,
      getAttribute: () => null,
      isContentEditable: true,
    } as unknown as HTMLElement;
    assert.equal(isEditableShortcutTarget(editable), true);

    const textbox = {
      closest: () => null,
      getAttribute: (name: string) => (name === 'role' ? 'textbox' : null),
      isContentEditable: false,
    } as unknown as HTMLElement;
    assert.equal(isEditableShortcutTarget(textbox), true);
  });

  it('returns false for inert elements', () => {
    const button = {
      closest: () => null,
      getAttribute: () => null,
      isContentEditable: false,
    } as unknown as HTMLElement;
    assert.equal(isEditableShortcutTarget(button), false);
    assert.equal(isEditableShortcutTarget(null), false);
  });
});

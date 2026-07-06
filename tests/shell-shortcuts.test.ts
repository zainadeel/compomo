import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isEditableShortcutTarget,
  isShellShortcutModifier,
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

describe('isShellShortcutModifier', () => {
  it('accepts meta or ctrl without alt/shift', () => {
    assert.equal(isShellShortcutModifier(keyEvent({ key: 'k', metaKey: true })), true);
    assert.equal(isShellShortcutModifier(keyEvent({ key: 'k', ctrlKey: true })), true);
    assert.equal(isShellShortcutModifier(keyEvent({ key: 'k', metaKey: true, shiftKey: true })), false);
    assert.equal(isShellShortcutModifier(keyEvent({ key: 'k', metaKey: true, altKey: true })), false);
    assert.equal(isShellShortcutModifier(keyEvent({ key: 'k' })), false);
  });
});

describe('resolveShellShortcut', () => {
  it('maps panel and tool chords', () => {
    assert.equal(
      resolveShellShortcut(keyEvent({ key: '[', metaKey: true })),
      'toggle-panel-nav',
    );
    assert.equal(
      resolveShellShortcut(keyEvent({ key: '[', code: 'BracketLeft', metaKey: true })),
      'toggle-panel-nav',
    );
    assert.equal(resolveShellShortcut(keyEvent({ key: 'k', metaKey: true })), 'open-tool:search');
    assert.equal(resolveShellShortcut(keyEvent({ key: 'a', metaKey: true })), 'open-tool:agents');
    assert.equal(resolveShellShortcut(keyEvent({ key: 's', metaKey: true })), 'open-tool:stacks');
    assert.equal(resolveShellShortcut(keyEvent({ key: 'm', metaKey: true })), 'open-tool:messages');
    assert.equal(resolveShellShortcut(keyEvent({ key: 'n', metaKey: true })), 'open-tool:activity');
  });

  it('ignores unmodified keys', () => {
    assert.equal(resolveShellShortcut(keyEvent({ key: 'k' })), null);
    assert.equal(resolveShellShortcut(keyEvent({ key: 'Enter' })), null);
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

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  composedContains,
  isDocumentRootNode,
  paginationShortcutBlockedByPath,
  shouldHandleContainingPagePaginationShortcut,
} from '../src/wc/components/Table/table-pagination-shortcut';

test('blocks arrows that originate in choice, menu, or editable controls', () => {
  assert.equal(paginationShortcutBlockedByPath([{ tagName: 'BUTTON' }]), false);
  assert.equal(paginationShortcutBlockedByPath([{ tagName: 'DS-SELECT' }]), true);
  assert.equal(paginationShortcutBlockedByPath([{ tagName: 'DS-MENU' }]), true);
  assert.equal(paginationShortcutBlockedByPath([{ tagName: 'DS-FILTER-MENU' }]), true);
  assert.equal(paginationShortcutBlockedByPath([{ tagName: 'INPUT' }]), true);
  assert.equal(
    paginationShortcutBlockedByPath([{ tagName: 'DIV', isContentEditable: true }]),
    true,
  );
  assert.equal(
    paginationShortcutBlockedByPath([
      { tagName: 'DIV', getAttribute: name => (name === 'role' ? 'combobox' : null) },
    ]),
    true,
  );
});

test('walks light parents and assigned slots when resolving composed ancestry', () => {
  const scroller = { tagName: 'DIV' };
  const slot = { tagName: 'SLOT', parentNode: scroller };
  const table = { tagName: 'DS-TABLE', assignedSlot: slot, parentNode: { tagName: 'BODY' } };

  assert.equal(composedContains(scroller, table), true);
  assert.equal(composedContains(table, scroller), false);
  assert.equal(composedContains(scroller, scroller), false);
});

test('handles arrows from a containing page scroller or in-table focus, not body', () => {
  const scroller = { tagName: 'DIV' };
  const table = { tagName: 'DS-TABLE', parentNode: scroller };
  const innerControl = { tagName: 'BUTTON', parentNode: table };

  assert.equal(
    shouldHandleContainingPagePaginationShortcut({
      origin: scroller,
      table,
      eventPath: [scroller],
    }),
    true,
  );
  assert.equal(
    shouldHandleContainingPagePaginationShortcut({
      origin: innerControl,
      table,
      eventPath: [innerControl, table],
    }),
    true,
  );
  assert.equal(
    shouldHandleContainingPagePaginationShortcut({
      origin: { tagName: 'BODY' },
      table,
      eventPath: [{ tagName: 'BODY' }],
    }),
    false,
  );
  assert.equal(isDocumentRootNode({ tagName: 'HTML' }), true);
});

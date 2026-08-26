import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assignTableVirtualRowPoolKeys,
  type TableVirtualRowPoolState,
} from '../src/wc/components/Table/table-body-renderer';
import type { TableVirtualNode } from '../src/wc/components/Table/table-virtual-model';

function row(index: number, id: string): Extract<TableVirtualNode, { kind: 'row' }> {
  return {
    kind: 'row',
    index,
    item: {
      kind: 'row',
      id: `row:${id}`,
      rowId: id,
      estimatedSize: 40,
      variableSize: false,
    },
  };
}

test('keeps retained virtual rows on stable pool slots', () => {
  const state: TableVirtualRowPoolState = { slotsByRowId: new Map(), nextSlot: 0 };
  const first = assignTableVirtualRowPoolKeys([row(4, 'a'), row(5, 'b'), row(6, 'c')], state);
  const next = assignTableVirtualRowPoolKeys([row(5, 'b'), row(6, 'c'), row(7, 'd')], state);

  assert.equal(first.get(5), 'virtual-row-slot-1');
  assert.equal(first.get(6), 'virtual-row-slot-2');
  assert.equal(next.get(5), 'virtual-row-slot-1');
  assert.equal(next.get(6), 'virtual-row-slot-2');
});

test('reuses released virtual row slots before growing the pool', () => {
  const state: TableVirtualRowPoolState = { slotsByRowId: new Map(), nextSlot: 0 };
  assignTableVirtualRowPoolKeys([row(0, 'a'), row(1, 'b'), row(2, 'c')], state);
  const next = assignTableVirtualRowPoolKeys([row(2, 'c'), row(3, 'd'), row(4, 'e')], state);

  assert.equal(next.get(2), 'virtual-row-slot-2');
  assert.equal(next.get(3), 'virtual-row-slot-0');
  assert.equal(next.get(4), 'virtual-row-slot-1');
  assert.equal(state.nextSlot, 3);
  assert.deepEqual([...state.slotsByRowId.keys()], ['c', 'd', 'e']);
});

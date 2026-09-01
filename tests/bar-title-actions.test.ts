import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  barTitleActionIdIssues,
  overflowBarTitleActionSections,
  resolveBarTitleActionItems,
  visibleBarTitleActions,
} from '../src/wc/components/BarTitle/bar-title-actions';
import type { BarTitleActionConfigItem } from '../src/wc/components/BarTitle/bar-title-types';

const actions: BarTitleActionConfigItem[] = [
  {
    type: 'button',
    id: 'create',
    label: 'Create driver',
    appearance: 'filled',
  },
  {
    type: 'button',
    id: 'export',
    label: 'Export',
    appearance: 'unfilled',
  },
  {
    type: 'icon',
    id: 'refresh',
    label: 'Refresh',
    icon: 'Refresh',
    ariaLabel: 'Refresh drivers',
  },
  {
    type: 'menu',
    id: 'view',
    label: 'View',
    choices: [
      { id: 'view-list', label: 'List' },
      { id: 'view-map', label: 'Map' },
    ],
  },
  {
    type: 'split',
    id: 'add',
    label: 'Add driver',
    menuAriaLabel: 'More add options',
    choices: [{ id: 'import', label: 'Import drivers' }],
  },
  { type: 'divider' },
  { type: 'overflow', id: 'archive', label: 'Archive drivers' },
];

describe('BarTitle ordered actions', () => {
  it('adapts legacy primaryAction and actions without changing their ids or order', () => {
    assert.deepEqual(
      resolveBarTitleActionItems(undefined, { id: 'create', label: 'Create', type: 'submit' }, [
        { id: 'export', label: 'Export' },
        { type: 'divider' },
      ]),
      [
        {
          id: 'create',
          label: 'Create',
          type: 'button',
          buttonType: 'submit',
          appearance: 'filled',
        },
        { id: 'export', label: 'Export', type: 'overflow' },
        { type: 'divider' },
      ]
    );
  });

  it('keeps only the first eligible action visible and moves the rest into text-only overflow', () => {
    assert.deepEqual(
      visibleBarTitleActions(actions, 'expanded').map(item => ('id' in item ? item.id : 'divider')),
      ['create']
    );
    const expandedOverflow = overflowBarTitleActionSections(actions, 'expanded');
    assert.deepEqual(
      expandedOverflow.map(section =>
        'items' in section ? section.items.map(item => item.value) : []
      ),
      [['export', 'refresh', 'view-list', 'view-map', 'add', 'import'], ['archive']]
    );
    assert.equal(
      expandedOverflow.every(
        section => !('items' in section) || section.items.every(item => item.icon === undefined)
      ),
      true
    );

    assert.deepEqual(visibleBarTitleActions(actions, 'constrained'), []);
    assert.deepEqual(
      overflowBarTitleActionSections(actions, 'constrained').map(section =>
        'items' in section ? section.items.map(item => item.value) : []
      ),
      [['create', 'export', 'refresh', 'view-list', 'view-map', 'add', 'import'], ['archive']]
    );
  });

  it('keeps icon commands visible on mobile and flattens labeled menus and split actions', () => {
    assert.deepEqual(
      visibleBarTitleActions(actions, 'mobile').map(item => ('id' in item ? item.id : 'divider')),
      ['refresh']
    );
    assert.deepEqual(
      overflowBarTitleActionSections(actions, 'mobile').map(section =>
        'items' in section ? section.items.map(item => item.value) : []
      ),
      [['create', 'export', 'view-list', 'view-map', 'add', 'import'], ['archive']]
    );
  });

  it('reports blank and duplicate ids across top-level actions and nested choices', () => {
    assert.deepEqual(
      barTitleActionIdIssues([
        {
          type: 'menu',
          id: 'export',
          label: 'Export',
          choices: [
            { id: '', label: 'Blank' },
            { id: 'export', label: 'Duplicate' },
          ],
        },
      ]),
      ['Action ids must be non-empty.', 'Duplicate action id: export']
    );
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  countPanelNavItems,
  deriveActiveIdFromUrl,
  hrefMatchesPath,
  parsePanelNavGroups,
  shouldResyncPanelNavGroups,
} from '../src/wc/components/PanelNav/panel-nav-utils';
import type { PanelNavGroup, PanelNavItem } from '../src/wc/components/PanelNav/PanelNav';

const ITEMS: PanelNavItem[] = [
  { id: 'fleet-view', icon: 'MapPage', label: 'Fleet View', href: '/dashboard/fleet-view' },
  { id: 'cards', icon: 'Card', label: 'Cards', href: '/dashboard/fleet-cards' },
  { id: 'safety', icon: 'ShieldCircle', label: 'Safety', href: '/dashboard/safety' },
];

describe('hrefMatchesPath', () => {
  it('matches exact paths', () => {
    assert.equal(hrefMatchesPath('/dashboard/safety', '/dashboard/safety'), true);
  });

  it('matches child paths at segment boundary', () => {
    assert.equal(hrefMatchesPath('/dashboard/safety/events', '/dashboard/safety'), true);
  });

  it('does not false-positive on sibling prefixes', () => {
    assert.equal(hrefMatchesPath('/dashboard/fleet-cards/overview', '/dashboard/fleet'), false);
  });
});

describe('shouldResyncPanelNavGroups', () => {
  const GROUPS: PanelNavGroup[] = [
    { items: [{ id: 'a', icon: 'MapPage', label: 'A' }] },
  ];

  it('returns true when parsed state is empty but host groups have items', () => {
    assert.equal(shouldResyncPanelNavGroups([], GROUPS), true);
  });

  it('returns false when parsed state already matches host groups', () => {
    assert.equal(shouldResyncPanelNavGroups(GROUPS, GROUPS), false);
  });

  it('returns false when both parsed and host groups are empty', () => {
    assert.equal(shouldResyncPanelNavGroups([], '[]'), false);
  });
});

describe('countPanelNavItems', () => {
  it('counts items across groups', () => {
    const groups = parsePanelNavGroups([
      { items: [{ id: 'a', icon: 'MapPage', label: 'A' }, { id: 'b', icon: 'MapPage', label: 'B' }] },
      { items: [{ id: 'c', icon: 'MapPage', label: 'C' }] },
    ]);
    assert.equal(countPanelNavItems(groups), 3);
  });
});

describe('deriveActiveIdFromUrl', () => {
  it('highlights fleet-view for nested tab routes', () => {
    assert.equal(deriveActiveIdFromUrl('/dashboard/fleet-view/live-map', ITEMS), 'fleet-view');
  });

  it('uses longest prefix when paths nest', () => {
    assert.equal(deriveActiveIdFromUrl('/dashboard/fleet-cards/overview', ITEMS), 'cards');
  });

  it('returns empty for root', () => {
    assert.equal(deriveActiveIdFromUrl('/', ITEMS), '');
  });
});

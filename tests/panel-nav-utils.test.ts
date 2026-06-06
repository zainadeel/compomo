import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveActiveIdFromUrl, hrefMatchesPath } from '../src/wc/components/PanelNav/panel-nav-utils';
import type { PanelNavItem } from '../src/wc/components/PanelNav/PanelNav';

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

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveBarNavValueFromUrl,
  shouldResyncBarNavProps,
} from '../src/wc/components/BarNav/bar-nav-utils';
import type { BarNavTab } from '../src/wc/components/BarNav/BarNav';

const SAFETY_TABS: BarNavTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'requests', label: 'Requests' },
];

const FUEL_TABS: BarNavTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'reports', label: 'Reports' },
];

describe('shouldResyncBarNavProps', () => {
  it('returns true when resolved tabs are empty but host tabs have items', () => {
    const tabs: BarNavTab[] = [{ id: 'overview', label: 'Overview' }];
    assert.equal(shouldResyncBarNavProps([], tabs, '', [], [], ''), true);
  });

  it('returns false when resolved tabs already match host tabs', () => {
    const tabs: BarNavTab[] = [{ id: 'overview', label: 'Overview' }];
    assert.equal(shouldResyncBarNavProps(tabs, tabs, '', [], [], ''), false);
  });

  it('returns true when resolved actions are empty but host actions have items', () => {
    const actions = [{ id: 'search', icon: 'MagnifyingGlass' }];
    assert.equal(shouldResyncBarNavProps([], [], '', [], actions, ''), true);
  });
});

describe('deriveBarNavValueFromUrl', () => {
  it('selects the active tab on tab routes', () => {
    const state = deriveBarNavValueFromUrl(
      '/dashboard/safety/events',
      '/dashboard/safety',
      SAFETY_TABS,
    );
    assert.equal(state.value, 'events');
    assert.equal(state.hideTabs, false);
  });

  it('hides tabs on non-tab child routes', () => {
    const state = deriveBarNavValueFromUrl(
      '/dashboard/safety/evt-123',
      '/dashboard/safety',
      SAFETY_TABS,
    );
    assert.equal(state.value, '');
    assert.equal(state.hideTabs, true);
  });

  it('defaults to the first tab on the section base path', () => {
    const state = deriveBarNavValueFromUrl('/dashboard/fuel', '/dashboard/fuel', FUEL_TABS);
    assert.equal(state.value, 'overview');
    assert.equal(state.hideTabs, false);
  });
});

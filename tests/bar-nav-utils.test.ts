import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveBarNavValueFromUrl,
  shouldResyncBarNavProps,
} from '../src/wc/components/BarNav/bar-nav-utils';
import type { BarNavTab } from '../src/wc/components/BarNav/bar-nav-types';

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
    assert.equal(shouldResyncBarNavProps([], tabs, ''), true);
  });

  it('returns false when resolved tabs already match host tabs', () => {
    const tabs: BarNavTab[] = [{ id: 'overview', label: 'Overview' }];
    assert.equal(shouldResyncBarNavProps(tabs, tabs, ''), false);
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

  it('skips dividers when defaulting to the first tab', () => {
    const tabs: BarNavTab[] = [
      { type: 'divider' },
      { id: 'overview', label: 'Overview' },
      { id: 'events', label: 'Events' },
    ];
    const state = deriveBarNavValueFromUrl('/dashboard/safety', '/dashboard/safety', tabs);
    assert.equal(state.value, 'overview');
    assert.equal(state.hideTabs, false);
  });

  it('skips dividers when matching URL segments', () => {
    const tabs: BarNavTab[] = [
      { id: 'live-map', label: 'Live Map' },
      { type: 'divider' },
      { id: 'events', label: 'Events' },
    ];
    const state = deriveBarNavValueFromUrl(
      '/dashboard/safety/events',
      '/dashboard/safety',
      tabs,
    );
    assert.equal(state.value, 'events');
    assert.equal(state.hideTabs, false);
  });

  it('can mis-select when tab ids collide across sections (host must sync props atomically)', () => {
    const marketplaceTabs: BarNavTab[] = [
      { id: 'browse', label: 'Browse' },
      { id: 'manage', label: 'Manage' },
    ];
    const analyticsTabs: BarNavTab[] = [
      { id: 'dashboards', label: 'Dashboards' },
      { id: 'browse', label: 'Browse' },
    ];
    const stale = deriveBarNavValueFromUrl(
      '/dashboard/marketplace/browse',
      '/dashboard/marketplace',
      analyticsTabs,
    );
    assert.equal(stale.value, 'browse');
    const fresh = deriveBarNavValueFromUrl(
      '/dashboard/analytics/dashboards',
      '/dashboard/analytics',
      analyticsTabs,
    );
    assert.equal(fresh.value, 'dashboards');
  });
});

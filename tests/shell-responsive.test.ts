import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  itemUsesShellInbox,
  resolveAvailableInboxTool,
  resolveManagedShellPageCapacity,
  resolveShellResponsiveMode,
  shellMobileDestinationForTool,
  shouldEmitMobileDestinationChange,
} from '../src/wc/shell/shell-responsive';

describe('itemUsesShellInbox', () => {
  it('lets explicit direct Activity metadata override the legacy id fallback', () => {
    assert.equal(itemUsesShellInbox({ id: 'activity', mobileDestination: 'activity' }), false);
    assert.equal(itemUsesShellInbox({ id: 'activity', mobileDestination: 'inbox' }), true);
    assert.equal(itemUsesShellInbox({ id: 'activity' }), true);
  });
});

describe('resolveShellResponsiveMode', () => {
  it('uses the fixed mobile, tablet, and desktop boundaries', () => {
    assert.equal(resolveShellResponsiveMode(767), 'mobile');
    assert.equal(resolveShellResponsiveMode(768), 'tablet');
    assert.equal(resolveShellResponsiveMode(1199), 'tablet');
    assert.equal(resolveShellResponsiveMode(1200), 'desktop');
  });
});

describe('resolveManagedShellPageCapacity', () => {
  it('derives page-header capacity only from the responsive breakpoint', () => {
    assert.equal(resolveManagedShellPageCapacity('desktop'), 'roomy');
    assert.equal(resolveManagedShellPageCapacity('tablet'), 'compact');
    assert.equal(resolveManagedShellPageCapacity('mobile'), 'compact');
  });
});

describe('shouldEmitMobileDestinationChange', () => {
  it('makes active destination reselect a no-op', () => {
    assert.equal(shouldEmitMobileDestinationChange('agents', 'agents', false), false);
    assert.equal(shouldEmitMobileDestinationChange('agents', 'search', false), true);
  });

  it('allows an active destination to dismiss an open navigation pane', () => {
    assert.equal(shouldEmitMobileDestinationChange('area', 'area', true), true);
  });
});

describe('shellMobileDestinationForTool', () => {
  it('maps global tools into the fixed mobile destinations', () => {
    assert.equal(shellMobileDestinationForTool(false, 'agents'), 'area');
    assert.equal(shellMobileDestinationForTool(true, 'search'), 'search');
    assert.equal(shellMobileDestinationForTool(true, 'agents'), 'agents');
    assert.equal(shellMobileDestinationForTool(true, 'messages'), 'messages');
    assert.equal(shellMobileDestinationForTool(true, 'stacks'), 'inbox');
    assert.equal(shellMobileDestinationForTool(true, 'activity'), 'inbox');
    assert.equal(shellMobileDestinationForTool(true, 'help'), 'help');
  });
});

describe('resolveAvailableInboxTool', () => {
  it('retains an available preferred segment and otherwise falls back predictably', () => {
    assert.equal(resolveAvailableInboxTool('activity', ['stacks', 'activity']), 'activity');
    assert.equal(resolveAvailableInboxTool('activity', ['stacks']), 'stacks');
    assert.equal(resolveAvailableInboxTool('messages', ['stacks', 'activity']), 'activity');
    assert.equal(resolveAvailableInboxTool('messages', ['search', 'agents']), '');
  });
});

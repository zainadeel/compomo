import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveAvailableInboxTool,
  resolveShellResponsiveMode,
  shellMobileDestinationForTool,
  shouldEmitMobileDestinationChange,
} from '../src/wc/shell/shell-responsive';

describe('resolveShellResponsiveMode', () => {
  it('uses the fixed mobile, tablet, and desktop boundaries', () => {
    assert.equal(resolveShellResponsiveMode(767), 'mobile');
    assert.equal(resolveShellResponsiveMode(768), 'tablet');
    assert.equal(resolveShellResponsiveMode(1199), 'tablet');
    assert.equal(resolveShellResponsiveMode(1200), 'desktop');
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
    assert.equal(shellMobileDestinationForTool(true, 'messages'), 'inbox');
    assert.equal(shellMobileDestinationForTool(true, 'stacks'), 'inbox');
    assert.equal(shellMobileDestinationForTool(true, 'activity'), 'inbox');
    assert.equal(shellMobileDestinationForTool(true, 'help'), 'area');
  });
});

describe('resolveAvailableInboxTool', () => {
  it('retains an available preferred segment and otherwise falls back predictably', () => {
    assert.equal(resolveAvailableInboxTool('activity', ['messages', 'activity']), 'activity');
    assert.equal(resolveAvailableInboxTool('activity', ['messages']), 'messages');
    assert.equal(resolveAvailableInboxTool('messages', ['stacks', 'activity']), 'stacks');
    assert.equal(resolveAvailableInboxTool('messages', ['search', 'agents']), '');
  });
});

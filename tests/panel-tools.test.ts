import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PANEL_TOOLS_LABELS, PANEL_TOOLS_PRIMARY_TOOL_ID, PANEL_TOOLS_TOOL_IDS } from '../src/wc/components/PanelTools/panel-tools-types';

describe('PANEL_TOOLS_TOOL_IDS', () => {
  it('lists search, agents, messages, stacks, and activity', () => {
    assert.deepEqual(PANEL_TOOLS_TOOL_IDS, [
      'search',
      'agents',
      'messages',
      'stacks',
      'activity',
    ]);
  });
});

describe('PANEL_TOOLS_PRIMARY_TOOL_ID', () => {
  it('places search in the rail header row', () => {
    assert.equal(PANEL_TOOLS_PRIMARY_TOOL_ID, 'search');
  });
});

describe('PANEL_TOOLS_LABELS', () => {
  it('maps tool ids to panel titles', () => {
    assert.equal(PANEL_TOOLS_LABELS.search, 'Search');
    assert.equal(PANEL_TOOLS_LABELS.messages, 'Messages');
    assert.equal(PANEL_TOOLS_LABELS.stacks, 'Stacks');
    assert.equal(PANEL_TOOLS_LABELS.activity, 'Activity');
    assert.equal(PANEL_TOOLS_LABELS.agents, 'Agents');
  });
});

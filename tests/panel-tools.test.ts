import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PANEL_TOOLS_FOOTER_TOOL_ID,
  PANEL_TOOLS_LABELS,
  PANEL_TOOLS_PRIMARY_TOOL_ID,
  PANEL_TOOLS_SHORTCUTS,
  PANEL_TOOLS_TOOL_IDS,
} from '../src/wc/components/PanelTools/panel-tools-types';
import {
  isPanelToolsToolId,
  orderPanelToolsItems,
  panelToolsDrawerAtTerminal,
  panelToolsDrawerResting,
  panelToolsDrawerTransitionMs,
  reconcilePanelToolsAvailability,
  resolvePanelToolActivation,
} from '../src/wc/components/PanelTools/panel-tools-utils';

describe('PANEL_TOOLS_TOOL_IDS', () => {
  it('lists search, agents, messages, stacks, activity, and help', () => {
    assert.deepEqual(PANEL_TOOLS_TOOL_IDS, [
      'search',
      'agents',
      'messages',
      'stacks',
      'activity',
      'help',
    ]);
  });
});

describe('PANEL_TOOLS_PRIMARY_TOOL_ID', () => {
  it('places search in the rail header row', () => {
    assert.equal(PANEL_TOOLS_PRIMARY_TOOL_ID, 'search');
  });
});

describe('PANEL_TOOLS_FOOTER_TOOL_ID', () => {
  it('places help flush to the rail footer', () => {
    assert.equal(PANEL_TOOLS_FOOTER_TOOL_ID, 'help');
  });
});

describe('PANEL_TOOLS_LABELS', () => {
  it('maps tool ids to panel titles', () => {
    assert.equal(PANEL_TOOLS_LABELS.search, 'Search');
    assert.equal(PANEL_TOOLS_LABELS.messages, 'Messages');
    assert.equal(PANEL_TOOLS_LABELS.stacks, 'Stacks');
    assert.equal(PANEL_TOOLS_LABELS.activity, 'Activity');
    assert.equal(PANEL_TOOLS_LABELS.agents, 'Agents');
    assert.equal(PANEL_TOOLS_LABELS.help, 'Help & Support');
  });
});

describe('PANEL_TOOLS_SHORTCUTS', () => {
  it('maps the fixed tool set to its public shell shortcuts', () => {
    assert.deepEqual(PANEL_TOOLS_SHORTCUTS, {
      search: 'K',
      agents: 'A',
      messages: 'M',
      stacks: 'S',
      activity: 'N',
      help: '/',
    });
  });
});

describe('orderPanelToolsItems', () => {
  it('enforces canonical order and removes duplicate semantic tools', () => {
    const help = { id: 'help' as const, icon: 'CircleQuestion' };
    const search = { id: 'search' as const, icon: 'MagnifyingGlass' };
    const messages = { id: 'messages' as const, icon: 'Messages' };
    assert.deepEqual(
      orderPanelToolsItems([help, messages, search, { ...messages, icon: 'Duplicate' }]),
      [search, messages, help]
    );
  });
});

describe('isPanelToolsToolId', () => {
  it('accepts only fixed tool ids for persisted state', () => {
    assert.equal(isPanelToolsToolId('agents'), true);
    assert.equal(isPanelToolsToolId('custom'), false);
    assert.equal(isPanelToolsToolId(null), false);
  });
});

describe('reconcilePanelToolsAvailability', () => {
  it('closes and clears a tool removed by authorization or entitlement changes', () => {
    assert.deepEqual(
      reconcilePanelToolsAvailability([{ id: 'search', icon: 'MagnifyingGlass' }], true, 'agents'),
      { open: false, activeTool: '', removedTool: 'agents' }
    );
  });

  it('preserves an available active tool and its open state', () => {
    assert.deepEqual(
      reconcilePanelToolsAvailability([{ id: 'agents', icon: 'AI' }], true, 'agents'),
      { open: true, activeTool: 'agents', removedTool: '' }
    );
  });
});

describe('panelToolsDrawerResting', () => {
  it('is true only when closed and not animating', () => {
    assert.equal(panelToolsDrawerResting(false, 'idle'), true);
    assert.equal(panelToolsDrawerResting(true, 'idle'), false);
    assert.equal(panelToolsDrawerResting(false, 'opening'), false);
    assert.equal(panelToolsDrawerResting(false, 'closing'), false);
    assert.equal(panelToolsDrawerResting(true, 'opening'), false);
  });
});

describe('panelToolsDrawerAtTerminal', () => {
  it('does not complete closing while any clipped drawer width remains', () => {
    assert.equal(panelToolsDrawerAtTerminal(68.7, 300, 'closing'), false);
    assert.equal(panelToolsDrawerAtTerminal(0, 300, 'closing'), true);
  });

  it('completes opening only at the fixed surface width', () => {
    assert.equal(panelToolsDrawerAtTerminal(299, 300, 'opening'), false);
    assert.equal(panelToolsDrawerAtTerminal(299.5, 300, 'opening'), true);
    assert.equal(panelToolsDrawerAtTerminal(300, 300, 'opening'), true);
  });
});

describe('panelToolsDrawerTransitionMs', () => {
  it('resolves the max-width transition including delay', () => {
    assert.equal(
      panelToolsDrawerTransitionMs({
        transitionProperty: 'opacity, max-width',
        transitionDuration: '50ms, 0.3s',
        transitionDelay: '0ms, 25ms',
      }),
      325
    );
  });

  it('supports all, repeated timing lists, and instant transitions', () => {
    assert.equal(
      panelToolsDrawerTransitionMs({
        transitionProperty: 'color, all',
        transitionDuration: '100ms',
        transitionDelay: '0ms, 50ms',
      }),
      150
    );
    assert.equal(
      panelToolsDrawerTransitionMs({
        transitionProperty: 'max-width',
        transitionDuration: '0s',
        transitionDelay: '0s',
      }),
      0
    );
  });
});

describe('resolvePanelToolActivation', () => {
  it('opens a tool when closed or switching from another tool', () => {
    assert.deepEqual(resolvePanelToolActivation(false, '', 'agents'), {
      open: true,
      activeTool: 'agents',
      selected: true,
    });
    assert.deepEqual(resolvePanelToolActivation(true, 'search', 'agents'), {
      open: true,
      activeTool: 'agents',
      selected: true,
    });
  });

  it('closes the tool when the same tool is activated again', () => {
    assert.deepEqual(resolvePanelToolActivation(true, 'agents', 'agents'), {
      open: false,
      activeTool: 'agents',
      selected: false,
    });
  });

  it('toggles closed on repeat activation for every rail tool', () => {
    for (const id of PANEL_TOOLS_TOOL_IDS) {
      assert.deepEqual(resolvePanelToolActivation(true, id, id), {
        open: false,
        activeTool: id,
        selected: false,
      });
      assert.deepEqual(resolvePanelToolActivation(false, id, id), {
        open: true,
        activeTool: id,
        selected: true,
      });
    }
  });
});

describe('tool view composition contract', () => {
  it('uses one shared drawer header and permits explicit split fullscreen pane headers', () => {
    const source = fs.readFileSync(
      new URL('../src/wc/components/PanelTools/PanelTools.tsx', import.meta.url),
      'utf8'
    );
    const stories = fs.readFileSync(
      new URL('../src/wc/components/PanelTools/PanelTools.stories.ts', import.meta.url),
      'utf8'
    );

    assert.match(source, /<ds-panel-tool-header/);
    assert.match(source, /class="panel-tools__header"/);
    assert.match(source, /dsHeaderBack/);
    assert.match(source, /dsHeaderAction/);
    assert.match(source, /fullscreenHeaderMode === 'shared'/);
    assert.match(stories, /fullscreen-header-mode=/);
    assert.match(stories, /heading="Agents"/);
    assert.match(stories, /heading="Plan a service route"/);
  });

  it('keeps base and detail header actions at the shared 8px outer inset', () => {
    const styles = fs.readFileSync(
      new URL('../src/wc/components/PanelToolHeader/PanelToolHeader.css', import.meta.url),
      'utf8'
    );

    assert.match(styles, /\.panel-tool-header\s*{[\s\S]*?display: flex;/);
    assert.match(styles, /\.panel-tool-header\s*{[\s\S]*?padding: var\(--dimension-space-100\);/);
    assert.match(styles, /\.panel-tool-header\s*{[\s\S]*?user-select: none;/);
    assert.match(styles, /ds-text\.panel-tool-header__heading\s*{[\s\S]*?flex: 1 1 0;/);
    assert.match(styles, /ds-text\.panel-tool-header__heading\s*{[\s\S]*?width: auto;/);
    assert.match(styles, /ds-text\.panel-tool-header__heading\s*{[\s\S]*?user-select: none;/);
    assert.match(styles, /\.panel-tool-header__leading\s*{[\s\S]*?flex: 0 0 auto;/);
    assert.match(styles, /\.panel-tool-header__trailing\s*{[\s\S]*?flex: 0 0 auto;/);
    assert.doesNotMatch(styles, /grid-template-columns:/);
  });

  it('keeps 4px between adjacent header actions in every presentation', () => {
    const styles = fs.readFileSync(
      new URL('../src/wc/components/PanelToolHeader/PanelToolHeader.css', import.meta.url),
      'utf8'
    );

    assert.match(
      styles,
      /\.panel-tool-header__trailing\s*\{[\s\S]*?gap: var\(--dimension-space-050\);/
    );
  });

  it('keeps transient conversation row states separate from selection', () => {
    const source = fs.readFileSync(
      new URL(
        '../src/wc/components/ConversationListItem/ConversationListItem.tsx',
        import.meta.url
      ),
      'utf8'
    );
    const styles = fs.readFileSync(
      new URL(
        '../src/wc/components/ConversationListItem/ConversationListItem.css',
        import.meta.url
      ),
      'utf8'
    );

    assert.match(source, /'ds-interaction-fill--selected': this\.selected/);
    assert.match(styles, /choice-list\.css/);
    assert.match(source, /'ds-choice-item': true/);
    assert.match(source, /'ds-control--md': true/);
    assert.match(source, /conversation-list-item__content ds-choice-item__content/);
    assert.match(source, /conversation-list-item__title ds-choice-item__label/);
    assert.match(source, /conversation-list-item__preview ds-choice-item__subtext/);
    assert.doesNotMatch(styles, /padding: var\(--dimension-space-100\);/);
    assert.doesNotMatch(styles, /\.conversation-list-item:hover[\s\S]*background:/);
  });
});

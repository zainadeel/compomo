import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PANEL_TOOLS_FOOTER_TOOL_ID,
  PANEL_TOOLS_DEFAULT_ITEMS,
  PANEL_TOOLS_LABELS,
  PANEL_TOOLS_PRIMARY_TOOL_ID,
  PANEL_TOOLS_SHORTCUTS,
  PANEL_TOOLS_TOOL_IDS,
  type PanelToolsRailAccessory,
} from '../src/wc/components/PanelTools/panel-tools-types';
import {
  isPanelToolsToolId,
  orderPanelToolsRailEntries,
  orderPanelToolsItems,
  panelToolsDrawerAtTerminal,
  panelToolsDrawerResting,
  panelToolsDrawerTransitionMs,
  panelToolsRailAccessoryActionDetail,
  panelToolsRailFocusKeys,
  reconcilePanelToolsAvailability,
  reconcilePanelToolsRovingIndex,
  resolvePanelToolActivation,
} from '../src/wc/components/PanelTools/panel-tools-utils';

describe('PANEL_TOOLS_TOOL_IDS', () => {
  it('lists the canonical rail order and retained optional stacks id', () => {
    assert.deepEqual(PANEL_TOOLS_TOOL_IDS, [
      'agents',
      'messages',
      'activity',
      'search',
      'stacks',
      'help',
    ]);
  });
});

describe('PANEL_TOOLS_PRIMARY_TOOL_ID', () => {
  it('places agents in the rail header row', () => {
    assert.equal(PANEL_TOOLS_PRIMARY_TOOL_ID, 'agents');
  });
});

describe('PANEL_TOOLS_DEFAULT_ITEMS', () => {
  it('pins agents and exposes activity directly without stacks', () => {
    assert.deepEqual(
      PANEL_TOOLS_DEFAULT_ITEMS.map(item => [
        item.id,
        item.railPlacement ?? 'body',
        item.mobileDestination,
      ]),
      [
        ['agents', 'header', 'agents'],
        ['messages', 'body', 'messages'],
        ['activity', 'body', 'activity'],
        ['search', 'body', 'search'],
        ['help', 'footer', 'help'],
      ]
    );
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
    const agents = { id: 'agents' as const, icon: 'AI' };
    const messages = { id: 'messages' as const, icon: 'Messages' };
    assert.deepEqual(
      orderPanelToolsItems([help, messages, agents, { ...messages, icon: 'Duplicate' }]),
      [agents, messages, help]
    );
  });
});

describe('orderPanelToolsRailEntries', () => {
  const accessories: PanelToolsRailAccessory[] = [
    { type: 'divider', id: 'session-boundary', railPlacement: 'body', order: 20 },
    {
      type: 'transient',
      id: 'active-session',
      railPlacement: 'body',
      order: 21,
      ariaLabel: 'Active session',
      visual: { type: 'initial', initial: 'AS' },
      statusText: 'In progress',
      statusTone: 'active',
      primaryAction: { id: 'restore' },
    },
  ];

  it('interleaves accessories with tools by explicit region and order', () => {
    const entries = orderPanelToolsRailEntries(
      [
        { id: 'search', icon: 'MagnifyingGlass', order: 30 },
        { id: 'agents', icon: 'AI', railPlacement: 'header', order: 0 },
        { id: 'messages', icon: 'MessageBubbleStack', order: 10 },
        { id: 'help', icon: 'CircleQuestion', railPlacement: 'footer', order: 0 },
      ],
      accessories
    );

    assert.deepEqual(
      entries.map(entry => [entry.type, entry.id]),
      [
        ['tool', 'agents'],
        ['tool', 'messages'],
        ['accessory', 'session-boundary'],
        ['accessory', 'active-session'],
        ['tool', 'search'],
        ['tool', 'help'],
      ]
    );
  });

  it('orders a transient status group before a divided shortcut group', () => {
    const entries = orderPanelToolsRailEntries(
      [],
      [
        {
          type: 'shortcut',
          id: 'second-shortcut',
          railPlacement: 'body',
          order: 14,
          ariaLabel: 'Second shortcut',
          initials: 'S',
          action: { id: 'open' },
        },
        {
          type: 'divider',
          id: 'shortcut-boundary',
          railPlacement: 'body',
          order: 12,
        },
        {
          type: 'transient',
          id: 'active-status',
          railPlacement: 'body',
          order: 11,
          ariaLabel: 'Active status',
          visual: { type: 'initial', initial: 'A' },
          statusText: 'Active',
          statusTone: 'positive',
          primaryAction: { id: 'restore' },
        },
        {
          type: 'shortcut',
          id: 'first-shortcut',
          railPlacement: 'body',
          order: 13,
          ariaLabel: 'First shortcut',
          initials: 'F',
          action: { id: 'open' },
        },
      ]
    );

    assert.deepEqual(
      entries.map(entry => entry.id),
      ['active-status', 'shortcut-boundary', 'first-shortcut', 'second-shortcut']
    );
  });

  it('omits blank and duplicate accessory ids', () => {
    const entries = orderPanelToolsRailEntries(
      [],
      [...accessories, { ...accessories[0], id: ' ' }, { ...accessories[0] }]
    );
    assert.deepEqual(
      entries.map(entry => entry.id),
      ['session-boundary', 'active-session']
    );
  });
});

describe('rail accessory focus reconciliation', () => {
  const transient: PanelToolsRailAccessory = {
    type: 'transient',
    id: 'active-session',
    railPlacement: 'body',
    order: 1,
    ariaLabel: 'Active session',
    visual: { type: 'icon', icon: 'Phone' },
    statusText: 'Active',
    statusTone: 'active',
    primaryAction: { id: 'restore' },
    secondaryAction: { id: 'dismiss', icon: 'X', ariaLabel: 'Dismiss session' },
  };
  const shortcut: PanelToolsRailAccessory = {
    type: 'shortcut',
    id: 'pinned-conversation',
    railPlacement: 'body',
    order: 2,
    ariaLabel: 'Pinned conversation',
    initials: 'P',
    dot: true,
    action: { id: 'open' },
  };

  it('includes accessory actions and excludes decorative boundaries from keyboard order', () => {
    const entries = orderPanelToolsRailEntries(
      [{ id: 'search', icon: 'MagnifyingGlass', order: 0 }],
      [{ type: 'divider', id: 'boundary', railPlacement: 'body', order: 0.5 }, transient, shortcut]
    );
    assert.deepEqual(panelToolsRailFocusKeys(entries), [
      'tool:search',
      'accessory:active-session:restore',
      'accessory:active-session:dismiss',
      'accessory:pinned-conversation:open',
    ]);
  });

  it('preserves a surviving target and chooses the nearest target after dynamic removal', () => {
    const previous = [
      'tool:search',
      'accessory:active-session:restore',
      'accessory:active-session:dismiss',
      'tool:help',
    ];
    const inserted = ['tool:agents', ...previous];
    assert.equal(reconcilePanelToolsRovingIndex(previous, inserted, 1), 2);
    assert.equal(reconcilePanelToolsRovingIndex(previous, ['tool:search', 'tool:help'], 1), 1);
  });
});

describe('panelToolsRailAccessoryActionDetail', () => {
  it('preserves the accessory id, action id, and rendered action anchor', () => {
    const anchor = {} as HTMLElement;
    assert.deepEqual(panelToolsRailAccessoryActionDetail('active-session', 'restore', anchor), {
      accessoryId: 'active-session',
      actionId: 'restore',
      anchor,
    });
  });
});

describe('isPanelToolsToolId', () => {
  it('accepts application-owned tool ids while rejecting empty persisted state', () => {
    assert.equal(isPanelToolsToolId('agents'), true);
    assert.equal(isPanelToolsToolId('custom'), true);
    assert.equal(isPanelToolsToolId('  '), false);
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

  it('is independent from dynamic rail accessory collection changes', () => {
    const items = [{ id: 'search', icon: 'MagnifyingGlass' }];
    orderPanelToolsRailEntries(items, [
      { type: 'divider', id: 'temporary-boundary', railPlacement: 'body', order: 1 },
    ]);
    orderPanelToolsRailEntries(items, []);

    assert.deepEqual(reconcilePanelToolsAvailability(items, true, 'search'), {
      open: true,
      activeTool: 'search',
      removedTool: '',
    });
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
    const source = fs.readFileSync(
      new URL('../src/wc/components/PanelToolHeader/PanelToolHeader.tsx', import.meta.url),
      'utf8'
    );

    assert.match(styles, /@import ['"]\.\.\/\.\.\/utils\/chrome-header\.css['"];/);
    assert.match(source, /panel-tool-header ds-chrome-header ds-chrome-header--bounded/);
    assert.match(styles, /\.panel-tool-header\s*{[\s\S]*?user-select: none;/);
    assert.match(styles, /ds-text\.panel-tool-header__heading\s*{[\s\S]*?flex: 1 1 0;/);
    assert.match(styles, /ds-text\.panel-tool-header__heading\s*{[\s\S]*?width: auto;/);
    assert.match(styles, /ds-text\.panel-tool-header__heading\s*{[\s\S]*?user-select: none;/);
    assert.match(source, /panel-tool-header__leading ds-chrome-header__leading/);
    assert.match(source, /panel-tool-header__trailing ds-chrome-header__trailing/);
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

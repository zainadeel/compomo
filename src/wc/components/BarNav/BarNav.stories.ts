import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-bar-nav.js';

const multiTabs = [
  { id: 'tab-1', label: 'Tab 1' },
  { id: 'tab-2', label: 'Tab 2' },
  { type: 'divider' as const },
  { id: 'tab-3', label: 'Tab 3', dot: true },
  { id: 'tab-4', label: 'Tab 4' },
];

const overflowTabs = [
  { id: 'tab-1', label: 'Tab 1' },
  { id: 'tab-2', label: 'Tab 2' },
  { id: 'tab-3', label: 'Tab 3' },
  { id: 'tab-4', label: 'Tab 4' },
  { id: 'tab-5', label: 'Tab 5', dot: true },
  { id: 'tab-6', label: 'Tab 6' },
];

function wireTabs(
  el: Element | null,
  tabs: typeof multiTabs | typeof overflowTabs,
  value: string,
) {
  if (!el) return;
  const nav = el.querySelector('ds-bar-nav') as HTMLElement & {
    tabs: typeof multiTabs | typeof overflowTabs;
    value: string;
  } | null;
  if (!nav) return;
  nav.tabs = tabs;
  nav.value = value;
  nav.addEventListener('dsTabChange', (e: Event) => {
    nav.value = (e as CustomEvent<string>).detail;
  });
}

const meta: Meta = {
  title: 'Navigation/BarNav',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj;

export const SingleTab: Story = {
  name: 'Single tab',
  render: () => html`
    <div style="width: min(100%, 720px);">
      <ds-bar-nav heading="Tab 1"></ds-bar-nav>
    </div>
  `,
};

export const MultipleTabs: Story = {
  name: 'Multiple tabs',
  render: () => html`
    <div
      style="width: min(100%, 720px);"
      ${ref(el => wireTabs(el, multiTabs, 'tab-3'))}
    >
      <ds-bar-nav></ds-bar-nav>
    </div>
  `,
};

export const TabOverflow: Story = {
  name: 'Tab overflow',
  parameters: {
    docs: {
      description: {
        story:
          'When tabs overflow the header width, remaining tabs move into the Ellipses overflow menu. ' +
          'Resize the dashed container to test collapse behavior.',
      },
    },
  },
  render: () => html`
    <div
      style="
        width: min(100%, 420px);
        resize: horizontal;
        overflow: auto;
        padding-bottom: var(--dimension-space-200);
        border: 1px dashed var(--color-border-tertiary);
      "
      ${ref(el => wireTabs(el, overflowTabs, 'tab-5'))}
    >
      <ds-bar-nav></ds-bar-nav>
    </div>
  `,
};

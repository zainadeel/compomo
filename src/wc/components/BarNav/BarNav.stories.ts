import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-bar-nav.js';

const singleTabs = [{ id: 'tab-1', label: 'Tab 1' }];

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
  { id: 'tab-5', label: 'Tab 5 with dot', dot: true },
  { id: 'tab-6', label: 'Tab 6' },
];

function bindTabChange(nav: HTMLElement & { value: string }) {
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
      <ds-bar-nav .tabs=${singleTabs} value="tab-1"></ds-bar-nav>
    </div>
  `,
};

export const MultipleTabs: Story = {
  name: 'Multiple tabs',
  render: () => html`
    <div style="width: min(100%, 720px);">
      <ds-bar-nav
        base-path="/example"
        .tabs=${multiTabs}
        value="tab-3"
        ${ref(el => {
          if (!el) return;
          bindTabChange(el as HTMLElement & { value: string });
        })}
      ></ds-bar-nav>
    </div>
  `,
};

export const TabOverflow: Story = {
  name: 'Tab overflow',
  parameters: {
    docs: {
      description: {
        story:
          'When tabs overflow the header width, remaining tabs move into the down-chevron overflow menu. ' +
          'Resize the dashed container to test collapse behavior.',
      },
    },
  },
  render: () => html`
    <div
      style="
        width: min(100%, 300px);
        resize: horizontal;
        overflow: auto;
        padding-bottom: var(--dimension-space-200);
        border: 1px dashed var(--color-border-tertiary);
      "
    >
      <ds-bar-nav
        base-path="/example"
        .tabs=${overflowTabs}
        value="tab-5"
        ${ref(el => {
          if (!el) return;
          bindTabChange(el as HTMLElement & { value: string });
        })}
      ></ds-bar-nav>
    </div>
  `,
};

export const Reconnection: Story = {
  render: () => {
    let frame: HTMLElement | undefined;
    const setWidth = (width: number) => {
      if (frame) frame.style.width = `min(100%, ${width}px)`;
    };
    const reinsert = () => {
      const nav = frame?.querySelector('ds-bar-nav');
      if (!nav || !frame) return;
      nav.remove();
      frame.append(nav);
    };
    return html`
      <div style="display:grid;gap:var(--dimension-space-200);">
        <ds-text as="p" variant="text-body-small" color="secondary">
          Reinsert the navigation, then switch widths. Tabs should continue moving into and out of
          the overflow menu while retaining the selected section.
        </ds-text>
        <div style="display:flex;flex-wrap:wrap;gap:var(--dimension-space-100);">
          <ds-button-unfilled label="Reinsert navigation" @dsClick=${reinsert}></ds-button-unfilled>
          <ds-button-unfilled label="Narrow" @dsClick=${() => setWidth(280)}></ds-button-unfilled>
          <ds-button-unfilled label="Wide" @dsClick=${() => setWidth(720)}></ds-button-unfilled>
        </div>
        <div
          style="width:min(100%, 720px);"
          ${ref(element => {
            frame = element as HTMLElement | undefined;
          })}
        >
          <ds-bar-nav .tabs=${overflowTabs} value="tab-5"></ds-bar-nav>
        </div>
      </div>
    `;
  },
};

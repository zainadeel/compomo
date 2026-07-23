import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-panel-tool-header.js';
import type { PanelToolsHeaderAction } from '../PanelTools/panel-tools-types';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';

export default {
  title: 'Navigation/PanelToolsHeader',
  tags: ['autodocs'],
  parameters: { docs: isolatedOverlayDocs('240px') },
} satisfies Meta;
type Story = StoryObj;

const ROOT_ACTIONS: PanelToolsHeaderAction[] = [
  { id: 'fullscreen', icon: 'PanelExpand', ariaLabel: 'Enter fullscreen' },
  { id: 'menu', icon: 'Ellipses', ariaLabel: 'Agents options', haspopup: 'menu' },
];

const CHILD_ACTIONS: PanelToolsHeaderAction[] = [
  { id: 'fullscreen', icon: 'PanelCollapse', ariaLabel: 'Exit fullscreen', pressed: true },
  { id: 'menu', icon: 'Ellipses', ariaLabel: 'Chat options', haspopup: 'menu' },
];

export const RootView: Story = {
  render: () =>
    html`<ds-panel-tool-header heading="Agents" .actions=${ROOT_ACTIONS}></ds-panel-tool-header>`,
};
export const ChildView: Story = {
  render: () => html`
    <ds-panel-tool-header
      heading="New agent chat"
      show-back
      .actions=${CHILD_ACTIONS}
    ></ds-panel-tool-header>
  `,
};
export const DismissView: Story = {
  render: () => html`
    <ds-panel-tool-header
      heading="New chat"
      show-back
      back-icon="Cross"
      back-aria-label="Close new chat"
      .showMenu=${false}
    ></ds-panel-tool-header>
  `,
};
export const TitleOnly: Story = {
  render: () =>
    html`<ds-panel-tool-header heading="Help & Support" .showMenu=${false}></ds-panel-tool-header>`,
};

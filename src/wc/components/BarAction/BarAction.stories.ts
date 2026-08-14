import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { useArgs } from 'storybook/preview-api';
import '../../../../dist/components/ds-bar-action.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-menu.js';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';
import { wireButtonStoryMenuTriggers } from '../../utils/button-story-foundation';

const COACHING_STATUS_ITEMS = [
  { label: 'Pending review', value: 'Pending review' },
  { label: 'Coachable', value: 'Coachable' },
  { label: 'Coached', value: 'Coached' },
  { label: 'Dismissed', value: 'Dismissed' },
];

const meta: Meta = {
  title: 'Data display/BarAction',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Selection-action chrome for a selected set. The application owns selected identities, command consequences, and focus return after Clear. Overlay inset against a table is application layout; see the Table Safety events story.',
      },
    },
  },
  argTypes: {
    count: { control: 'number' },
    selectedLabel: { control: 'text' },
    clearLabel: { control: 'text' },
    label: { control: 'text' },
  },
  args: {
    count: 3,
    selectedLabel: 'selected',
    clearLabel: 'Clear',
    label: 'Selected item actions',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => {
    const [, updateArgs] = useArgs();
    return html`
      <ds-bar-action
        .count=${args['count'] as number}
        selected-label=${args['selectedLabel']}
        clear-label=${args['clearLabel']}
        label=${args['label']}
        @dsClear=${() => updateArgs({ count: 0 })}
      ></ds-bar-action>
    `;
  },
};

export const Hidden: Story = {
  name: 'Hidden while empty',
  args: { count: 0 },
  parameters: {
    docs: {
      description: {
        story: 'The bar stays out of layout while the selected count is below one.',
      },
    },
  },
  render: args => html`
    <ds-bar-action
      .count=${args['count'] as number}
      label=${args['label']}
    ></ds-bar-action>
  `,
};

export const WithActions: Story = {
  name: 'With actions',
  parameters: {
    docs: {
      ...isolatedOverlayDocs('280px'),
      description: {
        story:
          'Product commands project through the actions slot. Menus remain application-owned and anchored to those controls.',
      },
    },
  },
  render: () => html`
    <div style="position:relative;min-height:240px;" ${ref(el => wireButtonStoryMenuTriggers(el))}>
      <ds-bar-action count="3" label="Selected safety event actions">
        <ds-button-unfilled
          id="bar-action-coaching-trigger"
          slot="actions"
          data-menu-trigger="bar-action-coaching-menu"
          label="Coaching status"
          size="md"
          background="bold"
          has-menu
          controls="bar-action-coaching-menu"
        ></ds-button-unfilled>
      </ds-bar-action>
      <ds-menu
        id="bar-action-coaching-menu"
        anchor-id="bar-action-coaching-trigger"
        menu-label="Apply coaching status to selected safety events"
        side="bottom"
        align="end"
        .items=${COACHING_STATUS_ITEMS}
      ></ds-menu>
    </div>
  `,
};

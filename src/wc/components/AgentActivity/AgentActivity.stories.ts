import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-agent-activity.js';

export default { title: 'Agent/Activity', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Playground: Story = {
  render: () =>
    html`<ds-agent-activity
      .items=${[
        { id: 'one', label: 'Reviewed records', state: 'complete' },
        { id: 'two', label: 'Preparing summary', state: 'active' },
      ]}
    ></ds-agent-activity>`,
};

export const Expanded: Story = {
  render: () =>
    html`<ds-agent-activity
      open
      .items=${[
        { id: 'one', label: 'Reviewed records', detail: '12 records matched.', state: 'complete' },
        { id: 'two', label: 'Preparing summary', state: 'active' },
        { id: 'three', label: 'Attach records', state: 'pending' },
      ]}
    ></ds-agent-activity>`,
};

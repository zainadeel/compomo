import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-message-composer.js';

export default { title: 'Conversation/Message composer', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Ready: Story = { render: () => html`<ds-message-composer label="Message" placeholder="Write a message"></ds-message-composer>` };
export const Streaming: Story = { render: () => html`<ds-message-composer label="Message" value="Working draft" status="streaming"></ds-message-composer>` };

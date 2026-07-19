import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-message.js';
import '../../../../dist/components/ds-message-bubble.js';

export default { title: 'Conversation/Message row', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Incoming: Story = { render: () => html`<ds-message message-id="one" direction="incoming" author="Avery" timestamp="9:41 AM"><ds-message-bubble variant="secondary">Can you send the revised arrival window?</ds-message-bubble></ds-message>` };
export const Outgoing: Story = { render: () => html`<ds-message message-id="two" direction="outgoing" author="You" timestamp="9:45 AM" delivery-state="read"><ds-message-bubble variant="primary">I’ll confirm it now.</ds-message-bubble></ds-message>` };

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-message-bubble.js';

export default { title: 'Conversation/Message bubble', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Variants: Story = { render: () => html`<div style="display:grid;gap:var(--dimension-space-100);"><ds-message-bubble variant="primary">Primary</ds-message-bubble><ds-message-bubble variant="secondary">Secondary</ds-message-bubble><ds-message-bubble variant="ghost">Ghost</ds-message-bubble><ds-message-bubble variant="error">Error</ds-message-bubble></div>` };

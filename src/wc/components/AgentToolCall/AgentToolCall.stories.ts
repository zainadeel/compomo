import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-agent-tool-call.js';

export default { title: 'Agent/Tool call', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Playground: Story = { render: () => html`<ds-agent-tool-call open name="records.search" label="Searched records" state="success" .input=${{ period: '30 days' }} .output=${{ matches: 12 }}></ds-agent-tool-call>` };

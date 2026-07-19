import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-agent-source-list.js';

export default { title: 'Agent/Source list', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Playground: Story = { render: () => html`<ds-agent-source-list open .items=${[
  { id: 'guide', title: 'Maintenance guide', description: 'Inspection guidance', url: 'https://example.com/guide' },
]}></ds-agent-source-list>` };

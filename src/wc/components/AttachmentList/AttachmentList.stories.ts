import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-attachment-list.js';

export default { title: 'Conversation/Attachment list', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Playground: Story = { render: () => html`<ds-attachment-list .items=${[
  { id: 'csv', name: 'service-summary.csv', mediaType: 'text/csv', size: '24 KB', url: 'https://example.com/file.csv' },
]}></ds-attachment-list>` };

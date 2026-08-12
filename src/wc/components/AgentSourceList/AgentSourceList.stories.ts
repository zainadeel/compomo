import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-agent-source-list.js';

export default { title: 'Agent/Source list', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;

export const InlineSources: Story = {
  render: () => html`
    <div style="width:min(600px, 90vw);">
      <ds-agent-source-list
        open
        .items=${[
          {
            id: 'guide',
            title: 'Preventive maintenance guide',
            description: 'Battery and charging-system inspection guidance.',
            url: 'https://docs.example.com/maintenance/guide',
          },
          {
            id: 'records',
            title: 'Service records',
            url: 'https://fleet.example.com/records',
          },
        ]}
      ></ds-agent-source-list>
    </div>
  `,
};

export const UnsafeAndMalformedUrls: Story = {
  render: () => html`
    <div style="width:min(600px, 90vw);">
      <ds-agent-source-list
        open
        .items=${[
          {
            id: 'unsafe',
            title: 'Unsafe executable URL',
            description: 'Rendered as noninteractive source text.',
            url: 'javascript:alert(1)',
          },
          {
            id: 'malformed',
            title: 'Malformed source URL',
            url: 'http://[',
          },
        ]}
      ></ds-agent-source-list>
    </div>
  `,
};

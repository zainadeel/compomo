import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-markdown.js';

export default { title: 'Conversation/Markdown', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Gfm: Story = {
  render: () => html`
    <ds-markdown
      content=${`# Summary

- [x] Reviewed records
- [ ] Share report

| Item | Count |
| --- | ---: |
| Records | 12 |`}
    ></ds-markdown>
  `,
};

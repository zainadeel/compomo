import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-markdown.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-text.js';

export default { title: 'Conversation/Markdown', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;

export const Reconnection: Story = {
  render: () => {
    let markdown: HTMLDsMarkdownElement | undefined;
    let revision = 0;
    const reinsert = () => {
      const parent = markdown?.parentElement;
      if (!markdown || !parent) return;
      markdown.remove();
      markdown.content = `## Revision ${++revision}\n\nUpdated **while detached**. This should render as formatted Markdown.`;
      parent.append(markdown);
    };
    return html`
      <div style="display:grid;gap:var(--dimension-space-200);">
        <ds-text as="p" variant="text-body-small" color="secondary">
          Update the content while the component is removed, then reinsert it. The heading and
          formatting should follow the latest revision.
        </ds-text>
        <ds-button-unfilled label="Update and reinsert" @dsClick=${reinsert}></ds-button-unfilled>
        <div>
          <ds-markdown
            content="## Initial content"
            ${ref(element => {
              markdown = element as HTMLDsMarkdownElement | undefined;
            })}
          ></ds-markdown>
        </div>
      </div>
    `;
  },
};
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

export const SafeContent: Story = {
  render: () => html`
    <div style="display:grid;gap:var(--dimension-space-200);">
      <ds-text as="p" variant="text-body-small" color="secondary">
        Formatting and character entities render normally. Raw HTML is ignored, unsupported link
        schemes become plain text, and inline code remains literal.
      </ds-text>
      <ds-markdown
        content=${'## Safe &amp; sound\n\n**Formatted** text with &copy; and &#x2713;.\n\n[Documentation](https://example.com/docs) and [unsupported link](data:text/plain,example).\n\n<aside>Ignored raw HTML</aside>\n\n`<strong>Literal code</strong>`'}
      ></ds-markdown>
    </div>
  `,
};

import { Component, h, Host, Prop, State, VNode, Watch } from '@stencil/core';
import type { Nodes, Root } from 'mdast';

type MarkdownRender = VNode | string | null | MarkdownRender[];
type MarkdownParser = {
  fromMarkdown: typeof import('mdast-util-from-markdown').fromMarkdown;
  gfmFromMarkdown: typeof import('mdast-util-gfm').gfmFromMarkdown;
  gfm: typeof import('micromark-extension-gfm').gfm;
};

let parserPromise: Promise<MarkdownParser> | undefined;

function loadParser(): Promise<MarkdownParser> {
  parserPromise ??= Promise.all([
    import('mdast-util-from-markdown'),
    import('mdast-util-gfm'),
    import('micromark-extension-gfm'),
  ]).then(([fromMarkdownModule, gfmFromMarkdownModule, gfmModule]) => ({
    fromMarkdown: fromMarkdownModule.fromMarkdown,
    gfmFromMarkdown: gfmFromMarkdownModule.gfmFromMarkdown,
    gfm: gfmModule.gfm,
  }));
  return parserPromise;
}

function safeHref(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, document.baseURI);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

@Component({
  tag: 'ds-markdown',
  styleUrl: 'Markdown.css',
  scoped: true,
})
export class Markdown {
  @Prop() content: string = '';
  @Prop() streaming: boolean = false;

  @State() private tree: Root | null = null;
  private parseFrame?: number;
  private parseRevision = 0;

  componentWillLoad() {
    // The browser-targeted named-character decoder used by the Markdown parser
    // creates a DOM element when its module is evaluated. Keep public package
    // imports server-safe by loading that parser only in a browser context.
    if (typeof document !== 'undefined') return this.parse();
  }

  disconnectedCallback() {
    this.parseRevision += 1;
    if (this.parseFrame && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.parseFrame);
    }
  }

  @Watch('content')
  scheduleParse() {
    if (typeof requestAnimationFrame !== 'function') return;
    if (this.parseFrame) cancelAnimationFrame(this.parseFrame);
    this.parseFrame = requestAnimationFrame(() => {
      this.parseFrame = undefined;
      void this.parse();
    });
  }

  private async parse() {
    const revision = ++this.parseRevision;
    try {
      const { fromMarkdown, gfmFromMarkdown, gfm } = await loadParser();
      const tree = fromMarkdown(this.content, {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()],
      });
      if (revision === this.parseRevision) this.tree = tree;
    } catch {
      if (revision === this.parseRevision) this.tree = null;
    }
  }

  private children(node: Nodes): MarkdownRender[] {
    if (!('children' in node)) return [];
    return node.children.map(child => this.renderNode(child));
  }

  private renderNode(node: Nodes): MarkdownRender {
    switch (node.type) {
      case 'root':
        return this.children(node);
      case 'text':
        // Keep prose text on an element boundary. Besides giving streaming updates a
        // stable render target, this avoids axe-core treating a bare Stencil text
        // vnode as an element while it generates a contrast-result selector.
        return <span class="markdown__text">{node.value}</span>;
      case 'paragraph':
        return <p class="markdown__paragraph">{this.children(node)}</p>;
      case 'heading': {
        const Tag = `h${node.depth}`;
        return <Tag class="markdown__heading">{this.children(node)}</Tag>;
      }
      case 'strong':
        return <strong class="markdown__strong">{this.children(node)}</strong>;
      case 'emphasis':
        return <em class="markdown__emphasis">{this.children(node)}</em>;
      case 'delete':
        return <del class="markdown__delete">{this.children(node)}</del>;
      case 'blockquote':
        return <blockquote class="markdown__blockquote">{this.children(node)}</blockquote>;
      case 'break':
        return <br class="markdown__break" />;
      case 'thematicBreak':
        return <hr class="markdown__thematic-break" />;
      case 'inlineCode':
        return <code class="markdown__inline-code">{node.value}</code>;
      case 'code':
        return (
          <ds-code-block
            class="markdown__code-block"
            data-ds-prose="off"
            code={node.value}
            language={node.lang ?? ''}
            filename={node.meta ?? ''}
          />
        );
      case 'link': {
        const href = safeHref(node.url);
        return href ? (
          <a class="markdown__link" href={href} target="_blank" rel="noopener noreferrer">
            {this.children(node)}
          </a>
        ) : (
          this.children(node)
        );
      }
      case 'list': {
        const Tag = node.ordered ? 'ol' : 'ul';
        return (
          <Tag class="markdown__list" start={node.ordered && node.start ? node.start : undefined}>
            {this.children(node)}
          </Tag>
        );
      }
      case 'listItem':
        return (
          <li class="markdown__list-item">
            {typeof node.checked === 'boolean' ? (
              <input
                class="markdown__task-indicator"
                type="checkbox"
                checked={node.checked}
                disabled
                aria-hidden="true"
                tabIndex={-1}
              />
            ) : null}
            {this.children(node)}
          </li>
        );
      case 'table': {
        const [heading, ...rows] = node.children;
        return (
          <div class="markdown__table-wrap ds-prose__table-scroll" tabIndex={0}>
            <table class="markdown__table">
              {heading ? (
                <thead class="markdown__table-head">
                  <tr class="markdown__table-row">
                    {heading.children.map(cell => (
                      <th class="markdown__table-heading" scope="col">
                        {this.children(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody class="markdown__table-body">{rows.map(row => this.renderNode(row))}</tbody>
            </table>
          </div>
        );
      }
      case 'tableRow':
        return <tr class="markdown__table-row">{this.children(node)}</tr>;
      case 'tableCell':
        return <td class="markdown__table-cell">{this.children(node)}</td>;
      case 'image': {
        const href = safeHref(node.url);
        return href ? (
          <a class="markdown__image-link" href={href} target="_blank" rel="noopener noreferrer">
            {node.alt || 'View image'}
          </a>
        ) : (
          node.alt || null
        );
      }
      case 'html':
      case 'definition':
      case 'footnoteDefinition':
        return null;
      case 'footnoteReference':
        return <sup class="markdown__footnote">{node.label}</sup>;
      default:
        return this.children(node);
    }
  }

  render() {
    return (
      <Host aria-busy={this.streaming ? 'true' : undefined}>
        <div class="markdown ds-prose">
          {this.tree ? (
            this.renderNode(this.tree)
          ) : (
            <p class="markdown__paragraph">
              <span class="markdown__text">{this.content}</span>
            </p>
          )}
        </div>
      </Host>
    );
  }
}

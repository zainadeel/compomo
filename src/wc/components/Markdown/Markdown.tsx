import { Component, h, Host, Prop, State, VNode, Watch } from '@stencil/core';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import type { Nodes, Root } from 'mdast';

type MarkdownRender = VNode | string | null | MarkdownRender[];

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

  componentWillLoad() {
    this.parse();
  }

  disconnectedCallback() {
    if (this.parseFrame) cancelAnimationFrame(this.parseFrame);
  }

  @Watch('content')
  scheduleParse() {
    if (this.parseFrame) cancelAnimationFrame(this.parseFrame);
    this.parseFrame = requestAnimationFrame(() => {
      this.parseFrame = undefined;
      this.parse();
    });
  }

  private parse() {
    try {
      this.tree = fromMarkdown(this.content, {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()],
      });
    } catch {
      this.tree = null;
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
        return node.value;
      case 'paragraph':
        return <p>{this.children(node)}</p>;
      case 'heading': {
        const Tag = `h${node.depth}`;
        return <Tag>{this.children(node)}</Tag>;
      }
      case 'strong':
        return <strong>{this.children(node)}</strong>;
      case 'emphasis':
        return <em>{this.children(node)}</em>;
      case 'delete':
        return <del>{this.children(node)}</del>;
      case 'blockquote':
        return <blockquote>{this.children(node)}</blockquote>;
      case 'break':
        return <br />;
      case 'thematicBreak':
        return <hr />;
      case 'inlineCode':
        return <code>{node.value}</code>;
      case 'code':
        return <ds-code-block code={node.value} language={node.lang ?? ''} filename={node.meta ?? ''} />;
      case 'link': {
        const href = safeHref(node.url);
        return href ? <a href={href} target="_blank" rel="noopener noreferrer">{this.children(node)}</a> : this.children(node);
      }
      case 'list': {
        const Tag = node.ordered ? 'ol' : 'ul';
        return <Tag start={node.ordered && node.start ? node.start : undefined}>{this.children(node)}</Tag>;
      }
      case 'listItem':
        return (
          <li>
            {typeof node.checked === 'boolean' ? (
              <input type="checkbox" checked={node.checked} disabled aria-hidden="true" tabIndex={-1} />
            ) : null}
            {this.children(node)}
          </li>
        );
      case 'table':
        return <div class="markdown__table-wrap"><table><tbody>{this.children(node)}</tbody></table></div>;
      case 'tableRow':
        return <tr>{this.children(node)}</tr>;
      case 'tableCell':
        return <td>{this.children(node)}</td>;
      case 'image': {
        const href = safeHref(node.url);
        return href ? <a href={href} target="_blank" rel="noopener noreferrer">{node.alt || 'View image'}</a> : node.alt || null;
      }
      case 'html':
      case 'definition':
      case 'footnoteDefinition':
        return null;
      case 'footnoteReference':
        return <sup>{node.label}</sup>;
      default:
        return this.children(node);
    }
  }

  render() {
    return (
      <Host aria-busy={this.streaming ? 'true' : undefined}>
        <div class="markdown">
          {this.tree ? this.renderNode(this.tree) : <p>{this.content}</p>}
        </div>
      </Host>
    );
  }
}

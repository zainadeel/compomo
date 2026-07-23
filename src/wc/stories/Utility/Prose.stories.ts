import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../styles/prose.css';
import '../../../../dist/components/ds-button-unfilled.js';
import './Prose.stories.css';

const meta: Meta = {
  title: 'Utility/Prose',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Renderer-neutral document rhythm for safe semantic HTML. Import `@ds-mo/ui/prose.css` and apply ' +
          '`.ds-prose` to a consumer-owned semantic container. Use `data-ds-prose="off"` when an embedded ' +
          'product-UI subtree owns its presentation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Overview: Story = {
  render: () => html`
    <article class="ds-prose prose-demo-document">
      <h1>Quarterly service review</h1>
      <p>
        Prose provides consistent rhythm for semantic HTML from an application, CMS, or safe rich-content
        renderer. It includes <a href="#prose-highlights">links</a>, inline <code>code</code>, and
        <strong>appropriate emphasis</strong> without requiring a custom element.
      </p>

      <h2 id="prose-highlights">Highlights</h2>
      <ul>
        <li>Response time improved across all monitored regions.</li>
        <li>
          The rollout remained within its error budget.
          <ul>
            <li>Web traffic completed first.</li>
            <li>Background processing followed after validation.</li>
          </ul>
        </li>
        <li>Follow-up work is recorded for the next planning cycle.</li>
      </ul>

      <blockquote>
        <p>Prefer semantic source content; let the prose utility own its readable visual rhythm.</p>
      </blockquote>

      <h3>Example configuration</h3>
      <pre><code>import '@ds-mo/ui/prose.css';

const article = document.querySelector('.ds-prose');</code></pre>

      <div class="ds-prose__table-scroll" role="region" aria-label="Service results" tabindex="0">
        <table class="prose-demo-wide-table">
          <thead>
            <tr>
              <th scope="col">Region</th>
              <th scope="col">Availability</th>
              <th scope="col">Median response</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>North America</td>
              <td>99.99%</td>
              <td>142 ms</td>
            </tr>
            <tr>
              <td>Europe</td>
              <td>99.98%</td>
              <td>158 ms</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  `,
};

export const NarrowContent: Story = {
  render: () => html`
    <article class="ds-prose prose-demo-document prose-demo-document--narrow">
      <h2>Narrow content region</h2>
      <p>
        Long copy wraps within the available inline size, including unusually long identifiers such as
        service-observability-production-north-america-01.
      </p>
      <div class="ds-prose__table-scroll" role="region" aria-label="Deployment status" tabindex="0">
        <table>
          <thead>
            <tr>
              <th scope="col">Environment</th>
              <th scope="col">Deployment identifier</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Production</td>
              <td>deployment-2026-07-22-north-america</td>
              <td>Complete</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  `,
};

export const EmbeddedUiOptOut: Story = {
  render: () => html`
    <article class="ds-prose prose-demo-document">
      <h2>Report actions</h2>
      <p>Ordinary semantic content continues to use the prose recipe.</p>

      <section class="prose-demo-product-card" data-ds-prose="off" aria-labelledby="prose-actions-title">
        <div>
          <h3 class="prose-demo-product-card__title" id="prose-actions-title">Export report</h3>
          <p class="prose-demo-product-card__description">This embedded product UI owns its own presentation.</p>
        </div>
        <ds-button-unfilled label="Download" size="sm"></ds-button-unfilled>
      </section>

      <p id="prose-actions">Content after the embedded UI returns to the prose rhythm.</p>
    </article>
  `,
};

export const AppendStable: Story = {
  render: () => {
    let stream: HTMLElement | undefined;
    let nextBlock = 2;

    const appendBlock = () => {
      if (!stream) return;
      const paragraph = document.createElement('p');
      paragraph.textContent = `Streamed block ${nextBlock} was appended without restyling an earlier sibling.`;
      stream.append(paragraph);
      nextBlock += 1;
    };

    return html`
      <div class="prose-demo-stream">
        <div
          class="ds-prose prose-demo-document"
          ${ref(element => {
            stream = element as HTMLElement;
          })}
        >
          <h2>Append-stable rhythm</h2>
          <p>Streamed block 1 is already present.</p>
        </div>
        <div data-ds-prose="off">
          <ds-button-unfilled label="Append block" size="sm" @dsClick=${appendBlock}></ds-button-unfilled>
        </div>
      </div>
    `;
  },
};

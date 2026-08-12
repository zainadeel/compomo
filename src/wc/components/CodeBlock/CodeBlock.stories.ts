import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-code-block.js';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';

export default {
  title: 'Conversation/Code block',
  tags: ['autodocs'],
  parameters: {
    docs: {
      ...isolatedOverlayDocs('420px'),
      description: {
        component:
          'Code surfaces consume `--typography-font-family-code`. Storybook opts into a self-hosted Fira Code 400 asset at its application root; production consumers own the equivalent asset loading and can set `--ds-code-font-variant-ligatures: none` when needed.',
      },
    },
  },
} satisfies Meta;
type Story = StoryObj;

const SAMPLE = `const build = source => source
  .filter(item => item.ready !== false)
  .map(item => ({ ...item, status: 'reviewable' }));`;

export const Playground: Story = {
  render: () => html`
    <ds-code-block language="ts" filename="example.ts" .code=${SAMPLE}></ds-code-block>
  `,
};

export const LigaturesDisabled: Story = {
  render: () => html`
    <div style="--ds-code-font-variant-ligatures: none">
      <ds-code-block language="ts" filename="literal-glyphs.ts" .code=${SAMPLE}></ds-code-block>
    </div>
  `,
};

export const MissingFontFallback: Story = {
  render: () => html`
    <div style="--typography-font-family-code: 'Unavailable Code Face', ui-monospace, monospace">
      <ds-code-block language="ts" filename="offline.ts" .code=${SAMPLE}></ds-code-block>
    </div>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-code-block.js';
import { isolatedOverlayDocs } from '../../stories/isolated-overlay-docs';

export default {
  title: 'Conversation/Code block',
  tags: ['autodocs'],
  parameters: { docs: isolatedOverlayDocs('420px') },
} satisfies Meta;
type Story = StoryObj;
export const Playground: Story = { render: () => html`<ds-code-block language="ts" filename="example.ts" code="const ready = true"></ds-code-block>` };

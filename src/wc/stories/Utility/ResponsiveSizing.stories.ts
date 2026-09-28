import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';
import '../../../../dist/components/ds-text.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-input.js';
import '../../../../dist/components/ds-textarea.js';
import '../../../../dist/components/ds-message-composer.js';
import '../../../../dist/components/ds-mobile-header.js';
import '../../../../dist/components/ds-mobile-bar-nav.js';

const meta: Meta = {
  title: 'Utility/Responsive Sizing',
  parameters: {
    layout: 'fullscreen',
    viewport: { options: MINIMAL_VIEWPORTS },
    docs: {
      description: {
        component:
          'One unchanged medium recipe at desktop and mobile viewport sizes. The global responsive stylesheet activates below 768px. Resize the canvas to inspect the transition; fixed wrapper widths alone do not activate it.',
      },
    },
  },
  render: () => html`
    <main style="display:grid;gap:var(--dimension-space-200);padding:var(--dimension-space-200);">
      <ds-text as="h1" variant="text-title-large">Responsive sizing</ds-text>
      <ds-text variant="text-body-medium"
        >Controls keep their size props while typography, icons, spacing, and radii scale
        together.</ds-text
      >
      <div style="display:flex;flex-wrap:wrap;gap:var(--dimension-space-100);">
        ${(['xs', 'sm', 'md', 'lg'] as const).map(
          size => html`<ds-button-filled size=${size} icon="Plus" label=${size}></ds-button-filled>`
        )}
      </div>
      <ds-input aria-label="Search drivers" placeholder="Search drivers" width="fill"></ds-input>
      <ds-textarea aria-label="Review notes" placeholder="Review notes" width="fill"></ds-textarea>
      <ds-message-composer label="Message" placeholder="Write a message"></ds-message-composer>
      <ds-mobile-header heading="Navigation baseline"></ds-mobile-header>
      <ds-mobile-bar-nav></ds-mobile-bar-nav>
    </main>
  `,
};
export default meta;
type Story = StoryObj;
export const Desktop: Story = { globals: { viewport: { value: 'desktop', isRotated: false } } };
export const Mobile: Story = { globals: { viewport: { value: 'mobile1', isRotated: false } } };

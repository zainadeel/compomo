import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-scroll-overlay.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-text.js';

export default {
  title: 'Utility/ScrollOverlay',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta;

type Story = StoryObj;

const rows = Array.from({ length: 12 }, (_, index) => `Scrollable item ${index + 1}`);

export const FooterAction: Story = {
  render: () => html`
    <div
      style="
        width:var(--dimension-panel-width-xs);
        height:420px;
        background:var(--color-background-secondary);
      "
    >
      <ds-scroll-overlay scroll-label="Scrollable action example">
        <div
          style="
            display:flex;
            flex-direction:column;
            gap:var(--dimension-space-050);
            padding:var(--dimension-space-100);
          "
        >
          ${rows.map(
            row => html`
              <ds-text
                style="padding:var(--dimension-space-100);"
                variant="text-body-medium"
                color="primary"
              >
                ${row}
              </ds-text>
            `,
          )}
        </div>
        <div slot="overlay" style="padding:var(--dimension-space-100);">
          <ds-button-filled
            variant="icon-label"
            icon="Plus"
            label="Create item"
            rounded
            width="fill"
          ></ds-button-filled>
        </div>
      </ds-scroll-overlay>
    </div>
  `,
};

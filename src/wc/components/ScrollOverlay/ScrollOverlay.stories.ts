import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-scroll-overlay.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-text.js';

export default {
  title: 'Utility/ScrollOverlay',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta;

type Story = StoryObj;

const rows = Array.from({ length: 12 }, (_, index) => `Scrollable item ${index + 1}`);

export const Reconnection: Story = {
  render: () => {
    let overlay: HTMLDsScrollOverlayElement | undefined;
    let footerDetails: HTMLElement | undefined;
    const reinsert = () => {
      const parent = overlay?.parentElement;
      if (!overlay || !parent) return;
      overlay.remove();
      parent.append(overlay);
    };
    const resizeFooter = () => {
      if (footerDetails) footerDetails.hidden = !footerDetails.hidden;
    };
    return html`
      <div style="display:grid;gap:var(--dimension-space-200);width:320px;">
        <ds-text as="p" variant="text-body-small" color="secondary">
          Reinsert the scrollport, then change the footer height. The fade and end clearance should
          continue following the footer.
        </ds-text>
        <div style="display:flex;gap:var(--dimension-space-100);">
          <ds-button-unfilled label="Reinsert" @dsClick=${reinsert}></ds-button-unfilled>
          <ds-button-unfilled label="Resize footer" @dsClick=${resizeFooter}></ds-button-unfilled>
        </div>
        <div style="height:320px;background:var(--color-background-secondary);">
          <ds-scroll-overlay
            scroll-label="Retained scrollport"
            ${ref(element => {
              overlay = element as HTMLDsScrollOverlayElement | undefined;
            })}
          >
            <div
              style="display:grid;gap:var(--dimension-space-200);padding:var(--dimension-space-200);"
            >
              ${rows.map(row => html`<ds-text variant="text-body-medium">${row}</ds-text>`)}
            </div>
            <div slot="overlay" style="padding:var(--dimension-space-100);">
              <div
                style="display:grid;gap:var(--dimension-space-100);background:var(--color-background-secondary);"
              >
                <div
                  hidden
                  ${ref(element => {
                    footerDetails = element as HTMLElement | undefined;
                  })}
                >
                  <ds-text variant="text-body-small" color="secondary">
                    New items will appear at the end of the list. The footer can grow to explain the
                    next action.
                  </ds-text>
                </div>
                <ds-button-filled label="Create item" width="fill"></ds-button-filled>
              </div>
            </div>
          </ds-scroll-overlay>
        </div>
      </div>
    `;
  },
};

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
            `
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

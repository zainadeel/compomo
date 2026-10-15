import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-popover.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';
import '../../../../dist/components/ds-calendar.js';
import '../../../../dist/components/ds-field.js';
import '../../../../dist/components/ds-input.js';
import '../../../../dist/components/ds-switch.js';
import '../../../../dist/components/ds-text.js';

const meta: Meta = {
  title: 'Overlay/Popover',
  argTypes: {
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    popoverWidth: { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
  },
  args: {
    side: 'bottom',
    align: 'start',
    popoverWidth: 'sm',
  },
};

export default meta;
type Story = StoryObj;

const stage = (content: unknown) => html`
  <div
    style="display:flex;flex-wrap:wrap;gap:var(--dimension-space-200);align-items:flex-start;min-height:420px;padding:var(--dimension-space-300);box-sizing:border-box;"
  >
    ${content}
  </div>
`;

/** Wire a trigger button to the popover that follows it: toggle open and mirror expanded state. */
const toggle = (event: CustomEvent<MouseEvent>) => {
  const trigger = event.currentTarget as HTMLDsButtonUnfilledElement;
  const popover = trigger.nextElementSibling as HTMLDsPopoverElement | null;
  if (!popover) return;
  popover.anchor = trigger;
  popover.open = !popover.open;
  trigger.expanded = popover.open;
  trigger.surfaceOpen = popover.open;
};

/** dsClose fires before open flips to false, so clear the trigger state directly. */
const syncTrigger = (event: Event) => {
  const popover = event.currentTarget as HTMLDsPopoverElement;
  const trigger = popover.previousElementSibling as HTMLDsButtonUnfilledElement | null;
  if (!trigger) return;
  trigger.expanded = false;
  trigger.surfaceOpen = false;
};

const closeOwningPopover = (event: Event) => {
  const popover = (event.currentTarget as HTMLElement | null)?.closest(
    'ds-popover'
  ) as HTMLDsPopoverElement | null;
  if (popover) popover.open = false;
};

const shareContent = html`
  <div style="display:grid;gap:var(--dimension-space-150);">
    <ds-field label="Link">
      <ds-input value="https://app.gomotive.com/v/fleet-view-221" read-only></ds-input>
    </ds-field>
    <div style="display:flex;align-items:center;gap:var(--dimension-space-100);">
      <ds-switch checked aria-label="Include current filters"></ds-switch>
      <ds-text as="span" variant="text-body-medium">Include current filters</ds-text>
    </div>
    <ds-button-filled
      variant="label"
      label="Copy link"
      intent="brand"
      contrast="bold"
      @dsClick=${closeOwningPopover}
    ></ds-button-filled>
  </div>
`;

export const Playground: Story = {
  render: args =>
    stage(html`
      <span style="display:contents;">
        <ds-button-unfilled
          id="popover-playground-trigger"
          label="Share"
          has-border
          haspopup="dialog"
          expanded
          surface-open
          @dsClick=${toggle}
        ></ds-button-unfilled>
        <ds-popover
          ?open=${true}
          anchor-id="popover-playground-trigger"
          popover-label="Share view"
          side=${args['side'] ?? 'bottom'}
          align=${args['align'] ?? 'start'}
          popover-width=${args['popoverWidth'] ?? 'sm'}
          @dsClose=${syncTrigger}
        >
          ${shareContent}
        </ds-popover>
      </span>
    `),
};

/** Untitled popover for short supplementary help anchored to an icon button. */
export const ContextualHelp: Story = {
  render: () =>
    stage(html`
      <div style="display:flex;align-items:center;gap:var(--dimension-space-050);">
        <ds-text as="span" variant="text-body-medium" emphasis>Idle time</ds-text>
        <ds-button-unfilled
          id="popover-help-trigger"
          variant="icon"
          icon="QuestionCircle"
          size="sm"
          aria-label="About idle time"
          has-border="false"
          haspopup="dialog"
          expanded
          surface-open
          @dsClick=${toggle}
        ></ds-button-unfilled>
        <ds-popover
          ?open=${true}
          anchor-id="popover-help-trigger"
          popover-label="About idle time"
          popover-width="sm"
          @dsClose=${syncTrigger}
        >
          <ds-text as="p" variant="text-body-small" color="secondary" wrap="wrap">
            Engine-on time while the vehicle is stationary for more than 5 minutes. Excludes PTO use
            when the gateway reports it.
          </ds-text>
        </ds-popover>
      </div>
    `),
};

/** Interactive trigger: click toggles, Escape and outside clicks dismiss, Tab continues past it. */
export const TriggerBehavior: Story = {
  render: () =>
    stage(html`
      <span style="display:contents;">
        <ds-button-unfilled
          label="Display options"
          has-border
          haspopup="dialog"
          @dsClick=${toggle}
        ></ds-button-unfilled>
        <ds-popover popover-label="Display options" @dsClose=${syncTrigger}>
          <div style="display:grid;gap:var(--dimension-space-100);">
            <div style="display:flex;align-items:center;gap:var(--dimension-space-100);">
              <ds-switch checked aria-label="Show vehicle labels"></ds-switch>
              <ds-text as="span" variant="text-body-medium">Show vehicle labels</ds-text>
            </div>
            <div style="display:flex;align-items:center;gap:var(--dimension-space-100);">
              <ds-switch aria-label="Cluster nearby vehicles"></ds-switch>
              <ds-text as="span" variant="text-body-medium">Cluster nearby vehicles</ds-text>
            </div>
          </div>
        </ds-popover>
      </span>
      <ds-button-unfilled label="Next control" has-border></ds-button-unfilled>
    `),
};

/**
 * Lists and calendars bring their own inset, so bodyInset="none" sets them on the
 * 4px frame, matching the InputDate picker popup.
 */
export const FlushContent: Story = {
  render: () =>
    stage(html`
      <span style="display:contents;">
        <ds-button-unfilled
          id="popover-flush-trigger"
          label="Pick a date"
          has-border
          haspopup="dialog"
          expanded
          surface-open
          @dsClick=${toggle}
        ></ds-button-unfilled>
        <ds-popover
          ?open=${true}
          anchor-id="popover-flush-trigger"
          popover-label="Choose date"
          body-inset="none"
          @dsClose=${syncTrigger}
        >
          <ds-calendar selection-mode="single" style="--ds-calendar-padding: 0;"></ds-calendar>
        </ds-popover>
      </span>
    `),
};

/** Placement flips when the preferred side does not fit. */
export const Placement: Story = {
  render: () =>
    stage(html`
      <div
        style="display:grid;grid-template-columns:repeat(2,max-content);gap:var(--dimension-space-800) calc(var(--dimension-space-800) * 4);padding:calc(var(--dimension-space-800) * 1.5) var(--dimension-space-800);"
      >
        ${(['top', 'right', 'bottom', 'left'] as const).map(
          side => html`
            <span style="display:contents;">
              <ds-button-unfilled
                id=${`popover-side-${side}`}
                label=${side}
                has-border
              ></ds-button-unfilled>
              <ds-popover
                ?open=${true}
                anchor-id=${`popover-side-${side}`}
                side=${side}
                align="center"
                popover-width="xs"
                popover-label=${`${side} placement`}
              >
                <ds-text as="p" variant="text-body-small" color="secondary">
                  ${`side="${side}"`}
                </ds-text>
              </ds-popover>
            </span>
          `
        )}
      </div>
    `),
};

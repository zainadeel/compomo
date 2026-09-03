import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-field.js';
import '../../../../dist/components/ds-textarea.js';

const meta: Meta = {
  title: 'Form/Textarea',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    rows: { control: { type: 'number', min: 1, step: 1 } },
    size: { control: 'select', options: ['lg', 'md', 'sm', 'xs'] },
    resize: { control: 'select', options: ['vertical', 'none'] },
    width: { control: 'select', options: ['fill', 'hug'] },
    hasBorder: { control: 'boolean' },
    hasInteractionFill: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    required: { control: 'boolean' },
    error: { control: 'boolean' },
    errorMessage: { control: 'text' },
    spellCheck: { control: 'boolean' },
  },
  args: {
    value: '',
    placeholder: 'Add a note',
    rows: 4,
    size: 'md',
    resize: 'vertical',
    width: 'fill',
    hasBorder: true,
    hasInteractionFill: true,
    readOnly: false,
    isInactive: false,
    required: false,
    error: false,
    errorMessage: 'Add a note before continuing.',
    spellCheck: true,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:360px;">
      <ds-textarea
        .value=${args['value'] ?? ''}
        placeholder=${args['placeholder'] ?? ''}
        .rows=${args['rows'] ?? 4}
        size=${args['size'] ?? 'md'}
        resize=${args['resize'] ?? 'vertical'}
        width=${args['width'] ?? 'fill'}
        .hasBorder=${args['hasBorder']}
        .hasInteractionFill=${args['hasInteractionFill']}
        ?read-only=${args['readOnly']}
        ?is-inactive=${args['isInactive']}
        ?required=${args['required']}
        ?error=${args['error']}
        error-message=${args['errorMessage'] ?? ''}
        .spellCheck=${args['spellCheck']}
        aria-label="Note"
      ></ds-textarea>
    </div>
  `,
};

export const WithField: Story = {
  render: () => html`
    <div style="width:360px;">
      <ds-field
        label="Internal note"
        description="Share context that will help the next person understand this event."
      >
        <ds-textarea name="note" placeholder="Add relevant context" rows="4" required></ds-textarea>
      </ds-field>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="width:360px;display:flex;flex-direction:column;gap:var(--dimension-space-200);">
      ${(['lg', 'md', 'sm', 'xs'] as const).map(
        size => html`
          <ds-field label=${`${size.toUpperCase()} textarea`}>
            <ds-textarea
              size=${size}
              rows="3"
              value=${`${size.toUpperCase()} multiline value\nSecond line`}
              resize="none"
            ></ds-textarea>
          </ds-field>
        `
      )}
    </div>
  `,
};

export const States: Story = {
  render: () => html`
    <div style="width:360px;display:flex;flex-direction:column;gap:var(--dimension-space-200);">
      <ds-field label="Default" description="Vertical resizing is available by default.">
        <ds-textarea placeholder="Add a note"></ds-textarea>
      </ds-field>
      <ds-field label="Filled">
        <ds-textarea value="The vehicle was inspected before returning to service."></ds-textarea>
      </ds-field>
      <ds-field label="Read only" description="Read-only values remain focusable and submittable.">
        <ds-textarea value="This note is locked after approval." read-only></ds-textarea>
      </ds-field>
      <ds-field label="Inactive" description="Inactive fields are omitted from submission.">
        <ds-textarea value="Unavailable note" is-inactive></ds-textarea>
      </ds-field>
      <ds-field label="Note" error error-message="Add a note before continuing.">
        <ds-textarea placeholder="Add a note" required></ds-textarea>
      </ds-field>
      <ds-field label="Embedded surface">
        <ds-textarea
          value="No field-owned border or interaction wash."
          .hasBorder=${false}
          .hasInteractionFill=${false}
          resize="none"
        ></ds-textarea>
      </ds-field>
    </div>
  `,
};

export const ResizeBehavior: Story = {
  render: () => html`
    <div style="width:360px;display:grid;gap:var(--dimension-space-200);">
      <ds-field label="Resizable" description="Drag the lower edge to add writing space.">
        <ds-textarea rows="3" resize="vertical"></ds-textarea>
      </ds-field>
      <ds-field label="Fixed height" description="Use when the surrounding layout owns the height.">
        <ds-textarea rows="3" resize="none"></ds-textarea>
      </ds-field>
    </div>
  `,
};

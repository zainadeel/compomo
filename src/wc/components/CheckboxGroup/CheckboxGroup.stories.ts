import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-checkbox-group.js';
import '../../../../dist/components/ds-checkbox.js';

const meta: Meta = {
  title: 'Form/Checkbox Group',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    size: { control: 'select', options: ['lg', 'md', 'sm', 'xs'] },
  },
  args: {
    label: 'Select preferences',
    size: 'md',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-checkbox-group label=${args['label']} size=${args['size']}>
      <ds-checkbox label="First option" size=${args['size']} checked></ds-checkbox>
      <ds-checkbox label="Second option" size=${args['size']}></ds-checkbox>
      <ds-checkbox label="Third option" size=${args['size']}></ds-checkbox>
    </ds-checkbox-group>
  `,
};

export const WithDescriptions: Story = {
  render: () => html`
    <div style="width:min(420px, 90vw);">
      <ds-checkbox-group label="Select preferences">
        <ds-checkbox
          label="First option"
          description="Supporting information for the first option."
          checked
        ></ds-checkbox>
        <ds-checkbox
          label="Second option"
          description="Supporting information for the second option."
        ></ds-checkbox>
      </ds-checkbox-group>
    </div>
  `,
};

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: 'Accept terms',
    checked: false,
    disabled: false,
  },
  render: args => {
    const [checked, setChecked] = useState(args.checked ?? false);
    return <Checkbox {...args} checked={checked} onChange={setChecked} />;
  },
};

export const Checked: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return <Checkbox label="Accept terms" checked={checked} onChange={setChecked} />;
  },
};

export const Indeterminate: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        label="Select all"
        checked={checked}
        indeterminate={!checked}
        onChange={setChecked}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    label: 'Unavailable option',
    checked: false,
    disabled: true,
  },
};

export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        label="I agree to the terms and conditions"
        checked={checked}
        onChange={setChecked}
      />
    );
  },
};

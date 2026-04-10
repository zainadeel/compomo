import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Primitives/Toggle',
  component: Toggle,
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: {
    checked: false,
    disabled: false,
    'aria-label': 'Toggle',
  },
  render: args => {
    const [checked, setChecked] = useState(args.checked ?? false);
    return <Toggle {...args} checked={checked} onChange={setChecked} />;
  },
};

export const Checked: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return <Toggle checked={checked} onChange={setChecked} aria-label="Toggle" />;
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    'aria-label': 'Toggle',
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    'aria-label': 'Toggle',
  },
};

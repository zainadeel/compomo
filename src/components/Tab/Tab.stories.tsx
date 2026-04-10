import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tab } from './Tab';

const meta: Meta<typeof Tab> = {
  title: 'Primitives/Tab',
  component: Tab,
};

export default meta;
type Story = StoryObj<typeof Tab>;

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState('overview');
    const tabs = ['Overview', 'Activity', 'Settings', 'Members'];
    return (
      <div style={{ display: 'flex', gap: 0, padding: 24 }}>
        {tabs.map(tab => (
          <Tab
            key={tab}
            label={tab}
            isSelected={selected === tab.toLowerCase()}
            onClick={() => setSelected(tab.toLowerCase())}
          />
        ))}
      </div>
    );
  },
};

export const SingleTab: Story = {
  args: {
    label: 'Selected Tab',
    isSelected: true,
  },
};

export const UnselectedTab: Story = {
  args: {
    label: 'Unselected Tab',
    isSelected: false,
  },
};

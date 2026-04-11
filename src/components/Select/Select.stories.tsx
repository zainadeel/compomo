import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
};

export default meta;
type Story = StoryObj<typeof Select>;

const fruitOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | number>('');
    return (
      <div style={{ width: 260, padding: 24 }}>
        <Select
          value={value}
          onChange={setValue}
          options={fruitOptions}
          placeholder="Select a fruit"
        />
      </div>
    );
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState<string | number>('cherry');
    return (
      <div style={{ width: 260, padding: 24 }}>
        <Select value={value} onChange={setValue} options={fruitOptions} />
      </div>
    );
  },
};

export const Inactive: Story = {
  render: () => (
    <div style={{ width: 260, padding: 24 }}>
      <Select
        value="banana"
        onChange={() => {}}
        options={fruitOptions}
        inactive
      />
    </div>
  ),
};

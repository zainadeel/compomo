import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Tag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'Primitives/Tag',
  component: Tag,
  argTypes: {
    intent: { control: 'select', options: ['positive', 'negative', 'warning', 'caution', 'neutral', 'brand', 'ai', 'walkthrough', 'guide'] },
    contrast: { control: 'select', options: ['faint', 'medium', 'strong', 'bold'] },
    tagStyle: { control: 'select', options: ['filled', 'outline'] },
    size: { control: 'select', options: ['md', 'sm', 'xs'] },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: {
    label: 'Tag',
  },
};

export const Intents: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <Tag label="Positive" intent="positive" />
      <Tag label="Negative" intent="negative" />
      <Tag label="Warning" intent="warning" />
      <Tag label="Caution" intent="caution" />
      <Tag label="Neutral" intent="neutral" />
      <Tag label="Brand" intent="brand" />
      <Tag label="AI" intent="ai" />
      <Tag label="Walkthrough" intent="walkthrough" />
      <Tag label="Guide" intent="guide" />
    </div>
  ),
};

export const Contrasts: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag label="Faint" contrast="faint" />
      <Tag label="Medium" contrast="medium" />
      <Tag label="Strong" contrast="strong" />
      <Tag label="Bold" contrast="bold" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag label="Medium" size="md" />
      <Tag label="Small" size="sm" />
      <Tag label="Extra Small" size="xs" />
    </div>
  ),
};

export const Removable: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag label="Removable" removable onRemove={() => {}} />
      <Tag label="Removable SM" size="sm" removable onRemove={() => {}} />
      <Tag label="Removable XS" size="xs" removable onRemove={() => {}} />
    </div>
  ),
};

export const OutlineVsFilled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag label="Filled" tagStyle="filled" intent="brand" />
      <Tag label="Outline" tagStyle="outline" intent="brand" />
      <Tag label="Filled" tagStyle="filled" intent="positive" />
      <Tag label="Outline" tagStyle="outline" intent="positive" />
      <Tag label="Filled" tagStyle="filled" intent="negative" />
      <Tag label="Outline" tagStyle="outline" intent="negative" />
    </div>
  ),
};

export const Rounded: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Tag label="Default" />
      <Tag label="Rounded" rounded />
      <Tag label="Rounded Brand" rounded intent="brand" />
      <Tag label="Rounded Outline" rounded tagStyle="outline" intent="positive" />
    </div>
  ),
};

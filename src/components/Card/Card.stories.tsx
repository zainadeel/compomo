import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  argTypes: {
    elevation: {
      control: 'select',
      options: ['flat', 'elevated', 'floating'],
    },
    radius: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: 'Card body content goes here.',
    style: { width: 360 },
  },
};

export const WithHeader: Story = {
  args: {
    header: <strong>Account Settings</strong>,
    children: 'Form fields and content go here.',
    style: { width: 360 },
  },
};

export const WithHeaderAndFooter: Story = {
  args: {
    header: <strong>Edit Profile</strong>,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>Name: Zain Adeel</div>
        <div>Email: zain@example.com</div>
      </div>
    ),
    footer: (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button>Cancel</button>
        <button>Save</button>
      </div>
    ),
    style: { width: 360 },
  },
};

export const Elevations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      {(['flat', 'elevated', 'floating'] as const).map(elevation => (
        <Card key={elevation} elevation={elevation} style={{ width: 200 }}>
          {elevation}
        </Card>
      ))}
    </div>
  ),
};

export const Radii: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map(radius => (
        <Card key={radius} radius={radius} style={{ width: 160 }}>
          radius: {radius}
        </Card>
      ))}
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header } from './Header';
import { Button } from '../Button';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    title: 'Page Title',
  },
};

export const WithSlots: Story = {
  render: () => (
    <Header
      title="Dashboard"
      left={<Button variant="tertiary" label="Back" size="sm" />}
      right={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" label="Export" size="sm" />
          <Button variant="primary" label="New" size="sm" />
        </div>
      }
    />
  ),
};

export const CenterContent: Story = {
  render: () => (
    <Header
      left={<Button variant="tertiary" label="Menu" size="sm" />}
      center={<span style={{ fontWeight: 600 }}>App Name</span>}
      right={<Button variant="tertiary" label="Settings" size="sm" />}
    />
  ),
};

export const Backgrounds: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['primary', 'secondary', 'transparent', 'translucent'] as const).map(bg => (
        <Header key={bg} title={`${bg} background`} background={bg} />
      ))}
    </div>
  ),
};

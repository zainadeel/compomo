import type { Meta, StoryObj } from '@storybook/react-vite';
import { Scrollbar } from './Scrollbar';

const meta: Meta<typeof Scrollbar> = {
  title: 'Layout/Scrollbar',
  component: Scrollbar,
};

export default meta;
type Story = StoryObj<typeof Scrollbar>;

const longContent = Array.from({ length: 30 }, (_, i) => (
  <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border-tertiary)' }}>
    Item {i + 1}
  </div>
));

export const Default: Story = {
  render: () => (
    <div style={{ height: 300, width: 260, padding: 24 }}>
      <Scrollbar>
        {longContent}
      </Scrollbar>
    </div>
  ),
};

export const Thick: Story = {
  render: () => (
    <div style={{ height: 300, width: 260, padding: 24 }}>
      <Scrollbar variant="thick">
        {longContent}
      </Scrollbar>
    </div>
  ),
};

export const ShowTrackOnHover: Story = {
  render: () => (
    <div style={{ height: 300, width: 260, padding: 24 }}>
      <Scrollbar showTrackOnHover>
        {longContent}
      </Scrollbar>
    </div>
  ),
};

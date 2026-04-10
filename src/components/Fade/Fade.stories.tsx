import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fade } from './Fade';

const meta: Meta<typeof Fade> = {
  title: 'Layout/Fade',
  component: Fade,
};

export default meta;
type Story = StoryObj<typeof Fade>;

export const Sides: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 24 }}>
      {(['top', 'bottom', 'left', 'right'] as const).map(side => (
        <div
          key={side}
          style={{
            position: 'relative',
            height: 120,
            background: 'var(--color-background-secondary)',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span>{side}</span>
          <Fade side={side} height="40px" />
        </div>
      ))}
    </div>
  ),
};

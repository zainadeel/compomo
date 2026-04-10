import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorBoundary } from './ErrorBoundary';

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

const ThrowingComponent = () => {
  throw new Error('Something went wrong!');
};

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <ThrowingComponent />
    </ErrorBoundary>
  ),
};

export const WithCustomFallback: Story = {
  render: () => (
    <ErrorBoundary fallback={<div style={{ padding: 24, color: 'var(--color-foreground-bold-negative)' }}>Custom error UI</div>}>
      <ThrowingComponent />
    </ErrorBoundary>
  ),
};

export const NoError: Story = {
  render: () => (
    <ErrorBoundary>
      <div style={{ padding: 24 }}>This content renders normally.</div>
    </ErrorBoundary>
  ),
};

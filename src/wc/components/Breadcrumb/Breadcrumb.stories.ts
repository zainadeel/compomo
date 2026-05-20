import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-breadcrumb.js';

const meta: Meta = {
  title: 'Navigation/Breadcrumb',
  tags: ['autodocs'],
  argTypes: {
    separator: { control: 'text' },
  },
  args: { separator: '/' },
};

export default meta;
type Story = StoryObj;

const items = [
  { label: 'Home', href: '/' },
  { label: 'Settings', href: '/settings' },
  { label: 'Profile' },
];

export const Playground: Story = {
  render: args => html`
    <ds-breadcrumb
      .items=${items}
      separator=${args['separator'] ?? '/'}
    ></ds-breadcrumb>
  `,
};

export const WithLinks: Story = {
  render: () => html`
    <ds-breadcrumb .items=${[
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Fleet', href: '/fleet' },
      { label: 'Vehicle #4821' },
    ]}></ds-breadcrumb>
  `,
};

export const TwoItems: Story = {
  render: () => html`
    <ds-breadcrumb .items=${[
      { label: 'Reports', href: '/reports' },
      { label: 'Monthly Summary' },
    ]}></ds-breadcrumb>
  `,
};

export const CustomSeparator: Story = {
  render: () => html`
    <ds-breadcrumb
      .items=${items}
      separator="›"
    ></ds-breadcrumb>
  `,
};

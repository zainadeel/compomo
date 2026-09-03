import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-navigation.js';
import '../../../../dist/components/ds-text.js';

const WIDTHS = ['sm', 'md', 'lg'] as const;
const VARIANTS = ['navigation-only', 'content'] as const;

const meta: Meta = {
  title: 'Cards/CardNavigation',
  tags: ['autodocs'],
  argTypes: {
    heading: { control: 'text' },
    description: { control: 'text' },
    href: { control: 'text' },
    cardWidth: { control: 'select', options: [...WIDTHS] },
    variant: { control: 'select', options: [...VARIANTS] },
  },
  args: {
    heading: 'Profiles',
    description: 'Manage product settings for groups.',
    href: '#profiles',
    cardWidth: 'md',
    variant: 'navigation-only',
  },
};

export default meta;
type Story = StoryObj;

export const NavigationOnly: Story = {
  render: args => html`
    <ds-card-navigation
      heading=${args['heading']}
      description=${args['description']}
      href=${args['href']}
      card-width=${args['cardWidth']}
      variant="navigation-only"
    />
  `,
};

export const WithContent: Story = {
  args: {
    heading: 'Unsafe Behavior Detection and Event Intelligence',
    description: 'Choose which behaviors to detect and customize driver alerts.',
    variant: 'content',
  },
  render: args => html`
    <ds-card-navigation
      heading=${args['heading']}
      description=${args['description']}
      href=${args['href']}
      card-width=${args['cardWidth']}
      variant="content"
    >
      <div style="padding:var(--dimension-space-200);">
        <ds-text as="p" variant="text-body-medium" color="secondary">
          Current policy summary remains visible while the header opens the detailed settings.
        </ds-text>
      </div>
    </ds-card-navigation>
  `,
};

import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-action-center.js';
import type { CardActionCenterSection } from './CardActionCenter';

const SECTIONS: CardActionCenterSection[] = [
  {
    id: 'action-center',
    heading: 'Action center',
    items: [
      {
        id: 'events-to-review',
        label: 'Events to review',
        value: 44,
        tag: { intent: 'negative' },
      },
      {
        id: 'speeding-events-to-review',
        label: 'Speeding events to review',
        value: 41,
        tag: { intent: 'negative' },
      },
      {
        id: 'dashcam-issues',
        label: 'Dashcam issues',
        value: 182,
        tag: { intent: 'negative' },
      },
    ],
  },
  {
    id: 'reports',
    heading: 'Reports',
    items: [
      { id: 'score-trend', label: 'Safety Score trend', href: '#score-trend' },
      { id: 'score-factors', label: 'Safety Score factors', href: '#score-factors' },
      { id: 'leaderboard', label: 'Performance leaderboard', href: '#leaderboard' },
    ],
  },
  {
    id: 'links',
    heading: 'Links',
    items: [
      { id: 'video-requests', label: 'Video requests' },
      { id: 'connection-history', label: 'Connection history' },
      { id: 'camera-support', label: 'Camera support', isInactive: true },
    ],
  },
];

const meta: Meta = {
  title: 'Cards/CardActionCenter',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A compact grouped-action card for overview rails. Applications provide product copy, values, destinations, permissions, and activation consequences.',
      },
    },
    controls: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <div style="width:var(--dimension-card-width-sm);max-width:100%;">
      <ds-card-action-center .sections=${SECTIONS}></ds-card-action-center>
    </div>
  `,
};

export const TextValues: Story = {
  render: () => html`
    <div style="width:var(--dimension-card-width-sm);max-width:100%;">
      <ds-card-action-center
        .sections=${[
          {
            id: 'fleet',
            heading: 'Fleet status',
            items: [
              { id: 'vehicles', label: 'Active vehicles', value: 128 },
              { id: 'drivers', label: 'Available drivers', value: 96 },
            ],
          },
        ] satisfies CardActionCenterSection[]}
      ></ds-card-action-center>
    </div>
  `,
};

export const Empty: Story = {
  render: () => html`
    <div style="width:var(--dimension-card-width-sm);max-width:100%;">
      <ds-card-action-center
        .sections=${[]}
        empty-message="No actions need attention"
      ></ds-card-action-center>
    </div>
  `,
};

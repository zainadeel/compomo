import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TabGroup } from './TabGroup';

const meta: Meta<typeof TabGroup> = {
  title: 'Classic/TabGroup',
  component: TabGroup,
};

export default meta;
type Story = StoryObj<typeof TabGroup>;

const TABS = [
  { label: 'Overview', id: 'tab-overview', panelId: 'panel-overview' },
  { label: 'Activity', id: 'tab-activity', panelId: 'panel-activity' },
  { label: 'Settings', id: 'tab-settings', panelId: 'panel-settings' },
  { label: 'Members', id: 'tab-members', panelId: 'panel-members' },
];

const Controlled = (props: Partial<React.ComponentProps<typeof TabGroup>>) => {
  const tabs = props.tabs ?? TABS;
  const [active, setActive] = useState(0);
  const current = tabs[active];
  return (
    <div>
      <TabGroup
        tabs={tabs}
        activeIndex={active}
        onTabChange={setActive}
        aria-label="Section navigation"
        {...props}
      />
      <div
        role="tabpanel"
        id={current.panelId}
        aria-labelledby={current.id}
        tabIndex={0}
        style={{ padding: '16px 0', color: 'var(--color-foreground-secondary)', fontSize: 14 }}
      >
        Content for: <strong>{current.label}</strong>
      </div>
    </div>
  );
};

export const Playground: Story = {
  render: () => <Controlled />,
};

export const Default: Story = {
  render: () => <Controlled />,
};

export const ManyTabs: Story = {
  render: () => (
    <Controlled
      tabs={[
        { label: 'Dashboard', id: 'tab-dashboard', panelId: 'panel-dashboard' },
        { label: 'Analytics', id: 'tab-analytics', panelId: 'panel-analytics' },
        { label: 'Reports', id: 'tab-reports', panelId: 'panel-reports' },
        { label: 'Users', id: 'tab-users', panelId: 'panel-users' },
        { label: 'Settings', id: 'tab-settings-many', panelId: 'panel-settings-many' },
        { label: 'Billing', id: 'tab-billing', panelId: 'panel-billing' },
        { label: 'Integrations', id: 'tab-integrations', panelId: 'panel-integrations' },
      ]}
    />
  ),
};

export const TwoTabs: Story = {
  render: () => (
    <Controlled
      tabs={[
        { label: 'Active', id: 'tab-active', panelId: 'panel-active' },
        { label: 'Archived', id: 'tab-archived', panelId: 'panel-archived' },
      ]}
    />
  ),
};

export const WithDisabledTab: Story = {
  render: () => (
    <Controlled
      tabs={[
        { label: 'Overview', id: 'tab-d-overview', panelId: 'panel-d-overview' },
        { label: 'Activity', id: 'tab-d-activity', panelId: 'panel-d-activity', disabled: true },
        { label: 'Settings', id: 'tab-d-settings', panelId: 'panel-d-settings' },
      ]}
    />
  ),
};

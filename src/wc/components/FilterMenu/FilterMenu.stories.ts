import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-filter-menu.js';
import type { FilterMenuFilter, FilterMenuValues } from './FilterMenu';

const filters: FilterMenuFilter[] = [
  {
    id: 'behavior',
    label: 'Behavior',
    kind: 'multiple',
    options: [
      { label: 'Close following', value: 'close-following' },
      { label: 'Distraction', value: 'distraction' },
      { label: 'Drowsiness', value: 'drowsiness' },
    ],
  },
  {
    id: 'severity',
    label: 'Severity',
    kind: 'multiple',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'High', value: 'high' },
      { label: 'Critical', value: 'critical' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    kind: 'multiple',
    options: [
      { label: 'Pending review', value: 'pending' },
      { label: 'Coachable', value: 'coachable' },
      { label: 'Coached', value: 'coached' },
    ],
  },
  {
    id: 'has-notes',
    label: 'Has notes',
    kind: 'boolean',
    fieldLabel: 'Has notes',
    description: 'Only show records with notes',
  },
  {
    id: 'event-date',
    label: 'Date',
    kind: 'date',
  },
];

const values: FilterMenuValues = {
  severity: ['high', 'critical'],
};

const meta: Meta = {
  title: 'Overlay/Filter Menu',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Controlled two-pane filter dialog. The application owns definitions, values, and filtering consequences; Filter Menu owns anchored overlay behavior, category navigation, option controls, counts, clearing, and focus return.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: () => html`
    <div style="padding:var(--dimension-space-200); height:420px">
      <ds-filter-menu
        id="filter-menu-story"
        open
        aria-label="Filter records"
        active-filter-id="severity"
        .filters=${filters}
        .values=${values}
      ></ds-filter-menu>
    </div>
  `,
};

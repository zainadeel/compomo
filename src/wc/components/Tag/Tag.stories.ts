import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-tag.js';

const INTENTS    = ['neutral', 'brand', 'ai', 'negative', 'warning', 'caution', 'positive'];
const CONTRASTS  = ['strong', 'bold', 'medium', 'faint'];
const ELEVATIONS = ['none', 'flat', 'elevated'];
const SIZES      = ['md', 'sm', 'xs'];

const meta: Meta = {
  title: 'Primitives/Tag',
  tags: ['autodocs'],
  argTypes: {
    label:     { control: 'text' },
    intent:    { control: 'select', options: INTENTS },
    contrast:  { control: 'select', options: CONTRASTS },
    elevation: { control: 'select', options: ELEVATIONS },
    size:      { control: 'select', options: SIZES },
    rounded:   { control: 'boolean' },
    removable: { control: 'boolean' },
    inactive:  { control: 'boolean' },
    pressed:   { control: 'boolean' },
    interactive: { control: 'boolean' },
  },
  args: {
    label:     'Tag',
    intent:    'neutral',
    contrast:  'faint',
    elevation: 'none',
    size:      'md',
    rounded:   false,
    removable: false,
    inactive:  false,
    pressed:   false,
    interactive: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-tag
      label=${args['label']}
      intent=${args['intent']}
      contrast=${args['contrast']}
      elevation=${args['elevation']}
      size=${args['size']}
      ?rounded=${args['rounded']}
      ?removable=${args['removable']}
      ?inactive=${args['inactive']}
      ?pressed=${args['pressed']}
      ?interactive=${args['interactive']}
    ></ds-tag>
  `,
};

export const IntentMatrix: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 8px">
      ${CONTRASTS.map(contrast => html`
        <div>
          <div style="font-size: 10px; font-family: monospace; color: #888; margin-bottom: 4px">${contrast}</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            ${INTENTS.map(intent => html`
              <ds-tag label=${intent} intent=${intent} contrast=${contrast}></ds-tag>
            `)}
          </div>
        </div>
      `)}
    </div>
  `,
};

export const Elevations: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap">
      ${ELEVATIONS.map(elevation => html`
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px">
          <ds-tag label=${elevation} intent="brand" contrast="faint" elevation=${elevation}></ds-tag>
          <span style="font-size: 10px; font-family: monospace; color: #888">${elevation}</span>
        </div>
      `)}
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; align-items: center">
      ${SIZES.map(size => html`
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px">
          <ds-tag label=${size} intent="brand" contrast="faint" size=${size}></ds-tag>
          <span style="font-size: 10px; font-family: monospace; color: #888">${size}</span>
        </div>
      `)}
    </div>
  `,
};

export const Removable: Story = {
  render: () => html`
    <div style="display: flex; gap: 8px; flex-wrap: wrap">
      ${SIZES.map(size => html`
        <ds-tag label="Removable" intent="neutral" contrast="faint" size=${size} removable></ds-tag>
      `)}
    </div>
  `,
};

export const Interactive: Story = {
  render: () => html`
    <div style="display: flex; gap: 8px; flex-wrap: wrap">
      <ds-tag label="Click me" intent="neutral" contrast="faint" interactive></ds-tag>
      <ds-tag label="Pressed" intent="brand" contrast="faint" interactive pressed></ds-tag>
      <ds-tag label="Inactive" intent="neutral" contrast="faint" interactive inactive></ds-tag>
    </div>
  `,
};

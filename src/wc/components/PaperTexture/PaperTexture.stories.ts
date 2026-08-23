import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-paper-texture.js';
import {
  DEFAULT_PAPER_TEXTURE_CONFIG,
  type PaperTextureConfig,
  type PaperTextureFit,
} from './paper-texture-types';

type PaperTextureStoryArgs = PaperTextureConfig;

const meta: Meta<PaperTextureStoryArgs> = {
  title: 'Visual/PaperTexture',
  parameters: { layout: 'fullscreen' },
  argTypes: {
    image: {
      control: 'text',
      description: 'Optional image URL. Leave empty to render the texture as a standalone surface.',
    },
    colorFront: {
      control: 'color',
      description: 'Literal shader color; token references are intentionally not supported.',
    },
    colorBack: {
      control: 'color',
      description: 'Literal shader color; token references are intentionally not supported.',
    },
    contrast: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    roughness: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    fiber: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    fiberSize: { control: { type: 'range', min: 0.01, max: 1, step: 0.01 } },
    crumples: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    crumpleSize: { control: { type: 'range', min: 0.01, max: 1, step: 0.01 } },
    folds: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    foldCount: { control: { type: 'range', min: 1, max: 15, step: 1 } },
    fade: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    drops: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    seed: { control: { type: 'range', min: 0, max: 1000, step: 0.1 } },
    fit: {
      control: 'select',
      options: ['none', 'contain', 'cover'] satisfies PaperTextureFit[],
    },
    scale: { control: { type: 'range', min: 0.01, max: 4, step: 0.01 } },
    rotation: { control: { type: 'range', min: 0, max: 360, step: 1 } },
    originX: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    originY: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    offsetX: { control: { type: 'range', min: -1, max: 1, step: 0.01 } },
    offsetY: { control: { type: 'range', min: -1, max: 1, step: 0.01 } },
    worldWidth: { control: { type: 'number', min: 0 } },
    worldHeight: { control: { type: 'number', min: 0 } },
    speed: {
      control: { type: 'range', min: -2, max: 2, step: 0.01 },
      description: 'Zero renders a static frame with no recurring animation loop.',
    },
    frame: { control: { type: 'number', min: 0 } },
    minPixelRatio: { control: { type: 'range', min: 0.5, max: 3, step: 0.1 } },
    maxPixelCount: { control: { type: 'number', min: 262144, step: 262144 } },
    opacity: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  },
};

export default meta;
type Story = StoryObj<PaperTextureStoryArgs>;

export const Playground: Story = {
  name: 'Parameter playground',
  args: { ...DEFAULT_PAPER_TEXTURE_CONFIG },
  render: args => {
    const config: PaperTextureConfig = { ...args };
    return html`
      <div
        style="
          min-height: 100vh;
          box-sizing: border-box;
          padding: 48px;
          display: grid;
          place-items: center;
          background: var(--color-background-primary, #f4f4f4);
          font-family: var(--typography-font-family-ui, system-ui);
        "
      >
        <div
          style="
            position: relative;
            width: min(1180px, 100%);
            min-height: min(680px, calc(100vh - 96px));
            overflow: hidden;
            border-radius: 24px;
            background: linear-gradient(135deg, #2d3440 0%, #8f98a5 48%, #ded9cf 100%);
            box-shadow: 0 24px 80px rgb(20 24 32 / 18%);
          "
        >
          <ds-paper-texture .config=${config}></ds-paper-texture>
          <div
            style="
              position: relative;
              z-index: 1;
              display: grid;
              align-content: end;
              min-height: inherit;
              box-sizing: border-box;
              padding: 40px;
              color: #ffffff;
              text-shadow: 0 1px 2px rgb(0 0 0 / 32%);
              pointer-events: none;
            "
          >
            <div style="font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;">
              ds-paper-texture
            </div>
            <div
              style="max-width: 520px; margin-top: 12px; font-size: clamp(32px, 5vw, 68px); line-height: 0.98;"
            >
              Tune the material, then decide whether to bake it.
            </div>
            <div
              style="max-width: 520px; margin-top: 20px; font-size: 14px; line-height: 1.5; opacity: 0.82;"
            >
              The initial frame is static by default. Set speed above zero only when evaluating
              motion.
            </div>
          </div>
        </div>
      </div>
    `;
  },
};

import type { Preview } from '@storybook/web-components';
import '@ds-mo/tokens';
import '@ds-mo/tokens/dimensions';
import '@ds-mo/tokens/reset';
import '@ds-mo/tokens/globals';
import '@ds-mo/tokens/utilities';
import './docs.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Toggle light/dark theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    animSpeed: {
      description: 'Animation speed multiplier — slow down to inspect transitions',
      toolbar: {
        title: 'Anim speed',
        icon: 'timer',
        items: [
          { value: '1',  title: '1× (normal)'  },
          { value: '2',  title: '2×'            },
          { value: '5',  title: '5×'            },
          { value: '10', title: '10×'           },
          { value: '20', title: '20×'           },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    animSpeed: '1',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals['theme'] || 'light';
      const speed = context.globals['animSpeed'] || '1';
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.setProperty('--ds-panel-nav-speed', speed);

      // For fullscreen stories let the story control its own background.
      // For padded/centered stories apply the surface token so the canvas
      // isn't stuck on browser-default white when switching to dark theme.
      const layout = context.parameters['layout'] ?? 'padded';
      if (layout === 'fullscreen') {
        document.body.style.removeProperty('background-color');
      } else {
        document.body.style.setProperty('background-color', 'var(--color-background-primary)');
      }

      return Story();
    },
  ],
  parameters: {
    options: {
      // Storybook 10 ships Controls in core; keep the panel visible so
      // Playground stories can expose their args.
      showPanel: true,
      storySort: {
        order: [
          'Docs',
          ['Introduction', 'Typography Usage', 'Color Usage', 'Elevation Usage', 'Selection Patterns'],
          'Foundation',
          ['Colors Semantic', 'Colors Data', 'Iconography', 'Typography'],
          'Primitives',
          [
            'Text',
            'Icon',
            'ButtonFilled',
            'ButtonUnfilled',
            'Tag',
            'Chip',
            'Badge',
            'Divider',
            'Loader',
            'Skeleton',
          ],
          'Utility',
          [
            'InteractionFill',
            'ControlInactive',
            'ControlDensity',
            'FocusRing',
            'ScrollEdgeFade',
            'Choice Lists',
          ],
        ],
      },
    },
    controls: {
      matchers: {
        color: /(^background$|color$)/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // The baselined Playwright suite owns automated scans. Keep the addon panel
      // available for manual inspection without racing a second after-story Axe run.
      test: 'off',
      // Keep the interactive panel focused on rendered Stencil components instead of
      // Storybook captions. CI narrows this further to top-level component fixtures.
      context: { include: '#storybook-root .hydrated' },
      // The region rule is noisy for isolated components without page landmarks.
      config: {
        rules: [{ id: 'region', enabled: false }],
      },
    },
    backgrounds: { disable: true },
  },
};

export default preview;

import type { Preview } from '@storybook/web-components';
import '@ds-mo/tokens';
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
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals['theme'] || 'light';
      document.documentElement.setAttribute('data-theme', theme);

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
    // Hide the bottom addon panel globally — we only ship @storybook/addon-docs
    // so the panel has no content and just steals canvas height.
    options: {
      showPanel: false,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
  },
};

export default preview;

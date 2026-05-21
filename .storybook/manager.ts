import { addons } from '@storybook/manager-api';

addons.setConfig({
  // We only ship @storybook/addon-docs — the bottom panel has no content.
  // Hide it so the canvas fills the full available height.
  showPanel: false,
  panelPosition: 'bottom',
  // Keep the sidebar and toolbar open.
  showNav: true,
  showToolbar: true,
  enableShortcuts: true,
});

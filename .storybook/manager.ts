// @storybook/manager-api was consolidated into the storybook package in v10
import { addons } from 'storybook/manager-api';

addons.setConfig({
  // Storybook 10 ships Controls in core; keep the panel visible for
  // Playground stories.
  showPanel: true,
  panelPosition: 'bottom',
  // Keep the sidebar and toolbar open.
  showNav: true,
  showToolbar: true,
  enableShortcuts: true,
});

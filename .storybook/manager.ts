// @storybook/manager-api was consolidated into the storybook package in v10
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import pkg from '../package.json';

const brandTitle = `${pkg.name} v${pkg.version}`;

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle,
    brandUrl: 'https://github.com/zainadeel/compomo',
    brandImage: './favicon.svg',
    brandTarget: '_self',
  }),
  // Storybook 10 ships Controls in core; keep the panel visible for
  // Playground stories.
  showPanel: true,
  panelPosition: 'bottom',
  // Keep the sidebar and toolbar open.
  showNav: true,
  showToolbar: true,
  enableShortcuts: true,
});

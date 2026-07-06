// @storybook/manager-api was consolidated into the storybook package in v10
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import pkg from '../package.json';

const packageLabel = `${pkg.name} v${pkg.version}`;

// Storybook renders brandImage OR brandTitle, not both. With brandImage: null the
// title is injected as HTML — embed the favicon so the sidebar shows both.
const brandTitle = `<img class="brand-favicon" src="./favicon.svg" alt="" />${packageLabel}`;

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle,
    brandUrl: 'https://github.com/zainadeel/compomo',
    brandImage: null,
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

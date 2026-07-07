// @storybook/manager-api was consolidated into the storybook package in v10
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import pkg from '../package.json';

function setBrandTheme(name: string, version: string) {
  const packageLabel = `${name} v${version}`;
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
    // Storybook 10 ships Controls in core; keep the panel visible for Playground stories.
    showPanel: true,
    panelPosition: 'bottom',
    showNav: true,
    showToolbar: true,
    enableShortcuts: true,
  });
}

// Immediate fallback from bundled package.json (storybook:build / first paint).
setBrandTheme(pkg.name, pkg.version);

// Runtime file from write-build-stamp — updates sidebar after git pull + stencil rebuild
// without restarting the Storybook Node process (manager re-fetches on page reload).
void fetch('./package-version.json', { cache: 'no-store' })
  .then(res => (res.ok ? res.json() : null))
  .then(data => {
    if (data?.name && data?.version) {
      setBrandTheme(data.name, data.version);
    }
  })
  .catch(() => {});

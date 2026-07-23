// @storybook/manager-api was consolidated into the storybook package in v10
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import pkg from '../package.json';

const SIDEBAR_INITIALISMS = new Map([
  ['ai', 'AI'],
  ['api', 'API'],
  ['css', 'CSS'],
  ['dom', 'DOM'],
  ['gfm', 'GFM'],
  ['html', 'HTML'],
  ['js', 'JS'],
  ['json', 'JSON'],
  ['mcp', 'MCP'],
  ['mdx', 'MDX'],
  ['rtl', 'RTL'],
  ['spa', 'SPA'],
  ['svg', 'SVG'],
  ['ts', 'TS'],
  ['ui', 'UI'],
  ['url', 'URL'],
]);

function sentenceCaseSidebarLabel(label: string): string {
  const words = label
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/(\s+)/);

  let isFirstWord = true;

  return words
    .map(part => {
      if (/^\s+$/.test(part)) return part;

      const token = part.match(/^([^A-Za-z0-9]*)([A-Za-z0-9]+)([^A-Za-z0-9]*)$/);
      const prefix = token?.[1] ?? '';
      const word = token?.[2] ?? part;
      const suffix = token?.[3] ?? '';
      const initialism = SIDEBAR_INITIALISMS.get(word.toLowerCase());
      if (initialism) {
        isFirstWord = false;
        return `${prefix}${initialism}${suffix}`;
      }

      const normalized = word.toLowerCase();
      if (!isFirstWord) return `${prefix}${normalized}${suffix}`;

      isFirstWord = false;
      return `${prefix}${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}${suffix}`;
    })
    .join('');
}

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
    sidebar: {
      renderLabel: item => sentenceCaseSidebarLabel(item.name),
    },
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

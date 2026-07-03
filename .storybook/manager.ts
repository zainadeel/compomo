// @storybook/manager-api was consolidated into the storybook package in v10
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import pkg from '../package.json';

/** Human-readable stamp for the Storybook sidebar — not a live npm lookup. */
function formatBuiltAt(value: string | undefined): string {
  if (!value || value === 'local') return 'local dev';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date);
}

const builtAt = formatBuiltAt(process.env.STORYBOOK_BUILT_AT);
const brandTitle = `@ds-mo/ui · v${pkg.version} — ${builtAt}`;

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle,
    brandUrl: 'https://github.com/zainadeel/compomo',
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

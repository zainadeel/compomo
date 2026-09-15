import rules from './rules.js';
import text from './local/index.js';
import opacity from './local/no-raw-opacity.js';
import motion from './local/require-reduced-motion.js';
import settings from './settings.js';
const exported = {
  ...rules,
  'no-ds-text-metric-overrides': text,
  'no-raw-opacity': opacity,
  'require-reduced-motion': motion,
};

for (const [name, entry] of Object.entries(settings)) {
  const rule = exported[name.replace('local/', '')];
  const [primary, secondary = {}] = entry;
  const { severity: _severity, ...options } = secondary;
  rule.meta.defaultOptions = [primary, ...(Object.keys(options).length ? [options] : [])];
}
export default exported;

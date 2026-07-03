/** Bubbling/composed events — `ds-app-shell` and `ds-bar-nav` coordinate during width motion. */

export const CHROME_TRANSITION_START = 'dsChromeTransitionStart';
export const CHROME_TRANSITION_END = 'dsChromeTransitionEnd';

export type ChromeTransitionSource = 'panel-nav' | 'panel-tools';

export interface ChromeTransitionDetail {
  source: ChromeTransitionSource;
}
